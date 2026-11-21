import Link from "next/link";
import { MapPin, MessageCircle, Phone } from "lucide-react";
import { whatsappLink } from "@/lib/format";

interface StoreFooterProps {
  businessName: string;
  businessPhone: string;
  whatsappNumber: string;
}

export function StoreFooter({ businessName, businessPhone, whatsappNumber }: StoreFooterProps) {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-outline-variant bg-surface-container-low print:hidden">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 md:grid-cols-3 md:px-8">
        <div>
          <p className="font-semibold text-on-surface">{businessName}</p>
          <p className="mt-2 text-body-sm leading-relaxed text-on-surface-variant">
            Fábrica de blocos de cimento e pavê. Produção própria e entrega em toda a província de Nampula.
          </p>
          <p className="mt-3 flex items-center gap-1.5 text-body-sm text-on-surface-variant">
            <MapPin className="h-4 w-4" /> Nampula, Moçambique
          </p>
        </div>

        <div className="text-body-sm">
          <p className="mb-3 font-semibold text-on-surface">Loja</p>
          <ul className="space-y-2 text-on-surface-variant">
            <li><Link href="/#catalogo" className="hover:text-primary">Catálogo</Link></li>
            <li><Link href="/acompanhar" className="hover:text-primary">Acompanhar pedido</Link></li>
            <li><Link href="/termos" className="hover:text-primary">Termos de uso</Link></li>
            <li><Link href="/privacidade" className="hover:text-primary">Privacidade</Link></li>
          </ul>
        </div>

        <div className="text-body-sm">
          <p className="mb-3 font-semibold text-on-surface">Fale connosco</p>
          <a
            href={`tel:${businessPhone.replace(/\s/g, "")}`}
            className="flex items-center gap-2 text-on-surface-variant hover:text-primary"
          >
            <Phone className="h-4 w-4" /> {businessPhone}
          </a>
          <a
            href={whatsappLink(whatsappNumber, "Olá! Tenho uma dúvida sobre os blocos.")}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-flex h-10 items-center gap-2 rounded-md bg-[#25D366] px-4 font-medium text-white hover:bg-[#1fb957]"
          >
            <MessageCircle className="h-4 w-4" /> WhatsApp
          </a>
        </div>
      </div>
      <div className="border-t border-outline-variant">
        <p className="mx-auto max-w-6xl px-4 py-4 text-[12px] text-on-surface-variant md:px-8">
          © {year} {businessName}. Todos os direitos reservados.
        </p>
      </div>
    </footer>
  );
}
