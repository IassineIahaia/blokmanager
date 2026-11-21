import { connection } from "next/server";
import { StoreHeader } from "@/components/store/store-header";
import { StoreFooter } from "@/components/store/store-footer";
import { getSettings } from "@/lib/settings";

export default async function StorefrontLayout({ children }: { children: React.ReactNode }) {
  await connection();
  const settings = await getSettings();

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <StoreHeader businessName={settings.business_name} />
      <main className="flex-1">{children}</main>
      <StoreFooter
        businessName={settings.business_name}
        businessPhone={settings.business_phone}
        whatsappNumber={settings.whatsapp_number}
      />
    </div>
  );
}
