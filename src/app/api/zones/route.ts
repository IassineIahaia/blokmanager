import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { handler, parseBody, requireAdmin } from '@/lib/api'
import { zoneSchema } from '@/lib/validation'

export const GET = handler(async () => {
  await requireAdmin()
  const zones = await prisma.deliveryZone.findMany({ orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }] })
  return NextResponse.json(zones)
})

export const POST = handler(async (req: Request) => {
  await requireAdmin()
  const data = await parseBody(req, zoneSchema)
  const max = await prisma.deliveryZone.aggregate({ _max: { sortOrder: true } })
  const zone = await prisma.deliveryZone.create({
    data: { ...data, sortOrder: (max._max.sortOrder ?? 0) + 1 },
  })
  return NextResponse.json(zone, { status: 201 })
})
