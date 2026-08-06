"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { signIn } from "next-auth/react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormMessage } from "@/components/auth/form-message";

export function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <Card className="mx-auto w-full max-w-md space-y-6 p-8">
      <div className="space-y-2">
        <CardTitle>Giriş yap</CardTitle>
        <CardDescription>KML siparişlerinize ve kredi bakiyenize erişin.</CardDescription>
      </div>

      <form
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          const formData = new FormData(event.currentTarget);
          setError(null);

          startTransition(async () => {
            const result = await signIn("credentials", {
              email: String(formData.get("email") ?? ""),
              password: String(formData.get("password") ?? ""),
              redirect: false,
            });

            if (result?.error) {
              setError("E-posta veya şifre hatalı.");
              return;
            }

            toast.success("Başarıyla giriş yapıldı.");
            router.push("/dashboard");
            router.refresh();
          });
        }}
      >
        <div className="space-y-2">
          <Label htmlFor="email">E-posta</Label>
          <Input id="email" name="email" type="email" required />
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Şifre</Label>
            <Link
              href="/forgot-password"
              className="text-xs text-cyan-600 hover:text-cyan-500 dark:text-cyan-300"
            >
              Şifrenizi mi unuttunuz?
            </Link>
          </div>
          <Input id="password" name="password" type="password" required />
        </div>
        <FormMessage message={error} />
        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending ? "Giriş yapılıyor..." : "Giriş yap"}
        </Button>
      </form>

      <p className="text-sm text-slate-500 dark:text-slate-400">
        Hesabınız yok mu?{" "}
        <Link className="text-cyan-600 hover:text-cyan-500 dark:text-cyan-300" href="/register">
          Hesap oluşturun
        </Link>
      </p>
    </Card>
  );
}
