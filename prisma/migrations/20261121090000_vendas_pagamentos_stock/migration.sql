-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('pendente', 'confirmado', 'em_entrega', 'entregue', 'cancelado');

-- CreateEnum
CREATE TYPE "OrderPaymentStatus" AS ENUM ('por_pagar', 'em_verificacao', 'pago');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('mpesa', 'emola', 'transferencia', 'numerario');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('pendente', 'confirmado', 'rejeitado');

-- CreateEnum
CREATE TYPE "StockMovementType" AS ENUM ('producao', 'reserva', 'liberacao', 'entrega', 'ajuste');

-- AlterTable
ALTER TABLE "BlockStock" ADD COLUMN     "active" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "details" TEXT,
ADD COLUMN     "imageUrl" TEXT,
ADD COLUMN     "minimumOrder" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "orderStep" INTEGER NOT NULL DEFAULT 50,
ADD COLUMN     "price" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "sortOrder" INTEGER NOT NULL DEFAULT 0;

-- AlterTable: Order
-- Migração que PRESERVA as encomendas existentes:
--   cliente -> customerName, valor (float) -> total (int), date -> createdAt,
--   status (texto) -> enum OrderStatus, number sequencial por data de criação.
ALTER TABLE "Order" RENAME COLUMN "cliente" TO "customerName";
ALTER TABLE "Order" RENAME COLUMN "date" TO "createdAt";
ALTER TABLE "Order" RENAME COLUMN "valor" TO "total";
ALTER TABLE "Order" ALTER COLUMN "total" TYPE INTEGER USING ROUND("total")::INTEGER;

ALTER TABLE "Order" ALTER COLUMN "status" DROP DEFAULT;
UPDATE "Order" SET "status" = 'pendente'
  WHERE "status" NOT IN ('pendente', 'confirmado', 'em_entrega', 'entregue', 'cancelado');
ALTER TABLE "Order" ALTER COLUMN "status" TYPE "OrderStatus" USING "status"::"OrderStatus";
ALTER TABLE "Order" ALTER COLUMN "status" SET DEFAULT 'pendente';

ALTER TABLE "Order"
ADD COLUMN     "accessToken" TEXT,
ADD COLUMN     "address" TEXT,
ADD COLUMN     "cancelledAt" TIMESTAMP(3),
ADD COLUMN     "confirmedAt" TIMESTAMP(3),
ADD COLUMN     "customerId" TEXT,
ADD COLUMN     "customerPhone" TEXT,
ADD COLUMN     "deliveredAt" TIMESTAMP(3),
ADD COLUMN     "deliveryDate" TIMESTAMP(3),
ADD COLUMN     "deliveryFee" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "driverId" TEXT,
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "number" INTEGER,
ADD COLUMN     "paymentMethod" "PaymentMethod",
ADD COLUMN     "paymentStatus" "OrderPaymentStatus" NOT NULL DEFAULT 'por_pagar',
ADD COLUMN     "reference" TEXT,
ADD COLUMN     "subtotal" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "updatedAt" TIMESTAMP(3),
ADD COLUMN     "zoneName" TEXT;

-- Preencher as encomendas existentes
UPDATE "Order" o SET
  "number" = n.rn,
  "accessToken" = md5(random()::text || clock_timestamp()::text || o."id"),
  "updatedAt" = o."createdAt",
  "subtotal" = o."total",
  "paymentStatus" = CASE WHEN o."status" IN ('confirmado', 'entregue') THEN 'pago'::"OrderPaymentStatus" ELSE 'por_pagar'::"OrderPaymentStatus" END,
  "confirmedAt" = CASE WHEN o."status" IN ('confirmado', 'entregue') THEN o."createdAt" END,
  "deliveredAt" = CASE WHEN o."status" = 'entregue' THEN o."createdAt" END,
  "cancelledAt" = CASE WHEN o."status" = 'cancelado' THEN o."createdAt" END
FROM (SELECT "id", ROW_NUMBER() OVER (ORDER BY "createdAt", "id") AS rn FROM "Order") n
WHERE n."id" = o."id";

-- Sequência para os próximos números (equivalente a SERIAL)
CREATE SEQUENCE "Order_number_seq" OWNED BY "Order"."number";
SELECT setval('"Order_number_seq"', COALESCE((SELECT MAX("number") FROM "Order"), 0) + 1, false);
ALTER TABLE "Order" ALTER COLUMN "number" SET DEFAULT nextval('"Order_number_seq"');

ALTER TABLE "Order" ALTER COLUMN "number" SET NOT NULL;
ALTER TABLE "Order" ALTER COLUMN "accessToken" SET NOT NULL;
ALTER TABLE "Order" ALTER COLUMN "updatedAt" SET NOT NULL;

-- CreateTable
CREATE TABLE "StockMovement" (
    "id" TEXT NOT NULL,
    "type" "StockMovementType" NOT NULL,
    "quantity" INTEGER NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "productId" TEXT NOT NULL,
    "orderId" TEXT,
    "productionId" TEXT,

    CONSTRAINT "StockMovement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DeliveryZone" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "fee" INTEGER NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "DeliveryZone_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Customer" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Customer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderItem" (
    "id" TEXT NOT NULL,
    "productName" TEXT NOT NULL,
    "unitPrice" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL,
    "lineTotal" INTEGER NOT NULL,
    "orderId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,

    CONSTRAINT "OrderItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "method" "PaymentMethod" NOT NULL,
    "amount" INTEGER NOT NULL,
    "reference" TEXT,
    "payerPhone" TEXT,
    "status" "PaymentStatus" NOT NULL DEFAULT 'pendente',
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),
    "orderId" TEXT NOT NULL,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderEvent" (
    "id" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "actor" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "orderId" TEXT NOT NULL,

    CONSTRAINT "OrderEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Setting" (
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,

    CONSTRAINT "Setting_pkey" PRIMARY KEY ("key")
);

-- CreateIndex
CREATE INDEX "StockMovement_productId_createdAt_idx" ON "StockMovement"("productId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "DeliveryZone_name_key" ON "DeliveryZone"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Customer_phone_key" ON "Customer"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "Order_number_key" ON "Order"("number");

-- CreateIndex
CREATE UNIQUE INDEX "Order_accessToken_key" ON "Order"("accessToken");

-- CreateIndex
CREATE INDEX "Order_status_createdAt_idx" ON "Order"("status", "createdAt");

-- AddForeignKey
ALTER TABLE "StockMovement" ADD CONSTRAINT "StockMovement_productId_fkey" FOREIGN KEY ("productId") REFERENCES "BlockStock"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockMovement" ADD CONSTRAINT "StockMovement_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockMovement" ADD CONSTRAINT "StockMovement_productionId_fkey" FOREIGN KEY ("productionId") REFERENCES "ProductionEntry"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Worker"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "BlockStock"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderEvent" ADD CONSTRAINT "OrderEvent_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- --------------- Dados de referência ---------------

-- Preços e regras de venda dos produtos existentes (antes estavam em mock-data.ts)
UPDATE "BlockStock" SET "price" = 22, "minimumOrder" = 100, "orderStep" = 50, "sortOrder" = 1,
  "details" = 'Ideal para paredes interiores e divisórias leves. Alta precisão dimensional.'
  WHERE "type" = '9cm';
UPDATE "BlockStock" SET "price" = 32, "minimumOrder" = 100, "orderStep" = 50, "sortOrder" = 2,
  "details" = 'Bloco standard para construção geral. Boa resistência e acabamento.'
  WHERE "type" = '12cm';
UPDATE "BlockStock" SET "price" = 45, "minimumOrder" = 50, "orderStep" = 50, "sortOrder" = 3,
  "details" = 'Bloco estrutural para paredes exteriores. Excelente isolamento térmico.'
  WHERE "type" = '15cm';
UPDATE "BlockStock" SET "price" = 65, "minimumOrder" = 500, "orderStep" = 100, "sortOrder" = 4,
  "details" = 'Para pavimentação de quintais e estacionamentos. Diversas cores sob consulta.'
  WHERE "type" = 'pave';

-- Garante total = disponível + reservado
UPDATE "BlockStock" SET "total" = "available" + "reserved";

-- Zonas de entrega
INSERT INTO "DeliveryZone" ("id", "name", "fee", "sortOrder") VALUES
  ('zone_nampula', 'Nampula Cidade', 800, 1),
  ('zone_monapo', 'Monapo', 1500, 2),
  ('zone_angoche', 'Angoche', 2000, 3),
  ('zone_nacala', 'Nacala', 2500, 4),
  ('zone_ilha', 'Ilha de Moçambique', 3500, 5)
ON CONFLICT ("name") DO NOTHING;

-- Configurações (números que estavam fixos no checkout)
INSERT INTO "Setting" ("key", "value") VALUES
  ('mpesa_number', '258842800063'),
  ('emola_number', '258873800063'),
  ('whatsapp_number', '258842800063'),
  ('business_phone', '+258 84 280 0063'),
  ('business_name', 'BlokManager Moz')
ON CONFLICT ("key") DO NOTHING;
