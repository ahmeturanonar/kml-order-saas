"use client";

import { startTransition, useRef, useState } from "react";
import { toast } from "sonner";
import { redeemCouponAction } from "@/actions/coupon-actions";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function CouponRedemptionCard() {
  const formRef = useRef<HTMLFormElement>(null);
  const [isPending, setIsPending] = useState(false);

  return (
    <Card className="space-y-5 border-cyan-400/20 bg-[radial-gradient(circle_at_top_right,_rgba(34,211,238,0.08),_transparent_38%),linear-gradient(180deg,_rgba(255,255,255,0.98),_rgba(248,250,252,0.96))] shadow-cyan-500/5 dark:bg-[radial-gradient(circle_at_top_right,_rgba(34,211,238,0.14),_transparent_42%),linear-gradient(180deg,_rgba(2,6,23,0.96),_rgba(8,15,28,0.96))]">
      <div>
        <CardTitle>Kupon Kodu</CardTitle>
        <CardDescription>Geçerli bir kupon kodu girerek hesabınıza otomatik kredi ekleyin.</CardDescription>
      </div>

      <form
        ref={formRef}
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          const formData = new FormData(event.currentTarget);

          setIsPending(true);
          startTransition(async () => {
            try {
              const result = await redeemCouponAction(formData);
              toast.success(result.message);
              formRef.current?.reset();
              window.location.reload();
            } catch (error) {
              toast.error(error instanceof Error ? error.message : "Beklenmeyen bir hata oluştu.");
            } finally {
              setIsPending(false);
            }
          });
        }}
      >
        <div className="space-y-2">
          <Label htmlFor="coupon-code">Kupon kodu</Label>
          <Input id="coupon-code" name="code" placeholder="Kupon kodunuzu girin" disabled={isPending} />
        </div>

        <Button className="w-full" type="submit" disabled={isPending}>
          {isPending ? "Kullanılıyor..." : "Kuponu Kullan"}
        </Button>
      </form>
    </Card>
  );
}
