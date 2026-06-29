// ===== Status types (shared across modules) =====
export type OrderStatus = "pendente" | "confirmado" | "entregue" | "cancelado";

export type WorkerRole = "Moldador" | "Moldadora" | "Ajudante" | "Motorista";

export type BlockType = '4"' | '5"' | '6"' | '9"' | "Pavê" | "Lajeta";

// ===== Orders =====
export interface Order {
  id: string;
  cliente: string;
  valor: number;
  status: OrderStatus;
  data?: string;
}

// ===== Stock =====
export interface BlockStock {
  type: BlockType;
  label: string;
  description?: string;
  available: number;
  reserved: number;
  total: number;
}

export interface MaterialStock {
  name: string;
  unit: string;
  current: number;
  minimum: number;
  lastRestock?: string;
  supplier?: string;
}

// ===== Production =====
export interface ProductionEntry {
  id: string;
  date: string;
  workerId: string;
  blockType: BlockType;
  quantity: number;
  cementBags: number;
  sandM3: number;
  damaged: number;
}

// ===== Workers =====
export interface AttendanceDay {
  day: number;
  present: boolean;
}

export interface LoanEntry {
  id: string;
  date: string;
  amount: number;
  description?: string;
}

export interface Worker {
  id: string;
  name: string;
  role: WorkerRole;
  level?: string;
  salary: number;
  debt: number;
  attendanceRate?: number;
  attendance?: AttendanceDay[];
  loans?: LoanEntry[];
  absences?: number;
  absenceDeduction?: number;
  photoUrl?: string;
}

// ===== Dashboard metrics =====
export interface DashboardMetrics {
  blocksInStock: number;
  blocksByType: { type: string; quantity: number }[];
  productionToday: number;
  productionGoal: number;
  productionChangePct: number;
  pendingOrders: number;
  dailyCash: number;
}

// ===== Storefront =====
export interface StorefrontProduct {
  type: BlockType;
  name: string;
  description: string;
  pricePerUnit: number;
  minimumOrder: number;
  available: boolean;
}

// ===== Checkout =====
export type PaymentMethod = "mpesa" | "emola";

export type DeliveryZone = "Maputo Cidade" | "Matola" | "KaMpfumo";

export interface DeliveryZoneOption {
  zone: DeliveryZone;
  fee: number;
}

export interface CartItem {
  product: StorefrontProduct;
  quantity: number;
}