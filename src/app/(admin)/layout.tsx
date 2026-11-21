import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/../auth";
import { prisma } from "@/lib/prisma";
import { AdminBottomNav, AdminSidebar, AdminUserProvider } from "@/components/shared/admin-nav";

export const metadata: Metadata = {
  title: "Administração",
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // Segunda linha de defesa (o proxy já redirecciona): nunca renderizar o admin sem sessão
  const session = await auth();
  if (!session?.user) redirect("/login");

  const pendingVerification = await prisma.order.count({
    where: { paymentStatus: "em_verificacao", status: { not: "cancelado" } },
  });

  return (
    <AdminUserProvider user={{ name: session.user.name ?? "Administrador", email: session.user.email ?? "" }}>
      <div className="flex min-h-screen bg-background">
        <AdminSidebar pendingVerification={pendingVerification} />
        <div className="flex min-w-0 flex-1 flex-col pb-20 md:pb-0">{children}</div>
        <AdminBottomNav pendingVerification={pendingVerification} />
      </div>
    </AdminUserProvider>
  );
}
