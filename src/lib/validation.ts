import { z } from 'zod'

export const ORDER_STATUSES = ['pendente', 'confirmado', 'entregue', 'cancelado'] as const

export const BLOCK_TYPES = ['9cm', '12cm', '15cm', 'pave'] as const

const nonEmpty = (label: string) =>
  z.string({ error: `${label} é obrigatório.` }).trim().min(1, `${label} é obrigatório.`)

export const createOrderSchema = z.object({
  cliente: nonEmpty('Cliente').max(120),
  valor: z.coerce.number({ error: 'Valor inválido.' }).positive('O valor deve ser maior que zero.'),
})

export const updateOrderSchema = z.object({
  status: z.enum(ORDER_STATUSES, { error: 'Estado inválido.' }),
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

export const createWorkerSchema = z.object({
  name: nonEmpty('Nome').max(120),
  role: nonEmpty('Função').max(60),
  level: z.string().trim().max(60).optional().nullable(),
  salary: z.coerce.number({ error: 'Salário inválido.' }).positive('O salário deve ser maior que zero.'),
})
