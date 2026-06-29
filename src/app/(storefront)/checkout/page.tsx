// src/app/(storefront)/checkout/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { MapPin, Shield, ChevronLeft, CheckCircle2, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { deliveryZones } from '@/lib/mock-data';
import { useCart } from '@/lib/cart-context';

const ADMIN_MPESA = '258842800063';
const ADMIN_EMOLA = '258873800063';

function gerarOrderId() {
  return `BM-${Math.floor(9000 + Math.random() * 1000)}`;
}

export default function CheckoutPage() {
  const router = useRouter();
  const { cart, clearCart, totalPrice } = useCart();
  const [step, setStep] = useState<2 | 3>(2);
  const [confirmed, setConfirmed] = useState(false);
  const [orderId] = useState(gerarOrderId);

  // Localização
  const [zona, setZona] = useState(deliveryZones[0].zone);
  const [endereco, setEndereco] = useState('');
  const [referencia, setReferencia] = useState('');

  // Pagamento
  const [metodo, setMetodo] = useState<'mpesa' | 'emola'>('mpesa');
  const [telefone, setTelefone] = useState('+258 ');
  const [instrucoes, setInstrucoes] = useState('');
  const [aceitaTermos, setAceitaTermos] = useState(false);
  const [erroTermos, setErroTermos] = useState(false);

  // Redirecionar se carrinho vazio
  useEffect(() => {
    if (cart.length === 0 && !confirmed) {
      router.push('/');
    }
  }, [cart, confirmed, router]);

  const frete = deliveryZones.find(z => z.zone === zona)?.fee ?? 0;
  const total = totalPrice + frete;

  function buildWhatsAppMessage() {
    const linhas = cart.map(i =>
      `• ${i.name} × ${i.quantity} = MT ${(i.quantity * i.pricePerUnit).toLocaleString('pt-MZ')},00`
    ).join('\n');

    const numeroAdmin = metodo === 'mpesa' ? ADMIN_MPESA : ADMIN_EMOLA;
    const nomeMetodo = metodo === 'mpesa' ? 'M-Pesa' : 'e-Mola';

    return encodeURIComponent(
      `Olá BlokManager! Quero confirmar o meu pedido:\n\n` +
      `*Pedido:* #${orderId}\n` +
      `*Itens:*\n${linhas}\n` +
      `*Taxa de entrega (${zona}):* MT ${frete.toLocaleString('pt-MZ')},00\n` +
      `*TOTAL:* MT ${total.toLocaleString('pt-MZ')},00\n\n` +
      `*Entrega:* ${zona}\n` +
      `*Endereço:* ${endereco || 'A confirmar'}\n` +
      `*Referência:* ${referencia || '—'}\n` +
      (instrucoes ? `*Instruções:* ${instrucoes}\n` : '') +
      `\n*Método de pagamento:* ${nomeMetodo}\n` +
      `*Meu número:* ${telefone}\n\n` +
      `Por favor confirme o número ${nomeMetodo} para transferência: *+${numeroAdmin}*`
    );
  }

  function handleConfirmar() {
    if (!aceitaTermos) { setErroTermos(true); return; }

    const msg = buildWhatsAppMessage();
    const adminWA = metodo === 'mpesa' ? ADMIN_MPESA : ADMIN_EMOLA;
    window.open(`https://wa.me/${adminWA}?text=${msg}`, '_blank');

    setConfirmed(true);
    clearCart();
  }

  // ── Confirmação final ──
  if (confirmed) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <nav className="bg-white border-b border-outline-variant h-16 flex items-center px-6 md:px-12">
          <span className="text-[20px] font-bold text-on-surface tracking-tight">BlokManager</span>
        </nav>
        <div className="flex-1 flex items-center justify-center px-4 py-12">
          <div className="max-w-md w-full text-center space-y-6">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
              <CheckCircle2 className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h1 className="text-[24px] font-semibold text-on-surface">Pedido Enviado!</h1>
              <p className="text-body-sm text-on-surface-variant mt-2 leading-relaxed">
                O seu pedido <span className="font-semibold text-on-surface">#{orderId}</span> foi enviado via WhatsApp.
                O admin irá confirmar o pagamento e entrar em contacto em breve.
              </p>
            </div>

            <div className="rounded-md border border-outline-variant bg-white p-4 text-left space-y-2">
              <p className="text-label-caps text-on-surface-variant uppercase tracking-widest mb-3">Resumo</p>
              {cart.length === 0 ? (
                <p className="text-body-sm text-on-surface-variant">Itens enviados via WhatsApp</p>
              ) : (
                cart.map(i => (
                  <div key={i.type} className="flex justify-between text-body-sm">
                    <span className="text-on-surface-variant">{i.name} × {i.quantity}</span>
                    <span className="font-medium text-on-surface">MT {(i.quantity * i.pricePerUnit).toLocaleString('pt-MZ')},00</span>
                  </div>
                ))
              )}
              <div className="flex justify-between text-body-sm border-t border-outline-variant pt-2 mt-2">
                <span className="text-on-surface-variant">Taxa ({zona})</span>
                <span className="font-medium text-on-surface">MT {frete.toLocaleString('pt-MZ')},00</span>
              </div>
              <div className="flex justify-between font-bold text-primary pt-1">
                <span>Total</span>
                <span>MT {total.toLocaleString('pt-MZ')},00</span>
              </div>
            </div>

            <div className="rounded-md border border-outline-variant bg-surface-container-low p-4 text-left space-y-1">
              <p className="text-label-caps text-on-surface-variant uppercase tracking-widest mb-2">Próximos passos</p>
              <p className="text-body-sm text-on-surface">1. Transfira o valor via {metodo === 'mpesa' ? 'M-Pesa' : 'e-Mola'} para o número do admin</p>
              <p className="text-body-sm text-on-surface">2. Envie o comprovativo pelo WhatsApp</p>
              <p className="text-body-sm text-on-surface">3. Aguarde confirmação e agendamento da entrega</p>
            </div>

            <div className="flex flex-col gap-3">
              <Button
                onClick={() => {
                  const msg = buildWhatsAppMessage();
                  const adminWA = metodo === 'mpesa' ? ADMIN_MPESA : ADMIN_EMOLA;
                  window.open(`https://wa.me/${adminWA}?text=${msg}`, '_blank');
                }}
                className="w-full h-11 bg-primary text-on-primary hover:bg-primary/90 rounded-md"
              >
                <MessageCircle className="h-4 w-4 mr-2" />
                Abrir WhatsApp novamente
              </Button>
              <Button
                variant="outline"
                onClick={() => router.push('/')}
                className="w-full h-11 border-outline-variant text-on-surface rounded-md"
              >
                Voltar ao Início
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">

      {/* ── Navbar ── */}
      <nav className="bg-white border-b border-outline-variant sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 md:px-8 h-16 flex items-center justify-between">
          <button
            onClick={() => router.push('/')}
            className="flex items-center gap-2 text-on-surface-variant hover:text-on-surface transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="text-body-sm">Voltar</span>
          </button>
          <span className="text-[18px] font-bold text-on-surface tracking-tight">BlokManager</span>
          <span className="text-label-caps text-on-surface-variant hidden sm:block">Checkout</span>
        </div>
      </nav>

      {/* ── Indicador de progresso ── */}
      <div className="bg-white border-b border-outline-variant">
        <div className="max-w-5xl mx-auto px-4 md:px-8 py-4 flex items-center">
          {[
            { n: 1, label: 'Escolher blocos' },
            { n: 2, label: 'Localização' },
            { n: 3, label: 'Pagar' },
          ].map((s, i) => (
            <div key={s.n} className="flex items-center flex-1 last:flex-none">
              <div className="flex items-center gap-2">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[12px] font-bold transition-colors ${
                  s.n < step ? 'bg-primary text-on-primary' :
                  s.n === step ? 'bg-primary text-on-primary' :
                  'bg-surface-container-high text-on-surface-variant'
                }`}>
                  {s.n < step ? <CheckCircle2 className="h-4 w-4" /> : s.n}
                </div>
                <span className={`text-label-caps font-semibold hidden sm:block ${s.n === step ? 'text-on-surface' : 'text-on-surface-variant'}`}>
                  {s.label}
                </span>
              </div>
              {i < 2 && (
                <div className={`flex-1 h-px mx-3 ${s.n < step ? 'bg-primary' : 'bg-outline-variant'}`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ── Conteúdo ── */}
      <div className="flex-1 max-w-5xl mx-auto w-full px-4 md:px-8 py-8 pb-32">

        {step === 2 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-5">
              <div>
                <span className="text-label-caps text-primary font-semibold uppercase tracking-widest">Passo 02</span>
                <h1 className="text-[24px] font-semibold text-on-surface mt-1">Confirmar localização</h1>
              </div>

              <div className="h-[240px] rounded-md border border-outline-variant overflow-hidden relative">
                <iframe
                  title="Mapa de entrega"
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  src="https://www.openstreetmap.org/export/embed.html?bbox=32.5200%2C-25.9800%2C32.6200%2C-25.9200&layer=mapnik&marker=-25.9500%2C32.5732"
                  allowFullScreen
                />
                <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-sm border border-outline-variant rounded-md px-3 py-1.5 flex items-center gap-1.5 text-label-caps text-on-surface-variant">
                  <MapPin className="h-3.5 w-3.5 text-primary" />
                  Ajuste o pino para precisão
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-label-caps text-on-surface-variant uppercase tracking-widest">Zona de Entrega</label>
                  <select
                    value={zona}
                    onChange={e => setZona(e.target.value)}
                    className="h-11 bg-white border border-outline-variant rounded-md px-3 text-on-surface text-body-sm focus:border-primary outline-none transition-colors"
                  >
                    {deliveryZones.map(z => (
                      <option key={z.zone} value={z.zone}>{z.zone} — MT {z.fee.toLocaleString('pt-MZ')}</option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-label-caps text-on-surface-variant uppercase tracking-widest">Ponto de Referência</label>
                  <input
                    type="text"
                    placeholder="Próximo ao estaleiro..."
                    value={referencia}
                    onChange={e => setReferencia(e.target.value)}
                    className="h-11 bg-white border border-outline-variant rounded-md px-3 text-on-surface text-body-sm focus:border-primary outline-none transition-colors"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-label-caps text-on-surface-variant uppercase tracking-widest">Endereço Completo</label>
                <input
                  type="text"
                  placeholder="Av. Marginal, Condomínio das Palmeiras..."
                  value={endereco}
                  onChange={e => setEndereco(e.target.value)}
                  className="h-11 bg-white border border-outline-variant rounded-md px-3 text-on-surface text-body-sm focus:border-primary outline-none transition-colors"
                />
              </div>

              {/* Resumo */}
              <div className="rounded-md border border-outline-variant bg-white p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-body-sm font-semibold text-on-surface">Resumo do Pedido</span>
                  <span className="text-label-caps text-primary font-semibold bg-primary/10 px-2 py-0.5 rounded-sm">
                    ID #{orderId}
                  </span>
                </div>
                <div className="space-y-2 border-t border-outline-variant pt-3">
                  {cart.map(i => (
                    <div key={i.type} className="flex justify-between text-body-sm">
                      <span className="text-on-surface-variant">{i.name} (×{i.quantity})</span>
                      <span className="font-medium text-on-surface">MT {(i.quantity * i.pricePerUnit).toLocaleString('pt-MZ')},00</span>
                    </div>
                  ))}
                  <div className="flex justify-between text-body-sm">
                    <span className="text-on-surface-variant">Taxa de Entrega ({zona})</span>
                    <span className="font-medium text-on-surface">MT {frete.toLocaleString('pt-MZ')},00</span>
                  </div>
                </div>
                <div className="flex justify-between font-bold text-primary border-t border-outline-variant pt-3">
                  <span>Total a Pagar</span>
                  <span>MT {total.toLocaleString('pt-MZ')},00</span>
                </div>
              </div>
            </div>

            <div className="hidden md:block" />
          </div>
        )}

        {step === 3 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

            {/* Esquerda: resumo localização */}
            <div className="space-y-5">
              <div>
                <span className="text-label-caps text-primary font-semibold uppercase tracking-widest">Passo 02</span>
                <h2 className="text-[20px] font-semibold text-on-surface mt-1">Localização confirmada</h2>
              </div>
              <div className="h-[180px] rounded-md border border-outline-variant overflow-hidden opacity-60 pointer-events-none">
                <iframe
                  title="Mapa"
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  src="https://www.openstreetmap.org/export/embed.html?bbox=32.5200%2C-25.9800%2C32.6200%2C-25.9200&layer=mapnik&marker=-25.9500%2C32.5732"
                />
              </div>
              <div className="grid grid-cols-2 gap-3 text-body-sm">
                <div>
                  <p className="text-label-caps text-on-surface-variant uppercase tracking-widest mb-1">Zona</p>
                  <p className="text-on-surface font-medium">{zona}</p>
                </div>
                <div>
                  <p className="text-label-caps text-on-surface-variant uppercase tracking-widest mb-1">Referência</p>
                  <p className="text-on-surface font-medium">{referencia || '—'}</p>
                </div>
              </div>
              <div>
                <p className="text-label-caps text-on-surface-variant uppercase tracking-widest mb-1">Endereço</p>
                <p className="text-on-surface text-body-sm">{endereco || '—'}</p>
              </div>
              <div className="rounded-md border border-outline-variant bg-white p-4 space-y-2">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-body-sm font-semibold text-on-surface">Resumo</span>
                  <span className="text-label-caps text-primary font-semibold bg-primary/10 px-2 py-0.5 rounded-sm">#{orderId}</span>
                </div>
                {cart.map(i => (
                  <div key={i.type} className="flex justify-between text-body-sm">
                    <span className="text-on-surface-variant">{i.name} (×{i.quantity})</span>
                    <span className="font-medium text-on-surface">MT {(i.quantity * i.pricePerUnit).toLocaleString('pt-MZ')},00</span>
                  </div>
                ))}
                <div className="flex justify-between text-body-sm">
                  <span className="text-on-surface-variant">Taxa ({zona})</span>
                  <span className="font-medium text-on-surface">MT {frete.toLocaleString('pt-MZ')},00</span>
                </div>
                <div className="flex justify-between font-bold text-primary border-t border-outline-variant pt-2">
                  <span>Total</span>
                  <span>MT {total.toLocaleString('pt-MZ')},00</span>
                </div>
              </div>
            </div>

            {/* Direita: pagamento */}
            <div className="space-y-5">
              <div>
                <span className="text-label-caps text-primary font-semibold uppercase tracking-widest">Passo 03</span>
                <h1 className="text-[24px] font-semibold text-on-surface mt-1">Método de Pagamento</h1>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {[
                  { id: 'mpesa' as const, label: 'M-Pesa', sub: 'Vodacom Moçambique', color: 'bg-red-500', numero: `+${ADMIN_MPESA}` },
                  { id: 'emola' as const, label: 'e-Mola', sub: 'Movitel SA', color: 'bg-amber-500', numero: `+${ADMIN_EMOLA}` },
                ].map(m => (
                  <button
                    key={m.id}
                    onClick={() => setMetodo(m.id)}
                    className={`flex items-center gap-3 p-4 rounded-md border-2 transition-colors text-left ${
                      metodo === m.id
                        ? 'border-primary bg-primary/5'
                        : 'border-outline-variant bg-white hover:bg-surface-container-low'
                    }`}
                  >
                    <div className={`w-9 h-9 rounded-md ${m.color} flex items-center justify-center text-white font-bold text-[14px] flex-shrink-0`}>
                      {m.label[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-body-sm font-semibold text-on-surface">{m.label}</p>
                      <p className="text-label-caps text-on-surface-variant truncate">{m.sub}</p>
                    </div>
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                      metodo === m.id ? 'border-primary' : 'border-outline-variant'
                    }`}>
                      {metodo === m.id && <div className="w-2 h-2 rounded-full bg-primary" />}
                    </div>
                  </button>
                ))}
              </div>

              {/* Número do admin */}
              <div className="rounded-md border border-primary/30 bg-primary/5 px-4 py-3 flex items-center gap-3">
                <MessageCircle className="h-4 w-4 text-primary flex-shrink-0" />
                <div>
                  <p className="text-label-caps text-on-surface-variant uppercase tracking-widest">Transferir para</p>
                  <p className="text-body-sm font-bold text-primary">
                    {metodo === 'mpesa' ? `+${ADMIN_MPESA}` : `+${ADMIN_EMOLA}`}
                  </p>
                  <p className="text-label-caps text-on-surface-variant">
                    {metodo === 'mpesa' ? 'M-Pesa (Vodacom)' : 'e-Mola (Movitel)'}
                  </p>
                </div>
              </div>

              <div className="rounded-md border border-outline-variant bg-white p-4 space-y-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-label-caps text-on-surface-variant uppercase tracking-widest">O seu número de telefone</label>
                  <input
                    type="tel"
                    value={telefone}
                    onChange={e => setTelefone(e.target.value)}
                    className="h-11 bg-surface-container-low border border-outline-variant rounded-md px-3 text-on-surface text-body-sm focus:border-primary outline-none transition-colors"
                  />
                  <p className="text-label-caps text-on-surface-variant">Para o admin confirmar a transferência.</p>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-label-caps text-on-surface-variant uppercase tracking-widest">Instruções para o Motorista (Opcional)</label>
                  <textarea
                    rows={3}
                    placeholder="Ex: Entrar pelo portão lateral cinza..."
                    value={instrucoes}
                    onChange={e => setInstrucoes(e.target.value)}
                    className="bg-surface-container-low border border-outline-variant rounded-md px-3 py-2.5 text-on-surface text-body-sm focus:border-primary outline-none transition-colors resize-none"
                  />
                </div>

                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={aceitaTermos}
                    onChange={e => { setAceitaTermos(e.target.checked); setErroTermos(false); }}
                    className="mt-0.5 h-4 w-4 accent-primary"
                  />
                  <span className="text-body-sm text-on-surface-variant leading-relaxed">
                    Eu li e aceito os{' '}
                    <a href="#" className="text-primary underline">Termos de Uso</a>{' '}
                    e entendo que o material será entregue em até 48h úteis após confirmação do pagamento.
                  </span>
                </label>
                {erroTermos && (
                  <p className="text-[12px] text-red-500 font-medium">Deve aceitar os termos para continuar.</p>
                )}
              </div>

              <div className="flex items-center gap-3 rounded-md border border-outline-variant bg-surface-container-low px-4 py-3">
                <Shield className="h-4 w-4 text-primary flex-shrink-0" />
                <span className="text-label-caps text-on-surface-variant">
                  Ao confirmar, abriremos o WhatsApp com os detalhes do pedido para enviar ao admin.
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Barra inferior fixa ── */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-outline-variant shadow-lg">
        <div className="max-w-5xl mx-auto px-4 md:px-8 py-4 flex items-center justify-between">
          <div>
            <p className="text-label-caps text-on-surface-variant uppercase tracking-widest">Valor Total</p>
            <p className="text-[20px] font-bold text-on-surface">MT {total.toLocaleString('pt-MZ')},00</p>
          </div>
          <div className="flex items-center gap-3">
            {step === 3 && (
              <Button
                variant="outline"
                onClick={() => setStep(2)}
                className="h-11 border-outline-variant text-on-surface rounded-md px-6"
              >
                Voltar
              </Button>
            )}
            {step === 2 ? (
              <Button
                onClick={() => setStep(3)}
                className="h-11 bg-primary text-on-primary hover:bg-primary/90 rounded-md px-8 font-semibold"
              >
                Continuar para pagamento
              </Button>
            ) : (
              <Button
                onClick={handleConfirmar}
                className="h-11 bg-primary text-on-primary hover:bg-primary/90 rounded-md px-8 font-semibold"
              >
                <MessageCircle className="h-4 w-4 mr-2" />
                Confirmar via WhatsApp
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="pb-24 bg-surface-container-low border-t border-outline-variant">
        <div className="max-w-5xl mx-auto px-4 md:px-8 py-6 flex flex-col md:flex-row justify-between items-center gap-3">
          <p className="text-label-caps text-on-surface-variant">BlokManager Moz · © 2024 Todos os direitos reservados.</p>
          <div className="flex gap-6">
            <a href="#" className="text-label-caps text-on-surface-variant hover:text-primary underline">WhatsApp Suporte</a>
            <a href="#" className="text-label-caps text-on-surface-variant hover:text-primary underline">Termos de Uso</a>
            <a href="#" className="text-label-caps text-on-surface-variant hover:text-primary underline">Privacidade</a>
          </div>
        </div>
      </div>
    </div>
  );
}