import 'server-only'
import { prisma } from '@/lib/prisma'

export const SETTING_DEFAULTS = {
  business_name: 'BlokManager Moz',
  business_phone: '+258 84 280 0063',
  whatsapp_number: '258842800063',
  mpesa_number: '258842800063',
  emola_number: '258873800063',
  bank_details: '',
} as const

export type SettingKey = keyof typeof SETTING_DEFAULTS
export type Settings = Record<SettingKey, string>

export const SETTING_KEYS = Object.keys(SETTING_DEFAULTS) as SettingKey[]

/** Lê todas as configurações, com valores por omissão para as que faltam. */
export async function getSettings(): Promise<Settings> {
  const rows = await prisma.setting.findMany()
  const settings: Settings = { ...SETTING_DEFAULTS }
  for (const row of rows) {
    if (row.key in settings) settings[row.key as SettingKey] = row.value
  }
  return settings
}
