import {
  Bell,
  CreditCard,
  FolderKanban,
  LayoutDashboard,
  ReceiptText,
  Settings,
  TicketPercent,
  Shield,
  Users,
} from "lucide-react";
import { AppShellMobileNav } from "@/components/app-shell-mobile-nav";
import { ThemeToggle } from "@/components/theme-toggle";
import { SignOutButton } from "@/components/sign-out-button";
import { cn } from "@/lib/utils";

type AppShellProps = {
  title: string;
  description: string;
  links: Array<{
    href: string;
    label: string;
    icon: React.ReactNode;
  }>;
  currentPath: string;
  userName: string;
  children: React.ReactNode;
};

export const customerLinks = [
  {
    href: "/dashboard",
    label: "Genel Bakış",
    icon: <LayoutDashboard className="size-4" />,
  },
  {
    href: "/dashboard/orders",
    label: "Siparişler",
    icon: <FolderKanban className="size-4" />,
  },
  {
    href: "/dashboard/payments",
    label: "Ödemeler",
    icon: <CreditCard className="size-4" />,
  },
  {
    href: "/dashboard/credits",
    label: "Krediler",
    icon: <ReceiptText className="size-4" />,
  },
  {
    href: "/dashboard/notifications",
    label: "Bildirimler",
    icon: <Bell className="size-4" />,
  },
] satisfies Array<{ href: string; label: string; icon: React.ReactNode }>;

export const adminLinks = [
  {
    href: "/admin",
    label: "Genel Bakış",
    icon: <Shield className="size-4" />,
  },
  {
    href: "/admin/orders",
    label: "Siparişler",
    icon: <FolderKanban className="size-4" />,
  },
  {
    href: "/admin/users",
    label: "Kullanıcılar",
    icon: <Users className="size-4" />,
  },
  {
    href: "/admin/payments",
    label: "Ödemeler",
    icon: <CreditCard className="size-4" />,
  },
  {
    href: "/admin/credits",
    label: "Krediler",
    icon: <ReceiptText className="size-4" />,
  },
  {
    href: "/admin/coupons",
    label: "Kuponlar",
    icon: <TicketPercent className="size-4" />,
  },
  {
    href: "/admin/settings",
    label: "Ayarlar",
    icon: <Settings className="size-4" />,
  },
  {
    href: "/admin/audit",
    label: "Denetim",
    icon: <Bell className="size-4" />,
  },
] satisfies Array<{ href: string; label: string; icon: React.ReactNode }>;

export function AppShell({
  title,
  description,
  links,
  currentPath,
  userName,
  children,
}: AppShellProps) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(34,211,238,0.12),_transparent_24%),radial-gradient(circle_at_bottom_right,_rgba(148,163,184,0.1),_transparent_30%),linear-gradient(180deg,_#07111f_0%,_#050b14_100%)]">
      <div className="pointer-events-none absolute inset-0 opacity-[0.06] [background-image:linear-gradient(rgba(148,163,184,0.22)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.12)_1px,transparent_1px)] [background-size:54px_54px]" />
      <div className="mx-auto flex min-h-screen max-w-7xl gap-6 px-4 py-4 md:px-6">
        <aside className="hidden w-72 shrink-0 rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-2xl shadow-black/20 backdrop-blur-xl lg:flex lg:flex-col">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.32em] text-cyan-200/80">
              ATO Elevation
            </p>
            <h1 className="mt-3 text-2xl font-semibold text-white">{title}</h1>
            <p className="mt-2 text-sm text-slate-300">{description}</p>
          </div>

          <nav className="mt-10 space-y-2">
            {links.map((link) => {
              const isActive = currentPath === link.href;

              return (
                <a
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-colors",
                    isActive ? "bg-cyan-300 text-slate-950" : "text-slate-300 hover:bg-white/5",
                  )}
                >
                  {link.icon}
                  {link.label}
                </a>
              );
            })}
          </nav>

          <div className="mt-auto space-y-4 rounded-3xl border border-white/10 bg-white/5 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Oturum açan</p>
                <p className="mt-1 text-sm font-semibold text-white">{userName}</p>
              </div>
              <ThemeToggle />
            </div>
            <SignOutButton />
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col gap-6">
          <AppShellMobileNav
            title={title}
            currentPath={currentPath}
            userName={userName}
            links={links.map((link) => ({ href: link.href, label: link.label }))}
          />

          <main className="flex-1">{children}</main>
        </div>
      </div>
    </div>
  );
}
