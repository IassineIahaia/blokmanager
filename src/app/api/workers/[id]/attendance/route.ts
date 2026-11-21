import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { handler, parseBody, requireAdmin, type IdContext } from '@/lib/api'
import { attendanceSchema } from '@/lib/validation'

/** Marca presença/falta num dia (cria ou actualiza). */
export const PUT = handler(async (req: Request, { params }: IdContext) => {
  await requireAdmin()
  const { id } = await params
  const { day, month, year, present } = await parseBody(req, attendanceSchema)

  const existing = await prisma.attendanceDay.findFirst({ where: { workerId: id, day, month, year } })
  const record = existing
    ? await prisma.attendanceDay.update({ where: { id: existing.id }, data: { present } })
    : await prisma.attendanceDay.create({ data: { workerId: id, day, month, year, present } })

  return NextResponse.json(record)
})
