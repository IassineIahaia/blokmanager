import { AdminSidebar, AdminBottomNav } from "@/components/shared/admin-nav";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <AdminSidebar />
      <div className="flex-1 flex flex-col pb-16 md:pb-0">{children}</div>
    </div>
  );
}