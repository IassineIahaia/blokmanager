import Link from "next/link";

export default function OrderNotFound() {
  return (
    <div className="mx-auto max-w-md px-4 py-20 text-center">
      <h1 className="text-[24px] font-bold text-on-surface">Pedido não encontrado</h1>
      <p className="mt-2 text-body-sm text-on-surface-variant">
        O link pode estar incompleto. Procure o pedido com o código e o seu telefone.
      </p>
      <Link
        href="/acompanhar"
        className="mt-6 inline-flex h-11 items-center rounded-md bg-primary px-6 font-semibold text-on-primary hover:bg-primary/90"
      >
        Acompanhar pedido
      </Link>
    </div>
  );
}
