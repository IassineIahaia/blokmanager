import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  await prisma.blockStock.createMany({
    data: [
      { type: '9cm', label: 'Bloco de 9cm', description: 'Divisória Interior', available: 1200, reserved: 300, total: 1500 },
      { type: '12cm', label: 'Bloco de 12cm', description: 'Standard Industrial', available: 650, reserved: 200, total: 850 },
      { type: '15cm', label: 'Bloco de 15cm', description: 'Estrutural Pesado', available: 400, reserved: 450, total: 850 },
      { type: 'pave', label: 'Pavê Hexagonal', description: 'Interlocking Concrete', available: 2100, reserved: 120, total: 2220 },
    ]
  })

  await prisma.materialStock.createMany({
    data: [
      { name: 'Cimento Portland', unit: 'sacos de 50kg', current: 124, minimum: 150, supplier: 'ConstruMoz Lda.' },
      { name: 'Areia Fina', unit: 'm³', current: 42.5, minimum: 50, supplier: 'ConstruMoz Lda.' },
    ]
  })

  await prisma.worker.createMany({
    data: [
      { name: 'Mateus Langa', role: 'Moldador', level: 'Nível 1', salary: 12000, debt: 500 },
      { name: 'Alberto Chirinda', role: 'Ajudante', salary: 8500, debt: 0 },
      { name: 'Celso Munguambe', role: 'Motorista', salary: 15000, debt: 1200 },
      { name: 'Isaura Matola', role: 'Moldadora', salary: 12000, debt: 0 },
    ]
  })

  await prisma.order.createMany({
    data: [
      { cliente: 'Construtora Maputo Lda.', valor: 15200, status: 'entregue' },
      { cliente: 'Artur Mendes Engenharia', valor: 8450, status: 'confirmado' },
      { cliente: 'Projeto Xai-Xai Sul', valor: 22000, status: 'pendente' },
      { cliente: 'Imobiliária Sol Nascente', valor: 5100, status: 'entregue' },
    ]
  })

  console.log('✅ Seed concluído')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())