import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { handler, parseBody, requireAdmin, type IdContext } from '@/lib/api'
import { updateProductSchema } from '@/lib/validation'

/** Editar preço, mínimo, descrição, imagem ou activar/desactivar na loja. */
export const PATCH = handler(async (req: Request, { params }: IdContext) => {
  await requireAdmin()
  const { id } = await params
  const data = await parseBody(req, updateProductSchema)
  const product = await prisma.product.update({ where: { id }, data })
  return NextResponse.json(product)
})
