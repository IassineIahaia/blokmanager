import type { Metadata } from "next";
import { connection } from "next/server";
import { getCatalog } from "@/lib/catalog";
import { getSettings } from "@/lib/settings";
import { CheckoutClient } from "./checkout-client";

export const metadata: Metadata = { title: "Finalizar encomenda" };

export default async function CheckoutPage() {
  await connection();
  const [{ products, zones }, settings] = await Promise.all([getCatalog(), getSettings()]);

  return (
    <CheckoutClient
      products={products}
      zones={zones}
      hasBankDetails={Boolean(settings.bank_details)}
    />
  );
}
