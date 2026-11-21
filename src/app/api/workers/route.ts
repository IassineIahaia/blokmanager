import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { handler, parseBody, requireAdmin } from '@/lib/api'
import { createWorkerSchema } from '@/lib/validation'

export const GET = handler(async () => {
  await requireAdmin()
  const now = new Date()
  const workers = await prisma.worker.findMany({
    include: {
      attendance: {
        where: { month: now.getMonth() + 1, year: now.getFullYear() },
        orderBy: { day: 'asc' },
      },
      loans: { orderBy: { date: 'desc' } },
    },
    orderBy: { createdAt: 'asc' },
  })

  return NextResponse.json(workers)
})

export const POST = handler(async (req: Request) => {
  await requireAdmin()
  const { name, role, level, salary } = await parseBody(req, createWorkerSchema)

  const worker = await prisma.worker.create({
    data: { name, role, level: level || null, salary, debt: 0 },
  })

  return NextResponse.json(worker, { status: 201 })
})
