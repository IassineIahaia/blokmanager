import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { handler, parseBody, requireAdmin, type IdContext } from '@/lib/api'
import { materialRestockSchema } from '@/lib/validation'

/** Entrada de material comprado (cimento, areia...). */
export const POST = handler(async (req: Request, { params }: IdContext) => {
  await requireAdmin()
  const { id } = await params
  const { quantity, supplier } = await parseBody(req, materialRestockSchema)
  const material = await prisma.materialStock.update({
    where: { id },
    data: {
      current: { increment: quantity },
      lastRestock: new Date(),
      ...(supplier ? { supplier } : {}),
    },
  })
  return NextResponse.json(material)
})
