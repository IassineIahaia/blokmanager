import { OrdersClient } from "./orders-client";

export default async function EncomendasPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; pagamento?: string; q?: string }>;
}) {
  const sp = await searchParams;
  return <OrdersClient initialStatus={sp.status ?? ""} initialPayment={sp.pagamento ?? ""} initialQuery={sp.q ?? ""} />;
}
