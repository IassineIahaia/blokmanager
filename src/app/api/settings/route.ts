import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { handler, parseBody, requireAdmin } from '@/lib/api'
import { settingsSchema } from '@/lib/validation'
import { getSettings } from '@/lib/settings'

export const GET = handler(async () => {
  await requireAdmin()
  return NextResponse.json(await getSettings())
})

export const PUT = handler(async (req: Request) => {
  await requireAdmin()
  const data = await parseBody(req, settingsSchema)
  await prisma.$transaction(
    Object.entries(data).map(([key, value]) =>
      prisma.setting.upsert({ where: { key }, create: { key, value }, update: { value } }),
    ),
  )
  return NextResponse.json(await getSettings())
})
