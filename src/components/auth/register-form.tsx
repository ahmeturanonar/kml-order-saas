"use client";

import Link from "next/link";
import { useActionState, useEffect } from "react";
import { toast } from "sonner";
import { registerUserAction, type ActionResult } from "@/actions/auth-actions";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormMessage } from "@/components/auth/form-message";

const initialState: ActionResult = {
  ok: false,
  message: "",
};

export function RegisterForm() {
  const [state, action, isPending] = useActionState(registerUserAction, initialState);

  useEffect(() => {
    if (!state.message) {
      return;
    }

    if (state.ok) {
      toast.success(state.message);
    } else {
      toast.error(state.message);
    }
  }, [state]);

  return (
    <Card className="mx-auto w-full max-w-md space-y-6 p-8">
      <div className="space-y-2">
        <CardTitle>Hesabınızı oluşturun</CardTitle>
        <CardDescription>Kredi satın alın, KML dosyaları yükleyin ve siparişlerinizi takip edin.</CardDescription>
      </div>

      <form className="space-y-4" action={action}>
        <div className="space-y-2">
          <Label htmlFor="name">Ad soyad</Label>
          <Input id="name" name="name" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">E-posta</Label>
          <Input id="email" name="email" type="email" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Şifre</Label>
          <Input id="password" name="password" type="password" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Şifreyi doğrulayın</Label>
          <Input id="confirmPassword" name="confirmPassword" type="password" required />
        </div>
        <FormMessage message={!state.ok ? state.message : null} />
        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending ? "Oluşturuluyor..." : "Hesap oluştur"}
        </Button>
      </form>

      <p className="text-sm text-slate-500 dark:text-slate-400">
        Zaten hesabınız var mı?{" "}
        <Link className="text-cyan-600 hover:text-cyan-500 dark:text-cyan-300" href="/login">
          Giriş yapın
        </Link>
      </p>
    </Card>
  );
}
