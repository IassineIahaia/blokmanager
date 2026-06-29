-- CreateTable
CREATE TABLE "Worker" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "level" TEXT,
    "salary" REAL NOT NULL,
    "debt" REAL NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "AttendanceDay" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "day" INTEGER NOT NULL,
    "present" BOOLEAN NOT NULL,
    "month" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "workerId" TEXT NOT NULL,
    CONSTRAINT "AttendanceDay_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES "Worker" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Loan" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "amount" REAL NOT NULL,
    "description" TEXT,
    "workerId" TEXT NOT NULL,
    CONSTRAINT "Loan_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES "Worker" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "BlockStock" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT,
    "available" INTEGER NOT NULL DEFAULT 0,
    "reserved" INTEGER NOT NULL DEFAULT 0,
    "total" INTEGER NOT NULL DEFAULT 0
);

-- CreateTable
CREATE TABLE "MaterialStock" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "unit" TEXT NOT NULL,
    "current" REAL NOT NULL,
    "minimum" REAL NOT NULL,
    "lastRestock" DATETIME,
    "supplier" TEXT
);

-- CreateTable
CREATE TABLE "ProductionEntry" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "date" DATETIME NOT NULL,
    "blockType" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "cementBags" REAL NOT NULL,
    "sandM3" REAL NOT NULL,
    "damaged" INTEGER NOT NULL DEFAULT 0,
    "workerId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ProductionEntry_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES "Worker" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Order" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "cliente" TEXT NOT NULL,
    "valor" REAL NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pendente',
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "BlockStock_type_key" ON "BlockStock"("type");

-- CreateIndex
CREATE UNIQUE INDEX "MaterialStock_name_key" ON "MaterialStock"("name");
