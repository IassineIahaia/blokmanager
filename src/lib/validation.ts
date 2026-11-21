import { z } from 'zod'
import { normalizePhone } from '@/lib/format'

export const ORDER_STATUSES = ['pendente', 'confirmado', 'em_entrega', 'entregue', 'cancelado'] as const
export const PAYMENT_METHODS = ['mpesa', 'emola', 'transferencia', 'numerario'] as const
/** Métodos que o cliente pode escolher na loja. */
export const ONLINE_PAYMENT_METHODS = ['mpesa', 'emola', 'transferencia'] as const

export const BLOCK_TYPES = ['9cm', '12cm', '15cm', 'pave'] as const

const nonEmpty = (label: string, max = 200) =>
  z
    .string({ error: `${label} é obrigatório.` })
    .trim()
    .min(1, `${label} é obrigatório.`)
    .max(max, `${label} é demasiado longo.`)

const optionalText = (max = 500) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .nullable()
    .transform((v) => v || null)

const phone = z
  .string({ error: 'Telefone é obrigatório.' })
  .transform((v, ctx) => {
    const n = normalizePhone(v)
    if (!n) {
      ctx.addIssue({ code: 'custom', message: 'Telefone inválido. Use um número moçambicano (ex.: 84 123 4567).' })
      return z.NEVER
    }
    return n
  })

const money = (label: string) =>
  z.coerce.number({ error: `${label} inválido.` }).int(`${label} deve ser um número inteiro.`).min(0)

const cartItems = z
  .array(
    z.object({
      productId: nonEmpty('Produto'),
      quantity: z.coerce.number().int().positive('Quantidade inválida.'),
    }),
  )
  .min(1, 'O carrinho está vazio.')
  .max(20)

// ───────────── Loja (público) ─────────────

export const checkoutSchema = z.object({
  items: cartItems,
  customerName: nonEmpty('Nome', 120),
  customerPhone: phone,
  zoneId: nonEmpty('Zona de entrega'),
  address: nonEmpty('Endereço', 300),
  reference: optionalText(200),
  notes: optionalText(500),
  paymentMethod: z.enum(ONLINE_PAYMENT_METHODS, { error: 'Método de pagamento inválido.' }),
})

export const submitPaymentSchema = z.object({
  method: z.enum(ONLINE_PAYMENT_METHODS, { error: 'Método de pagamento inválido.' }),
  reference: nonEmpty('Referência da transacção', 60),
  payerPhone: phone.optional(),
})

export const trackOrderSchema = z.object({
  code: nonEmpty('Código do pedido', 20),
  phone,
})

// ───────────── Admin ─────────────

export const createOrderSchema = z.object({
  items: cartItems,
  customerName: nonEmpty('Cliente', 120),
  customerPhone: z
    .string()
    .optional()
    .nullable()
    .transform((v, ctx) => {
      if (!v || !v.trim()) return null
      const n = normalizePhone(v)
      if (!n) {
        ctx.addIssue({ code: 'custom', message: 'Telefone inválido.' })
        return z.NEVER
      }
      return n
    }),
  zoneId: z.string().optional().nullable(),
  address: optionalText(300),
  notes: optionalText(500),
})

export const updateOrderSchema = z
  .object({
    status: z.enum(ORDER_STATUSES, { error: 'Estado inválido.' }).optional(),
    driverId: z.string().nullable().optional(),
    deliveryDate: z.coerce.date().nullable().optional(),
    note: optionalText(300),
  })
  .refine((d) => d.status || d.driverId !== undefined || d.deliveryDate !== undefined, {
    message: 'Nada para actualizar.',
  })

export const adminPaymentSchema = z.object({
  method: z.enum(PAYMENT_METHODS, { error: 'Método de pagamento inválido.' }),
  amount: z.coerce.number().int().positive('O valor deve ser maior que zero.'),
  reference: optionalText(60),
  note: optionalText(300),
})

export const reviewPaymentSchema = z.object({
  action: z.enum(['confirmar', 'rejeitar'], { error: 'Acção inválida.' }),
  note: optionalText(300),
})

export const updateProductSchema = z.object({
  label: nonEmpty('Nome', 120).optional(),
  description: optionalText(120),
  details: optionalText(600),
  price: money('Preço').optional(),
  minimumOrder: z.coerce.number().int().min(1).optional(),
  orderStep: z.coerce.number().int().min(1).optional(),
  active: z.boolean().optional(),
  imageUrl: z
    .string()
    .trim()
    .url('URL da imagem inválido.')
    .optional()
    .nullable()
    .or(z.literal('').transform(() => null)),
})

export const stockAdjustSchema = z.object({
  quantity: z.coerce.number().int().refine((n) => n !== 0, 'A quantidade não pode ser zero.'),
  note: nonEmpty('Motivo', 200),
})

export const zoneSchema = z.object({
  name: nonEmpty('Nome da zona', 80),
  fee: money('Taxa'),
  active: z.boolean().default(true),
})

export const settingsSchema = z.object({
  business_name: nonEmpty('Nome do negócio', 80),
  business_phone: nonEmpty('Telefone do negócio', 30),
  whatsapp_number: phone,
  mpesa_number: phone,
  emola_number: phone,
  bank_details: z.string().trim().max(400).default(''),
})

export const createProductionSchema = z
  .object({
    date: z.coerce.date({ error: 'Data inválida.' }),
    workerId: nonEmpty('Responsável'),
    blockType: z.enum(BLOCK_TYPES, { error: 'Tipo de bloco inválido.' }),
    quantity: z.coerce.number().int().positive('A quantidade deve ser maior que zero.'),
    cementBags: z.coerce.number().min(0).default(0),
    sandM3: z.coerce.number().min(0).default(0),
    damaged: z.coerce.number().int().min(0).default(0),
  })
  .refine((d) => d.damaged <= d.quantity, {
    message: 'Os danificados não podem exceder a quantidade produzida.',
    path: ['damaged'],
  })

export const materialRestockSchema = z.object({
  quantity: z.coerce.number().positive('A quantidade deve ser maior que zero.'),
  supplier: optionalText(120),
})

export const createWorkerSchema = z.object({
  name: nonEmpty('Nome', 120),
  role: nonEmpty('Função', 60),
  level: optionalText(60),
  salary: z.coerce.number({ error: 'Salário inválido.' }).positive('O salário deve ser maior que zero.'),
})

export const loanSchema = z.object({
  kind: z.enum(['emprestimo', 'reembolso']).default('emprestimo'),
  amount: z.coerce.number().positive('O valor deve ser maior que zero.'),
  description: optionalText(200),
})

export const attendanceSchema = z.object({
  day: z.coerce.number().int().min(1).max(31),
  month: z.coerce.number().int().min(1).max(12),
  year: z.coerce.number().int().min(2020).max(2100),
  present: z.boolean(),
})
