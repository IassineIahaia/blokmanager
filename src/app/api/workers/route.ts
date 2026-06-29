import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const workers = await prisma.worker.findMany({
    include: {
      attendance: {
        where: {
          month: new Date().getMonth() + 1,
          year: new Date().getFullYear(),
        },
        orderBy: { day: 'asc' },
      },
      loans: {
        orderBy: { date: 'desc' },
      },
    },
    orderBy: { createdAt: 'asc' },
  })

  return NextResponse.json(workers)
}

export async function POST(req: Request) {
  const body = await req.json()
  const { name, role, level, salary } = body

  if (!name || !role || !salary) {
    return NextResponse.json({ error: 'Campos obrigatórios em falta' }, { status: 400 })
  }

  const worker = await prisma.worker.create({
    data: { name, role, level, salary: Number(salary), debt: 0 },
  })

  return NextResponse.json(worker, { status: 201 })
}