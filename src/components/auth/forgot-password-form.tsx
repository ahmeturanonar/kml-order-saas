"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";
import { forgotPasswordAction, type ActionResult } from "@/actions/auth-actions";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: ActionResult = {
  ok: false,
  message: "",
};

export function ForgotPasswordForm() {
  const [state, action, isPending] = useActionState(forgotPasswordAction, initialState);

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
        <CardTitle>Şifremi unuttum</CardTitle>
        <CardDescription>E-postanızı girin; hesabınız varsa şifre sıfırlama bağlantısı gönderelim.</CardDescription>
      </div>

      <form className="space-y-4" action={action}>
        <div className="space-y-2">
          <Label htmlFor="email">E-posta</Label>
          <Input id="email" name="email" type="email" required />
        </div>
        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending ? "Gönderiliyor..." : "Sıfırlama bağlantısı gönder"}
        </Button>
      </form>
    </Card>
  );
}
