import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

/**
 * Seed idempotente: pode ser executado várias vezes sem duplicar dados.
 * - Produtos, materiais, zonas e configurações: `upsert` pela chave única
 *   (não sobrescreve quantidades de stock nem valores já editados no admin).
 * - Trabalhadores: cria apenas os que ainda não existem (pelo nome).
 * - Encomendas de exemplo: só se a tabela estiver vazia.
 */
async function main() {
  const products = [
    {
      type: '9cm', label: 'Bloco de 9cm', description: 'Divisória Interior', sortOrder: 1,
      details: 'Ideal para paredes interiores e divisórias leves. Alta precisão dimensional.',
      price: 22, minimumOrder: 100, orderStep: 50, available: 1200, reserved: 0, total: 1200,
    },
    {
      type: '12cm', label: 'Bloco de 12cm', description: 'Standard Industrial', sortOrder: 2,
      details: 'Bloco standard para construção geral. Boa resistência e acabamento.',
      price: 32, minimumOrder: 100, orderStep: 50, available: 650, reserved: 0, total: 650,
    },
    {
      type: '15cm', label: 'Bloco de 15cm', description: 'Estrutural Pesado', sortOrder: 3,
      details: 'Bloco estrutural para paredes exteriores. Excelente isolamento térmico.',
      price: 45, minimumOrder: 50, orderStep: 50, available: 400, reserved: 0, total: 400,
    },
    {
      type: 'pave', label: 'Pavê Hexagonal', description: 'Interlocking Concrete', sortOrder: 4,
      details: 'Para pavimentação de quintais e estacionamentos. Diversas cores sob consulta.',
      price: 65, minimumOrder: 500, orderStep: 100, available: 2100, reserved: 0, total: 2100,
    },
  ]
  for (const p of products) {
    await prisma.product.upsert({ where: { type: p.type }, create: p, update: {} })
  }

  const materials = [
    { name: 'Cimento Portland', unit: 'sacos de 50kg', current: 124, minimum: 150, supplier: 'ConstruMoz Lda.' },
    { name: 'Areia Fina', unit: 'm³', current: 42.5, minimum: 50, supplier: 'ConstruMoz Lda.' },
  ]
  for (const m of materials) {
    await prisma.materialStock.upsert({ where: { name: m.name }, create: m, update: {} })
  }

  const zones = [
    { name: 'Nampula Cidade', fee: 800, sortOrder: 1 },
    { name: 'Monapo', fee: 1500, sortOrder: 2 },
    { name: 'Angoche', fee: 2000, sortOrder: 3 },
    { name: 'Nacala', fee: 2500, sortOrder: 4 },
    { name: 'Ilha de Moçambique', fee: 3500, sortOrder: 5 },
  ]
  for (const z of zones) {
    await prisma.deliveryZone.upsert({ where: { name: z.name }, create: z, update: {} })
  }

  const settings = {
    business_name: 'BlokManager Moz',
    business_phone: '+258 84 280 0063',
    whatsapp_number: '258842800063',
    mpesa_number: '258842800063',
    emola_number: '258873800063',
  }
  for (const [key, value] of Object.entries(settings)) {
    await prisma.setting.upsert({ where: { key }, create: { key, value }, update: {} })
  }

  const workers = [
    { name: 'Mateus Langa', role: 'Moldador', level: 'Nível 1', salary: 12000, debt: 500 },
    { name: 'Alberto Chirinda', role: 'Ajudante', salary: 8500, debt: 0 },
    { name: 'Celso Munguambe', role: 'Motorista', salary: 15000, debt: 1200 },
    { name: 'Isaura Matola', role: 'Moldadora', salary: 12000, debt: 0 },
  ]
  for (const w of workers) {
    const exists = await prisma.worker.findFirst({ where: { name: w.name } })
    if (!exists) await prisma.worker.create({ data: w })
  }

  if ((await prisma.order.count()) === 0) {
    const samples = [
      { customerName: 'Construtora Nampula Lda.', total: 15200, status: 'entregue', paymentStatus: 'pago' },
      { customerName: 'Artur Mendes Engenharia', total: 8450, status: 'confirmado', paymentStatus: 'pago' },
      { customerName: 'Projecto Muhala Expansão', total: 22000, status: 'pendente', paymentStatus: 'por_pagar' },
    ] as const
    for (const s of samples) {
      await prisma.order.create({
        data: {
          ...s,
          subtotal: s.total,
          events: { create: { actor: 'sistema', message: 'Encomenda de exemplo criada pelo seed.' } },
        },
      })
    }
  }

  console.log('✅ Seed concluído')
}

main()
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
