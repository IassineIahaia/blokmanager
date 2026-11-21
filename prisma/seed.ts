import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

/**
 * Seed idempotente: pode ser executado várias vezes sem duplicar dados.
 * - Stock de blocos e materiais: `upsert` pela chave única (só cria; não sobrescreve quantidades reais).
 * - Trabalhadores: cria apenas se não existir nenhum com o mesmo nome.
 * - Encomendas de exemplo: só são criadas se a tabela estiver vazia.
 */
async function main() {
  const blocks = [
    { type: '9cm', label: 'Bloco de 9cm', description: 'Divisória Interior', available: 1200, reserved: 300, total: 1500 },
    { type: '12cm', label: 'Bloco de 12cm', description: 'Standard Industrial', available: 650, reserved: 200, total: 850 },
    { type: '15cm', label: 'Bloco de 15cm', description: 'Estrutural Pesado', available: 400, reserved: 450, total: 850 },
    { type: 'pave', label: 'Pavê Hexagonal', description: 'Interlocking Concrete', available: 2100, reserved: 120, total: 2220 },
  ]
  for (const b of blocks) {
    await prisma.blockStock.upsert({
      where: { type: b.type },
      create: b,
      update: { label: b.label, description: b.description },
    })
  }

  const materials = [
    { name: 'Cimento Portland', unit: 'sacos de 50kg', current: 124, minimum: 150, supplier: 'ConstruMoz Lda.' },
    { name: 'Areia Fina', unit: 'm³', current: 42.5, minimum: 50, supplier: 'ConstruMoz Lda.' },
  ]
  for (const m of materials) {
    await prisma.materialStock.upsert({
      where: { name: m.name },
      create: m,
      update: { unit: m.unit, minimum: m.minimum, supplier: m.supplier },
    })
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
    await prisma.order.createMany({
      data: [
        { cliente: 'Construtora Maputo Lda.', valor: 15200, status: 'entregue' },
        { cliente: 'Artur Mendes Engenharia', valor: 8450, status: 'confirmado' },
        { cliente: 'Projeto Xai-Xai Sul', valor: 22000, status: 'pendente' },
        { cliente: 'Imobiliária Sol Nascente', valor: 5100, status: 'entregue' },
      ],
    })
  }

  console.log('✅ Seed concluído')
}

main()
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
