// src/app/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ShoppingCart, MapPin, Phone, MessageCircle, CheckCircle,
  ChevronRight, Package, X, Plus, Minus,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { storefrontProducts } from '@/lib/mock-data';
import { useCart } from '@/lib/cart-context';

export default function StorefrontPage() {
  const { cart, addToCart, updateQty, totalItems, totalPrice } = useCart();
  const [cartOpen, setCartOpen] = useState(false);
  const router = useRouter();

  function handleCheckout() {
    router.push('/checkout');
  }

  return (
    <div className="min-h-screen bg-background text-on-surface font-sans">

      {/* ── Navbar ── */}
      <nav className="sticky top-0 z-50 bg-white border-b border-outline-variant">
        <div className="max-w-6xl mx-auto px-4 md:px-8 h-16 flex items-center justify-between">
          <span className="text-[20px] font-bold text-on-surface tracking-tight">BlokManager</span>
          <div className="hidden md:flex items-center gap-8 text-body-sm font-medium text-on-surface-variant">
            <a href="#inicio" className="hover:text-primary transition-colors border-b-2 border-primary text-primary pb-0.5">Início</a>
            <a href="#catalogo" className="hover:text-primary transition-colors">Catálogo</a>
            <a href="#como-funciona" className="hover:text-primary transition-colors">Como Funciona</a>
          </div>
          <Button className="h-9 bg-primary text-on-primary hover:bg-primary/90 rounded-md text-body-sm">
            Área do Cliente
          </Button>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section id="inicio" className="relative h-[480px] md:h-[520px] flex items-center overflow-hidden">
        <div className="absolute inset-0 bg-surface-container-highest">
          <div className="absolute inset-0 bg-gradient-to-r from-on-surface/80 via-on-surface/50 to-transparent" />
          <div className="absolute inset-0 opacity-10" style={{
            backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 40px, #006c4f 40px, #006c4f 41px), repeating-linear-gradient(90deg, transparent, transparent 40px, #006c4f 40px, #006c4f 41px)',
          }} />
        </div>
        <div className="relative max-w-6xl mx-auto px-4 md:px-8 w-full">
          <div className="max-w-xl">
            <h1 className="text-[32px] md:text-[48px] font-semibold leading-tight tracking-tight text-white">
              Encomende os seus{' '}
              <span className="text-primary-container">blocos</span>{' '}
              com precisão industrial.
            </h1>
            <p className="mt-4 text-[16px] text-white/80 leading-relaxed">
              Material de alta resistência para construção civil.<br />
              Entrega rápida e segura em Nampula, Nacala e arredores.
            </p>
            <Button
              className="mt-8 h-11 px-6 bg-secondary text-on-secondary hover:bg-secondary/90 rounded-md font-medium"
              onClick={() => document.getElementById('catalogo')?.scrollIntoView({ behavior: 'smooth' })}
            >
              Ver catálogo
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      </section>

      {/* ── Produtos ── */}
      <section id="catalogo" className="max-w-6xl mx-auto px-4 md:px-8 py-16">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="text-[28px] md:text-[32px] font-semibold text-on-surface tracking-tight">
              Nossos Produtos
            </h2>
            <div className="w-12 h-1 bg-primary rounded-full mt-2" />
          </div>
          <span className="text-label-caps text-on-surface-variant">Preços actualizados: Hoje</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {storefrontProducts.map(product => {
            const inCart = cart.find(i => i.type === product.type);
            return (
              <div
                key={product.type}
                className="rounded-md border border-outline-variant bg-white flex flex-col overflow-hidden hover:shadow-md transition-shadow"
              >
                <div className="h-40 bg-surface-container-low flex items-center justify-center relative">
                  <Package className="h-12 w-12 text-outline" />
                  {product.available && (
                    <span className="absolute top-3 left-3 bg-primary text-on-primary text-label-caps px-2 py-0.5 rounded-sm font-semibold">
                      • Disponível
                    </span>
                  )}
                  {inCart && (
                    <span className="absolute top-3 right-3 bg-secondary text-on-secondary text-label-caps px-2 py-0.5 rounded-sm font-semibold">
                      {inCart.quantity} un.
                    </span>
                  )}
                </div>

                <div className="p-4 flex flex-col gap-3 flex-1">
                  <div>
                    <h3 className="text-body-sm font-semibold text-on-surface">{product.name}</h3>
                    <p className="text-label-caps text-on-surface-variant mt-1 leading-relaxed">{product.description}</p>
                  </div>

                  <div className="flex items-end justify-between mt-auto">
                    <div>
                      <p className="text-label-caps text-on-surface-variant uppercase">Preço Unitário</p>
                      <p className="text-[20px] font-bold text-on-surface">MT {product.pricePerUnit.toLocaleString('pt-MZ')},00</p>
                    </div>
                    <div className="text-right">
                      <p className="text-label-caps text-on-surface-variant uppercase">Mínimo</p>
                      <p className="text-body-sm font-medium text-on-surface">{product.minimumOrder} un.</p>
                    </div>
                  </div>

                  {inCart ? (
                    <div className="flex items-center justify-between border border-outline-variant rounded-md px-3 h-10">
                      <button
                        onClick={() => updateQty(product.type, -product.minimumOrder)}
                        className="text-on-surface-variant hover:text-on-surface transition-colors"
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <span className="text-body-sm font-semibold text-on-surface">{inCart.quantity} un.</span>
                      <button
                        onClick={() => updateQty(product.type, product.minimumOrder)}
                        className="text-on-surface-variant hover:text-on-surface transition-colors"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <Button
                      onClick={() => addToCart({
                        type: product.type,
                        name: product.name,
                        pricePerUnit: product.pricePerUnit,
                        quantity: product.minimumOrder,
                      })}
                      variant="outline"
                      className="w-full h-10 border-outline-variant text-on-surface hover:bg-surface-container rounded-md text-body-sm"
                    >
                      Adicionar
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── Como encomendar ── */}
      <section id="como-funciona" className="bg-surface-container-low py-16">
        <div className="max-w-6xl mx-auto px-4 md:px-8">
          <div className="text-center mb-12">
            <h2 className="text-[28px] md:text-[32px] font-semibold text-on-surface tracking-tight">Como encomendar</h2>
            <p className="text-body-sm text-on-surface-variant mt-2">Processo simplificado em 3 etapas</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-0">
            {[
              { step: '1', title: 'Escolher blocos', desc: 'Seleccione o tipo e a quantidade necessária para o seu projecto.' },
              { step: '2', title: 'Localização', desc: 'Indique o local de descarga em Nampula ou arredores para cálculo de frete.' },
              { step: '3', title: 'Pagar', desc: 'Confirme o pagamento via M-Pesa, E-Mola ou transferência bancária.' },
            ].map((s, i) => (
              <div key={s.step} className="flex flex-col items-center text-center px-8 relative">
                {i < 2 && <div className="hidden md:block absolute top-6 left-[calc(50%+28px)] right-0 h-px bg-outline-variant" />}
                <div className="w-12 h-12 rounded-full bg-primary text-on-primary flex items-center justify-center text-[18px] font-bold z-10">
                  {s.step}
                </div>
                <h3 className="text-body-sm font-semibold text-on-surface mt-4">{s.title}</h3>
                <p className="text-label-caps text-on-surface-variant mt-2 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Entregamos onde você estiver ── */}
      <section className="max-w-6xl mx-auto px-4 md:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div className="h-[300px] rounded-md border border-outline-variant overflow-hidden">
            <iframe
              title="Mapa de Nampula"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              src="https://www.openstreetmap.org/export/embed.html?bbox=39.1800%2C-15.1800%2C39.3200%2C-15.0800&layer=mapnik&marker=-15.1165%2C39.2666"
              allowFullScreen
            />
          </div>
          <div>
            <h2 className="text-[28px] md:text-[32px] font-semibold text-on-surface tracking-tight">
              Entregamos onde você estiver
            </h2>
            <p className="text-body-sm text-on-surface-variant mt-4 leading-relaxed">
              Nossa frota está preparada para entregas em terrenos de difícil acesso.
              Garantimos a integridade de cada bloco do carregamento até à descarga.
            </p>
            <div className="mt-6 flex flex-col gap-3">
              {['Nampula Cidade e Arredores', 'Nacala e Nacala-a-Velha', 'Ilha de Moçambique e Monapo', 'Angoche e Distritos Costeiros'].map(zone => (
                <div key={zone} className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                  <span className="text-body-sm text-on-surface">{zone}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-surface-container-low border-t border-outline-variant">
        <div className="max-w-6xl mx-auto px-4 md:px-8 py-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <p className="text-body-sm font-semibold text-on-surface">BlokManager Moz</p>
            <div className="flex items-center gap-1.5 mt-1">
              <MapPin className="h-3.5 w-3.5 text-on-surface-variant" />
              <span className="text-label-caps text-on-surface-variant">Nampula, Moçambique</span>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 text-body-sm text-on-surface-variant">
              <Phone className="h-4 w-4" />
              <span>+258 84 000 0000</span>
            </div>
            <Button className="h-9 bg-primary text-on-primary hover:bg-primary/90 rounded-md text-body-sm">
              <MessageCircle className="h-4 w-4 mr-2" />
              WhatsApp Suporte
            </Button>
          </div>
        </div>
        <div className="border-t border-outline-variant">
          <div className="max-w-6xl mx-auto px-4 md:px-8 py-4 flex flex-col md:flex-row justify-between items-center gap-2">
            <span className="text-label-caps text-on-surface-variant">© 2024 BlokManager Moz. Todos os direitos reservados.</span>
            <div className="flex gap-6">
              <a href="#" className="text-label-caps text-on-surface-variant hover:text-primary transition-colors underline">Termos de Uso</a>
              <a href="#" className="text-label-caps text-on-surface-variant hover:text-primary transition-colors underline">Privacidade</a>
            </div>
          </div>
        </div>
      </footer>

      {/* ── Carrinho flutuante ── */}
      {totalItems > 0 && (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
          {cartOpen && (
            <div className="w-80 rounded-md border border-outline-variant bg-white shadow-xl p-4 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <h3 className="text-body-sm font-semibold text-on-surface">O meu carrinho</h3>
                <button onClick={() => setCartOpen(false)}>
                  <X className="h-4 w-4 text-on-surface-variant hover:text-on-surface" />
                </button>
              </div>
              <div className="flex flex-col gap-2 max-h-48 overflow-y-auto">
                {cart.map(item => (
                  <div key={item.type} className="flex items-center justify-between">
                    <div>
                      <p className="text-label-caps font-medium text-on-surface">{item.name}</p>
                      <p className="text-label-caps text-on-surface-variant">MT {item.pricePerUnit} × {item.quantity}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => updateQty(item.type, -50)}
                        className="w-6 h-6 rounded border border-outline-variant flex items-center justify-center hover:bg-surface-container"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="w-8 text-center text-label-caps font-medium">{item.quantity}</span>
                      <button
                        onClick={() => updateQty(item.type, 50)}
                        className="w-6 h-6 rounded border border-outline-variant flex items-center justify-center hover:bg-surface-container"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="border-t border-outline-variant pt-3 flex items-center justify-between">
                <div>
                  <p className="text-label-caps text-on-surface-variant">Total</p>
                  <p className="text-body-sm font-bold text-on-surface">MT {totalPrice.toLocaleString('pt-MZ')},00</p>
                </div>
                <Button
                  onClick={handleCheckout}
                  className="h-9 bg-primary text-on-primary hover:bg-primary/90 rounded-md text-body-sm"
                >
                  Encomendar
                </Button>
              </div>
            </div>
          )}

          <button
            onClick={() => setCartOpen(o => !o)}
            className="w-14 h-14 rounded-full bg-primary text-on-primary shadow-lg flex items-center justify-center relative hover:bg-primary/90 transition-colors"
          >
            <ShoppingCart className="h-6 w-6" />
            <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-secondary text-on-secondary text-[11px] font-bold flex items-center justify-center">
              {totalItems}
            </span>
          </button>
        </div>
      )}
    </div>
  );
}