import type { Metadata } from "next";

export const metadata: Metadata = { title: "Privacidade" };

export default function PrivacyPage() {
  return (
    <article className="mx-auto max-w-3xl space-y-5 px-4 py-12 text-sm leading-relaxed text-black/60 md:px-8">
      <h1 className="text-[28px] font-bold tracking-tight text-black">Política de privacidade</h1>
      <p>
        Recolhemos apenas os dados necessários para processar e entregar as suas encomendas: nome, telefone, endereço de
        entrega e referências de pagamento.
      </p>
      <h2 className="text-lg font-medium tracking-tight text-black">Como usamos os seus dados</h2>
      <ul className="list-disc space-y-1 pl-6">
        <li>Confirmar pagamentos e contactá-lo sobre o pedido (chamada, SMS ou WhatsApp);</li>
        <li>Organizar a entrega no endereço indicado;</li>
        <li>Manter o histórico de vendas exigido para fins contabilísticos.</li>
      </ul>
      <h2 className="text-lg font-medium tracking-tight text-black">Partilha</h2>
      <p>Não vendemos nem partilhamos os seus dados com terceiros para fins comerciais.</p>
      <h2 className="text-lg font-medium tracking-tight text-black">Os seus direitos</h2>
      <p>
        Pode pedir a consulta, correcção ou eliminação dos seus dados a qualquer momento, contactando-nos pelos meios
        indicados no rodapé.
      </p>
      <p>
        O carrinho de compras é guardado apenas no seu navegador. O link de cada pedido é privado: não o partilhe com
        quem não deva ver os detalhes da encomenda.
      </p>
    </article>
  );
}
