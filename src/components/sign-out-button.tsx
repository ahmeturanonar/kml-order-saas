"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

export function SignOutButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      variant="ghost"
      className="justify-start"
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
