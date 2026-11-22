import Link from "next/link";

export default function OrderNotFound() {
  return (
    <div className="mx-auto max-w-md px-4 py-20 text-center">
      <h1 className="text-[24px] font-bold text-black">Pedido não encontrado</h1>
      <p className="mt-2 text-sm text-black/60">
        O link pode estar incompleto. Procure o pedido com o código e o seu telefone.
      </p>
      <Link
        href="/acompanhar"
        className="mt-6 inline-flex h-11 items-center rounded-xl bg-black px-6 font-semibold text-white hover:bg-black/85"
      >
        Acompanhar pedido
      </Link>
    </div>
  );
}
