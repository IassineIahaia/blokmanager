import { connection } from "next/server";
import { Bricolage_Grotesque, Playfair_Display } from "next/font/google";
import { StoreHeader } from "@/components/store/store-header";
import { StoreFooter } from "@/components/store/store-footer";
import { RevealOnScroll } from "@/components/store/reveal-on-scroll";
import { getSettings } from "@/lib/settings";

const display = Bricolage_Grotesque({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
});

const price = Playfair_Display({
  variable: "--font-price",
  subsets: ["latin"],
  weight: ["400", "500"],
  style: ["italic"],
});

export default async function StorefrontLayout({ children }: { children: React.ReactNode }) {
  await connection();
  const settings = await getSettings();

  return (
    <div
      className={`store ${display.variable} ${price.variable} relative flex min-h-screen flex-col overflow-x-hidden bg-[#f8f8f8] text-neutral-900 antialiased selection:bg-neutral-900 selection:text-white`}
    >
      <div className="grid-lines print:hidden" aria-hidden="true">
        <div className="grid-line" />
        <div className="grid-line hidden md:block" />
        <div className="grid-line hidden md:block" />
        <div className="grid-line" />
      </div>
      <StoreHeader businessName={settings.business_name} whatsappNumber={settings.whatsapp_number} />
      {/* Espaço para o menu flutuante; a página inicial cobre-o com o hero. */}
      <main className="relative z-10 flex-1 pt-28 print:pt-0">{children}</main>
      <StoreFooter
        businessName={settings.business_name}
        businessPhone={settings.business_phone}
        whatsappNumber={settings.whatsapp_number}
      />
      <RevealOnScroll />
    </div>
  );
}
