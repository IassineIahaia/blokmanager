import Link from "next/link";
import { ArrowRight, MapPin, MessageCircle, Phone } from "lucide-react";
import { whatsappLink } from "@/lib/format";

interface StoreFooterProps {
  businessName: string;
  businessPhone: string;
  whatsappNumber: string;
}

export function StoreFooter({ businessName, businessPhone, whatsappNumber }: StoreFooterProps) {
  const year = new Date().getFullYear();

  return (
    <footer className="relative z-10 border-t border-white/10 bg-black px-6 py-16 text-white print:hidden md:px-12">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-12 md:grid-cols-12">
          <div className="md:col-span-6">
            <div className="mb-4 flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/brand/ssp-logo-white.png" alt={`${businessName}, SU, Lda`} width={800} height={238} className="h-10 w-auto" />
            </div>
            <p className="mb-8 max-w-sm text-white/50">
              Blocos de cimento e pavê produzidos em Nampula. Stock real, pagamento pelo telemóvel e entrega na sua obra.
            </p>
            <a
              href={whatsappLink(whatsappNumber, "Olá! Gostaria de um orçamento para blocos.")}
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 font-medium text-black transition-colors hover:bg-neutral-200"
            >
              <MessageCircle className="h-4 w-4" /> Pedir orçamento
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </a>
          </div>

          <div className="flex flex-col gap-4 md:col-span-3">
            <h4 className="mb-2 text-lg font-medium">Loja</h4>
            <Link href="/#catalogo" className="text-white/60 transition-colors hover:text-white">Catálogo</Link>
            <Link href="/#detalhes" className="text-white/60 transition-colors hover:text-white">Especificações</Link>
            <Link href="/#entregas" className="text-white/60 transition-colors hover:text-white">Entregas</Link>
            <Link href="/acompanhar" className="text-white/60 transition-colors hover:text-white">Acompanhar pedido</Link>
          </div>

          <div className="flex flex-col gap-4 md:col-span-3">
            <h4 className="mb-2 text-lg font-medium">Contacto</h4>
            <a href={`tel:${businessPhone.replace(/\s/g, "")}`} className="inline-flex items-center gap-2 text-white/60 transition-colors hover:text-white">
              <Phone className="h-4 w-4" /> {businessPhone}
            </a>
            <a href="tel:+258844490202" className="inline-flex items-center gap-2 text-white/60 transition-colors hover:text-white">
              <Phone className="h-4 w-4" /> +258 84 449 0202
            </a>
            <span className="inline-flex items-start gap-2 text-white/60">
              <MapPin className="mt-1 h-4 w-4 shrink-0" />
              <span>Muahivire Expansão, próximo ao Hospital do Control, Nampula</span>
            </span>
          </div>
        </div>

        <div className="mt-16 flex flex-col justify-between gap-4 border-t border-white/10 pt-8 text-sm text-white/40 md:flex-row">
          <p>© {year} {businessName}, SU, Lda. Todos os direitos reservados.</p>
          <div className="flex gap-6">
            <Link href="/privacidade" className="hover:text-white">Privacidade</Link>
            <Link href="/termos" className="hover:text-white">Termos</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
