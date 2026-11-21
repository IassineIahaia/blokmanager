import 'server-only'
import { prisma } from '@/lib/prisma'

/** Produto como é mostrado na loja (sem dados internos de stock reservado). */
export interface CatalogProduct {
  id: string
  type: string
  label: string
  description: string | null
  details: string | null
  price: number
  minimumOrder: number
  orderStep: number
  imageUrl: string | null
  available: number
}

export interface CatalogZone {
  id: string
  name: string
  fee: number
}

export async function getCatalog(): Promise<{ products: CatalogProduct[]; zones: CatalogZone[] }> {
  const [products, zones] = await Promise.all([
    prisma.product.findMany({
      where: { active: true, price: { gt: 0 } },
      orderBy: [{ sortOrder: 'asc' }, { label: 'asc' }],
      select: {
        id: true,
        type: true,
        label: true,
        description: true,
        details: true,
        price: true,
        minimumOrder: true,
        orderStep: true,
        imageUrl: true,
        available: true,
      },
    }),
    prisma.deliveryZone.findMany({
      where: { active: true },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      select: { id: true, name: true, fee: true },
    }),
  ])
  return { products, zones }
}
