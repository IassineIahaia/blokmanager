import 'server-only'
import { Prisma, type OrderStatus, type PaymentMethod } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { ApiError } from '@/lib/api'
import {
  ORDER_STATUS_LABEL,
  ORDER_TRANSITIONS,
  PAYMENT_METHOD_LABEL,
  formatMT,
  orderCode,
} from '@/lib/format'

type Tx = Prisma.TransactionClient
type Actor = 'cliente' | 'admin' | 'sistema'

/** Transacções interactivas com margem para a latência do Neon. */
const TX_OPTIONS = { timeout: 15_000, maxWait: 10_000 }

/** Máximo de encomendas pendentes por telefone (protege o stock contra reservas abusivas). */
const MAX_OPEN_ORDERS_PER_PHONE = 3

export interface CreateOrderInput {
  items: { productId: string; quantity: number }[]
  customerName: string
  customerPhone: string | null
  zone: { name: string; fee: number } | null
  address?: string | null
  reference?: string | null
  notes?: string | null
  paymentMethod?: PaymentMethod | null
  actor: Actor
}

/**
 * Cria a encomenda, valida preços e stock no servidor e reserva os blocos.
 * Tudo numa transacção: se um produto não tiver stock suficiente nada é gravado.
 */
export async function createOrder(input: CreateOrderInput) {
  // Junta linhas repetidas do mesmo produto
  const quantities = new Map<string, number>()
  for (const item of input.items) {
    quantities.set(item.productId, (quantities.get(item.productId) ?? 0) + item.quantity)
  }

  return prisma.$transaction(async (tx) => {
    const products = await tx.product.findMany({
      where: { id: { in: [...quantities.keys()] } },
    })

    if (products.length !== quantities.size) {
      throw new ApiError(400, 'Um dos produtos do carrinho já não existe. Actualize a página.')
    }

    if (input.customerPhone && input.actor === 'cliente') {
      const open = await tx.order.count({
        where: { customerPhone: input.customerPhone, status: 'pendente', paymentStatus: 'por_pagar' },
      })
      if (open >= MAX_OPEN_ORDERS_PER_PHONE) {
        throw new ApiError(
          429,
          'Já tem várias encomendas por pagar com este número. Conclua ou cancele uma delas antes de criar outra.',
        )
      }
    }

    const lines = products.map((p) => {
      const quantity = quantities.get(p.id)!
      if (!p.active) throw new ApiError(400, `${p.label} não está disponível de momento.`)
      if (p.price <= 0) throw new ApiError(400, `${p.label} ainda não tem preço definido.`)
      if (input.actor === 'cliente' && quantity < p.minimumOrder) {
        throw new ApiError(400, `A encomenda mínima de ${p.label} é ${p.minimumOrder} unidades.`)
      }
      return { product: p, quantity, lineTotal: quantity * p.price }
    })

    // Reserva de stock com verificação atómica (evita vender o mesmo bloco duas vezes)
    for (const { product, quantity } of lines) {
      const res = await tx.product.updateMany({
        where: { id: product.id, available: { gte: quantity } },
        data: { available: { decrement: quantity }, reserved: { increment: quantity } },
      })
      if (res.count === 0) {
        const fresh = await tx.product.findUnique({ where: { id: product.id } })
        throw new ApiError(
          409,
          `Stock insuficiente de ${product.label}: disponível ${fresh?.available ?? 0} unidades.`,
        )
      }
    }

    const subtotal = lines.reduce((s, l) => s + l.lineTotal, 0)
    const deliveryFee = input.zone?.fee ?? 0

    let customerId: string | null = null
    if (input.customerPhone) {
      const customer = await tx.customer.upsert({
        where: { phone: input.customerPhone },
        create: { phone: input.customerPhone, name: input.customerName },
        update: { name: input.customerName },
      })
      customerId = customer.id
    }

    const order = await tx.order.create({
      data: {
        customerId,
        customerName: input.customerName,
        customerPhone: input.customerPhone,
        zoneName: input.zone?.name ?? null,
        deliveryFee,
        address: input.address ?? null,
        reference: input.reference ?? null,
        notes: input.notes ?? null,
        subtotal,
        total: subtotal + deliveryFee,
        paymentMethod: input.paymentMethod ?? null,
        items: {
          create: lines.map((l) => ({
            productId: l.product.id,
            productName: l.product.label,
            unitPrice: l.product.price,
            quantity: l.quantity,
            lineTotal: l.lineTotal,
          })),
        },
        events: {
          create: {
            actor: input.actor,
            message:
              input.actor === 'cliente'
                ? 'Pedido feito na loja online.'
                : 'Encomenda registada pelo administrador.',
          },
        },
      },
    })

    await tx.stockMovement.createMany({
      data: lines.map((l) => ({
        productId: l.product.id,
        orderId: order.id,
        type: 'reserva' as const,
        quantity: -l.quantity,
        note: `Reserva ${orderCode(order.number)}`,
      })),
    })

    return order
  }, TX_OPTIONS)
}

/** Aplica os efeitos de stock de uma mudança de estado. */
async function applyStockForStatus(tx: Tx, orderId: string, number: number, to: OrderStatus) {
  if (to !== 'cancelado' && to !== 'entregue') return
  const items = await tx.orderItem.findMany({ where: { orderId } })

  for (const item of items) {
    if (to === 'cancelado') {
      // Liberta a reserva: volta ao stock disponível
      await tx.product.update({
        where: { id: item.productId },
        data: { reserved: { decrement: item.quantity }, available: { increment: item.quantity } },
      })
      await tx.stockMovement.create({
        data: {
          productId: item.productId,
          orderId,
          type: 'liberacao',
          quantity: item.quantity,
          note: `Cancelamento ${orderCode(number)}`,
        },
      })
    } else {
      // Entregue: os blocos saem definitivamente do stock
      await tx.product.update({
        where: { id: item.productId },
        data: { reserved: { decrement: item.quantity }, total: { decrement: item.quantity } },
      })
      await tx.stockMovement.create({
        data: {
          productId: item.productId,
          orderId,
          type: 'entrega',
          quantity: -item.quantity,
          note: `Entrega ${orderCode(number)}`,
        },
      })
    }
  }
}

async function transition(tx: Tx, orderId: string, to: OrderStatus, actor: Actor, note?: string | null) {
  const order = await tx.order.findUnique({ where: { id: orderId } })
  if (!order) throw new ApiError(404, 'Encomenda não encontrada.')
  if (order.status === to) return order

  if (!ORDER_TRANSITIONS[order.status].includes(to)) {
    throw new ApiError(
      400,
      `Não é possível passar de "${ORDER_STATUS_LABEL[order.status]}" para "${ORDER_STATUS_LABEL[to]}".`,
    )
  }

  // Bloqueio optimista: só actualiza se o estado não mudou entretanto
  const now = new Date()
  const res = await tx.order.updateMany({
    where: { id: orderId, status: order.status },
    data: {
      status: to,
      ...(to === 'confirmado' ? { confirmedAt: now } : {}),
      ...(to === 'entregue' ? { deliveredAt: now } : {}),
      ...(to === 'cancelado' ? { cancelledAt: now } : {}),
    },
  })
  if (res.count === 0) throw new ApiError(409, 'A encomenda foi alterada entretanto. Actualize a página.')

  await applyStockForStatus(tx, orderId, order.number, to)
  await tx.orderEvent.create({
    data: {
      orderId,
      actor,
      message: `Estado alterado para "${ORDER_STATUS_LABEL[to]}".${note ? ` ${note}` : ''}`,
    },
  })

  return tx.order.findUniqueOrThrow({ where: { id: orderId } })
}

export async function changeOrderStatus(orderId: string, to: OrderStatus, actor: Actor, note?: string | null) {
  return prisma.$transaction((tx) => transition(tx, orderId, to, actor, note), TX_OPTIONS)
}

/**
 * Recalcula o estado de pagamento a partir dos pagamentos.
 * Se ficar totalmente pago e a encomenda estiver pendente, confirma-a automaticamente.
 */
async function recalcPayment(tx: Tx, orderId: string) {
  const order = await tx.order.findUniqueOrThrow({
    where: { id: orderId },
    include: { payments: true },
  })
  const paid = order.payments.filter((p) => p.status === 'confirmado').reduce((s, p) => s + p.amount, 0)
  const hasPending = order.payments.some((p) => p.status === 'pendente')

  const paymentStatus = paid >= order.total ? 'pago' : hasPending ? 'em_verificacao' : 'por_pagar'
  if (paymentStatus !== order.paymentStatus) {
    await tx.order.update({ where: { id: orderId }, data: { paymentStatus } })
  }

  if (paymentStatus === 'pago' && order.status === 'pendente') {
    await transition(tx, orderId, 'confirmado', 'sistema', 'Pagamento recebido na totalidade.')
  }
}

export function paidAmount(payments: { status: string; amount: number }[]) {
  return payments.filter((p) => p.status === 'confirmado').reduce((s, p) => s + p.amount, 0)
}

/** O cliente indica que pagou (referência M-Pesa / e-Mola) — fica a aguardar verificação. */
export async function submitCustomerPayment(
  accessToken: string,
  data: { method: PaymentMethod; reference: string; payerPhone?: string | null },
) {
  return prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({ where: { accessToken }, include: { payments: true } })
    if (!order) throw new ApiError(404, 'Pedido não encontrado.')
    if (order.status === 'cancelado') throw new ApiError(400, 'Este pedido foi cancelado.')
    if (order.paymentStatus === 'pago') throw new ApiError(400, 'Este pedido já está pago.')

    const pending = order.payments.filter((p) => p.status === 'pendente').length
    if (pending >= 3) {
      throw new ApiError(429, 'Já existem comprovativos à espera de verificação. Aguarde a confirmação.')
    }

    const remaining = order.total - paidAmount(order.payments)
    const payment = await tx.payment.create({
      data: {
        orderId: order.id,
        method: data.method,
        amount: remaining,
        reference: data.reference,
        payerPhone: data.payerPhone ?? order.customerPhone,
      },
    })
    await tx.orderEvent.create({
      data: {
        orderId: order.id,
        actor: 'cliente',
        message: `Cliente indicou pagamento de ${formatMT(remaining)} via ${PAYMENT_METHOD_LABEL[data.method]} (ref. ${data.reference}).`,
      },
    })
    await recalcPayment(tx, order.id)
    return payment
  }, TX_OPTIONS)
}

/** Pagamento registado pelo admin (ex.: numerário na entrega) — fica logo confirmado. */
export async function addAdminPayment(
  orderId: string,
  data: { method: PaymentMethod; amount: number; reference?: string | null; note?: string | null },
) {
  return prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({ where: { id: orderId } })
    if (!order) throw new ApiError(404, 'Encomenda não encontrada.')
    if (order.status === 'cancelado') throw new ApiError(400, 'A encomenda está cancelada.')

    const payment = await tx.payment.create({
      data: { orderId, ...data, status: 'confirmado', reviewedAt: new Date() },
    })
    await tx.orderEvent.create({
      data: {
        orderId,
        actor: 'admin',
        message: `Pagamento de ${formatMT(data.amount)} registado (${PAYMENT_METHOD_LABEL[data.method]}).`,
      },
    })
    await recalcPayment(tx, orderId)
    return payment
  }, TX_OPTIONS)
}

/** Admin confirma ou rejeita um comprovativo enviado pelo cliente. */
export async function reviewPayment(paymentId: string, action: 'confirmar' | 'rejeitar', note?: string | null) {
  return prisma.$transaction(async (tx) => {
    const payment = await tx.payment.findUnique({ where: { id: paymentId } })
    if (!payment) throw new ApiError(404, 'Pagamento não encontrado.')
    if (payment.status !== 'pendente') throw new ApiError(400, 'Este pagamento já foi verificado.')

    const status = action === 'confirmar' ? 'confirmado' : 'rejeitado'
    await tx.payment.update({
      where: { id: paymentId },
      data: { status, reviewedAt: new Date(), note: note ?? payment.note },
    })
    await tx.orderEvent.create({
      data: {
        orderId: payment.orderId,
        actor: 'admin',
        message:
          action === 'confirmar'
            ? `Pagamento de ${formatMT(payment.amount)} confirmado.`
            : `Pagamento de ${formatMT(payment.amount)} rejeitado.${note ? ` Motivo: ${note}` : ''}`,
      },
    })
    await recalcPayment(tx, payment.orderId)
    return payment.orderId
  }, TX_OPTIONS)
}
