/**
 * Formatação e rótulos partilhados entre servidor e cliente.
 * Não importar nada de servidor aqui (Prisma, auth, etc.).
 */

export type OrderStatus = 'pendente' | 'confirmado' | 'em_entrega' | 'entregue' | 'cancelado'
export type OrderPaymentStatus = 'por_pagar' | 'em_verificacao' | 'pago'
export type PaymentMethod = 'mpesa' | 'emola' | 'transferencia' | 'numerario'
export type PaymentStatus = 'pendente' | 'confirmado' | 'rejeitado'

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  pendente: 'Pendente',
  confirmado: 'Confirmada',
  em_entrega: 'Em entrega',
  entregue: 'Entregue',
  cancelado: 'Cancelada',
}

export const ORDER_STATUS_DESCRIPTION: Record<OrderStatus, string> = {
  pendente: 'Recebemos o seu pedido. Aguarda pagamento ou confirmação.',
  confirmado: 'Pedido confirmado. Estamos a preparar a entrega.',
  em_entrega: 'O seu material está a caminho.',
  entregue: 'Material entregue. Obrigado pela preferência!',
  cancelado: 'Este pedido foi cancelado.',
}

export const PAYMENT_STATUS_LABEL: Record<OrderPaymentStatus, string> = {
  por_pagar: 'Por pagar',
  em_verificacao: 'Em verificação',
  pago: 'Pago',
}

export const PAYMENT_ITEM_STATUS_LABEL: Record<PaymentStatus, string> = {
  pendente: 'A verificar',
  confirmado: 'Confirmado',
  rejeitado: 'Rejeitado',
}

export const PAYMENT_METHOD_LABEL: Record<PaymentMethod, string> = {
  mpesa: 'M-Pesa',
  emola: 'e-Mola',
  transferencia: 'Transferência bancária',
  numerario: 'Numerário',
}

/** Transições de estado permitidas (o admin só pode avançar para estes estados). */
export const ORDER_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pendente: ['confirmado', 'cancelado'],
  confirmado: ['em_entrega', 'entregue', 'cancelado'],
  em_entrega: ['entregue', 'cancelado'],
  entregue: [],
  cancelado: [],
}

/** Código legível da encomenda: 7 -> "BM-0007". */
export function orderCode(number: number): string {
  return `BM-${String(number).padStart(4, '0')}`
}

/** Aceita "BM-0007", "bm7", "#7" ou "7" e devolve 7 (ou null). */
export function parseOrderCode(code: string): number | null {
  const digits = code.trim().replace(/^#?\s*(bm)?[-\s]*/i, '')
  if (!/^\d{1,9}$/.test(digits)) return null
  return Number(digits)
}

/** Valor em meticais: 1500 -> "1 500 MT". */
export function formatMT(value: number): string {
  return `${new Intl.NumberFormat('pt-PT', { maximumFractionDigits: 2 }).format(value)} MT`
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat('pt-PT').format(value)
}

export function formatDate(value: string | Date, withTime = false): string {
  const d = typeof value === 'string' ? new Date(value) : value
  return d.toLocaleString('pt-PT', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    ...(withTime ? { hour: '2-digit', minute: '2-digit' } : {}),
    timeZone: 'Africa/Maputo',
  })
}

/**
 * Normaliza um número moçambicano para "258XXXXXXXXX".
 * Aceita "84 123 4567", "+258 84 123 4567", "258841234567". Devolve null se inválido.
 */
export function normalizePhone(input: string): string | null {
  let digits = input.replace(/\D/g, '')
  if (digits.startsWith('00')) digits = digits.slice(2)
  if (digits.length === 12 && digits.startsWith('258')) digits = digits.slice(3)
  if (!/^8[2-7]\d{7}$/.test(digits)) return null
  return `258${digits}`
}

/** "258841234567" -> "+258 84 123 4567". */
export function formatPhone(phone: string): string {
  const m = phone.match(/^258(\d{2})(\d{3})(\d{4})$/)
  return m ? `+258 ${m[1]} ${m[2]} ${m[3]}` : phone
}

/** Link wa.me com mensagem pré-preenchida. */
export function whatsappLink(phone: string, message: string): string {
  return `https://wa.me/${phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`
}
