"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";
import { resetPasswordAction, type ActionResult } from "@/actions/auth-actions";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormMessage } from "@/components/auth/form-message";

const initialState: ActionResult = {
  ok: false,
  message: "",
};

export function ResetPasswordForm({ token }: { token: string }) {
  const [state, action, isPending] = useActionState(resetPasswordAction, initialState);

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
        <CardTitle>Şifreyi sıfırla</CardTitle>
        <CardDescription>Hesabınız için yeni bir şifre belirleyin.</CardDescription>
      </div>

      <form className="space-y-4" action={action}>
        <input type="hidden" name="token" value={token} />
        <div className="space-y-2">
          <Label htmlFor="password">Yeni şifre</Label>
          <Input id="password" name="password" type="password" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Şifreyi doğrulayın</Label>
          <Input id="confirmPassword" name="confirmPassword" type="password" required />
        </div>
        <FormMessage message={!state.ok ? state.message : null} />
        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending ? "Sıfırlanıyor..." : "Şifreyi sıfırla"}
        </Button>
      </form>
    </Card>
  );
}
