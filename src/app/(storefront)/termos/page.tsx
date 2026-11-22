import type { Metadata } from "next";

export const metadata: Metadata = { title: "Termos de uso" };

export default function TermsPage() {
  return (
    <article className="mx-auto max-w-3xl space-y-5 px-4 py-12 text-sm leading-relaxed text-black/60 md:px-8">
      <h1 className="text-[28px] font-bold tracking-tight text-black">Termos de uso</h1>
      <p>
        Estes termos regulam as encomendas feitas na loja online da SSP. Ao confirmar uma encomenda, o cliente
        declara que leu e aceita as condições abaixo.
      </p>
      <h2 className="text-lg font-medium tracking-tight text-black">1. Encomendas e reserva</h2>
      <p>
        Ao confirmar a encomenda, as quantidades pedidas ficam reservadas no nosso stock. A encomenda só é considerada
        confirmada depois de validarmos o pagamento ou de acordo expresso com o cliente.
      </p>
      <h2 className="text-lg font-medium tracking-tight text-black">2. Preços e pagamento</h2>
      <p>
        Os preços apresentados são por unidade, em meticais, e podem ser actualizados sem aviso prévio. O preço válido é
        o que consta no pedido no momento da confirmação. O pagamento é feito por M-Pesa, e-Mola ou transferência
        bancária, indicando a referência da transacção na página do pedido.
      </p>
      <h2 className="text-lg font-medium tracking-tight text-black">3. Entrega</h2>
      <p>
        A entrega é agendada após a confirmação do pagamento, normalmente em até 48 horas úteis em Nampula Cidade. Para
        outros distritos a data é combinada com o cliente. O local de descarga deve ter acesso para camião; o cliente deve
        indicar no pedido quaisquer condições especiais.
      </p>
      <h2 className="text-lg font-medium tracking-tight text-black">4. Cancelamentos</h2>
      <p>
        O cliente pode pedir o cancelamento antes de a encomenda sair para entrega, contactando-nos pelo WhatsApp com o
        código do pedido. Valores já pagos são devolvidos pelo mesmo meio, descontadas eventuais taxas de transferência.
      </p>
      <h2 className="text-lg font-medium tracking-tight text-black">5. Contacto</h2>
      <p>Para qualquer questão sobre um pedido, contacte-nos pelo telefone ou WhatsApp indicados no rodapé.</p>
    </article>
  );
}
