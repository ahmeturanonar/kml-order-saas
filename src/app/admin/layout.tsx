import { headers } from "next/headers";
import { AppShell, adminLinks } from "@/components/app-shell";
import { requireAdmin } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireAdmin();
  const headerList = await headers();
  const currentPath = headerList.get("x-pathname") ?? "/admin";

  return (
    <AppShell
      title="Yönetici Paneli"
      description="KML yüklemelerini inceleyin, durumları güncelleyin ve müşteri bakiyelerini yönetin."
      links={adminLinks}
      currentPath={currentPath}
      userName={session.user.name ?? session.user.email ?? "Yönetici"}
    >
      {children}
    </AppShell>
  );
}
