import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { handler, parseBody, requireAdmin, type IdContext } from '@/lib/api'
import { createWorkerSchema } from '@/lib/validation'

export const PATCH = handler(async (req: Request, { params }: IdContext) => {
  await requireAdmin()
  const { id } = await params
  const data = await parseBody(req, createWorkerSchema.partial())
  const worker = await prisma.worker.update({ where: { id }, data })
  return NextResponse.json(worker)
})
