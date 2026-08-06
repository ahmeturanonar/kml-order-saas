import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { AppShell, customerLinks } from "@/components/app-shell";
import { requireUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireUser();
  if (session.user.role === "ADMIN") {
    redirect("/admin");
  }

  const headerList = await headers();
  const currentPath = headerList.get("x-pathname") ?? "/dashboard";

  return (
    <AppShell
      title="Müşteri Paneli"
      description="Kredilerinizi, yüklemelerinizi, siparişlerinizi ve bildirimlerinizi yönetin."
      links={customerLinks}
      currentPath={currentPath}
      userName={session.user.name ?? session.user.email ?? "Müşteri"}
    >
      {children}
    </AppShell>
  );
}
