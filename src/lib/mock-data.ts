import type {
  BlockStock,
  DashboardMetrics,
  DeliveryZoneOption,
  MaterialStock,
  Order,
  StorefrontProduct,
  Worker,
} from "@/types";

export const dashboardMetrics: DashboardMetrics = {
  blocksInStock: 5420,
  blocksByType: [
    { type: "12cm", quantity: 2200 },
    { type: "15cm", quantity: 3220 },
  ],
  productionToday: 850,
  productionGoal: 1000,
  productionChangePct: 12,
  pendingOrders: 12,
  dailyCash: 45500,
};

export const recentOrders: Order[] = [
  {
    id: "BM-1092",
    cliente: "Construtora Maputo Lda.",
    valor: 15200,
    status: "entregue",
  },
  {
    id: "BM-1093",
    cliente: "Artur Mendes Engenharia",
    valor: 8450,
    status: "confirmado",
  },
  {
    id: "BM-1094",
    cliente: "Projeto Xai-Xai Sul",
    valor: 22000,
    status: "pendente",
  },
  {
    id: "BM-1095",
    cliente: "Imobiliária Sol Nascente",
    valor: 5100,
    status: "entregue",
  },
];

export const blockStocks: BlockStock[] = [
  {
    type: "9",
    label: "Bloco de 9cm",
    description: "Divisória Interior",
    available: 1200,
    reserved: 300,
    total: 1500,
  },
  {
    type: "12",
    label: "Bloco de 12cm",
    description: "Standard Industrial",
    available: 650,
    reserved: 200,
    total: 850,
  },
  {
    type: "15",
    label: "Bloco de 15cm",
    description: "Estrutural Pesado",
    available: 400,
    reserved: 450,
    total: 850,
  },
  {
    type: "Pavê",
    label: "Pavê Hexagonal",
    description: "Interlocking Concrete",
    available: 2100,
    reserved: 120,
    total: 2220,
  },
];

export const materialStocks: MaterialStock[] = [
  {
    name: "Cimento Portland",
    unit: "sacos de 50kg",
    current: 124,
    minimum: 150,
    lastRestock: "2024-10-20",
    supplier: "ConstruMoz Lda.",
  },
  {
    name: "Areia Fina",
    unit: "m³",
    current: 42.5,
    minimum: 50,
    lastRestock: "2024-10-20",
    supplier: "ConstruMoz Lda.",
  },
];

export const workers: Worker[] = [
  {
    id: "BM-2024-042",
    name: "Mateus Langa",
    role: "Moldador",
    level: "Nível 1",
    salary: 12000,
    debt: 500,
    attendanceRate: 94,
    absences: 2,
    absenceDeduction: 800,
    loans: [
      {
        id: "L-001",
        date: "2024-10-05",
        amount: 500,
        description: "Adiantamento",
      },
    ],
    attendance: Array.from({ length: 31 }, (_, i) => ({
      day: i + 1,
      present: ![5, 18].includes(i + 1),
    })),
  },
  {
    id: "BM-2024-043",
    name: "Alberto Chirinda",
    role: "Ajudante",
    salary: 8500,
    debt: 0,
  },
  {
    id: "BM-2024-044",
    name: "Celso Munguambe",
    role: "Motorista",
    salary: 15000,
    debt: 1200,
  },
  {
    id: "BM-2024-045",
    name: "Isaura Matola",
    role: "Moldadora",
    salary: 12000,
    debt: 0,
  },
];

export const storefrontProducts: StorefrontProduct[] = [
  {
    type: "9",
    name: "Bloco de Cimento 9cm",
    description:
      "Ideal para paredes interiores e divisórias leves. Alta precisão dimensional.",
    pricePerUnit: 22,
    minimumOrder: 100,
    available: true,
  },
  {
    type: "12",
    name: "Bloco de Cimento 12cm",
    description:
      "Bloco standard para construção geral. Boa resistência e acabamento.",
    pricePerUnit: 32,
    minimumOrder: 100,
    available: true,
  },
  {
    type: "15",
    name: "Bloco de Cimento 15cm",
    description:
      "Bloco estrutural para paredes exteriores. Excelente isolamento térmico.",
    pricePerUnit: 45,
    minimumOrder: 50,
    available: true,
  },
  {
    type: "Pavê",
    name: "Pavê Hexagonal (Interlock)",
    description:
      "Para pavimentação de quintais e estacionamentos. Diversas cores sob consulta.",
    pricePerUnit: 65,
    minimumOrder: 500,
    available: true,
  },
];

export const deliveryZones: DeliveryZoneOption[] = [
  { zone: "Nampula Cidade", fee: 800 },
  { zone: "Nacala", fee: 2500 },
  { zone: "Ilha de Moçambique", fee: 3500 },
  { zone: "Monapo", fee: 1500 },
  { zone: "Angoche", fee: 2000 },
];