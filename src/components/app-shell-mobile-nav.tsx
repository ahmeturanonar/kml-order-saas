"use client";

import { useState } from "react";
import { Menu, X } from "lucide-react";
import { SignOutButton } from "@/components/sign-out-button";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type MobileNavLink = {
  href: string;
  label: string;
};

type AppShellMobileNavProps = {
  title: string;
  currentPath: string;
  userName: string;
  links: MobileNavLink[];
};

export function AppShellMobileNav({
  title,
  currentPath,
  userName,
  links,
}: AppShellMobileNavProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="lg:hidden">
      <header className="flex items-center gap-3 rounded-[2rem] border border-white/10 bg-white/5 px-4 py-4 shadow-xl shadow-black/20 backdrop-blur-xl">
        <Button
          type="button"
          variant="outline"
          size="icon"
          aria-label={isOpen ? "Menüyü kapat" : "Menüyü aç"}
          onClick={() => setIsOpen((current) => !current)}
        >
          {isOpen ? <X className="size-4" /> : <Menu className="size-4" />}
        </Button>

        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-200/80">
            ATO Elevation
          </p>
          <p className="mt-1 truncate text-base font-semibold text-white">{title}</p>
        </div>

        <ThemeToggle />
      </header>

      {isOpen ? (
        <>
          <button
            type="button"
            aria-label="Mobil menüyü kapat"
            className="fixed inset-0 z-40 bg-slate-950/55 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />
          <div className="fixed inset-x-4 top-4 z-50 max-h-[calc(100vh-2rem)] overflow-y-auto rounded-[2rem] border border-white/10 bg-[#08121f] p-5 shadow-2xl shadow-black/30">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-200/80">
                  Navigasyon
                </p>
                <p className="mt-2 truncate text-lg font-semibold text-white">{userName}</p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Menüyü kapat"
                onClick={() => setIsOpen(false)}
              >
                <X className="size-4" />
              </Button>
            </div>

            <nav className="mt-6 space-y-2">
              {links.map((link) => {
                const isActive = currentPath === link.href;

                return (
                  <a
                    key={link.href}
                    href={link.href}
                    onClick={() => setIsOpen(false)}
                    className={cn(
                      "flex items-center rounded-2xl px-4 py-3 text-sm font-medium transition-colors",
                      isActive ? "bg-cyan-300 text-slate-950" : "text-slate-200 hover:bg-white/5",
                    )}
                  >
                    {link.label}
                  </a>
                );
              })}
            </nav>

            <div className="mt-6 rounded-3xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Oturum açan</p>
              <p className="mt-1 break-all text-sm font-semibold text-white">{userName}</p>
              <div className="mt-4">
                <SignOutButton className="w-full justify-center" />
              </div>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
