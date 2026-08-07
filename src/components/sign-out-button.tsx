"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function SignOutButton({ className }: { className?: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      variant="ghost"
      className={cn("justify-start", className)}
      disabled={isPending}
      onClick={() =>
        startTransition(async () => {
          await signOut({ redirect: false });
          router.push("/login");
          router.refresh();
        })
      }
    >
      <LogOut className="mr-2 size-4" />
      {isPending ? "Çıkış yapılıyor..." : "Çıkış yap"}
    </Button>
  );
}
