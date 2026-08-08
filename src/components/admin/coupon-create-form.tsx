"use client";

import { startTransition, useRef, useState } from "react";
import { toast } from "sonner";
import { createCouponAction } from "@/actions/coupon-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function CouponCreateForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [isPending, setIsPending] = useState(false);

  return (
    <form
      ref={formRef}
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);

        setIsPending(true);
        startTransition(async () => {
          try {
            const result = await createCouponAction(formData);
            toast.success(result.message);
            formRef.current?.reset();
            window.location.reload();
          } catch (error) {
            toast.error(error instanceof Error ? error.message : "Kupon oluşturulamadı.");
          } finally {
            setIsPending(false);
          }
        });
      }}
    >
      <div className="space-y-2">
        <Label htmlFor="coupon-code">Kod</Label>
        <Input id="coupon-code" name="code" placeholder="ATO100" disabled={isPending} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="coupon-credit">Kredi miktarı</Label>
        <Input id="coupon-credit" name="creditAmount" type="number" min={1} step={1} placeholder="100" disabled={isPending} />
      </div>

      <label className="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700 dark:border-slate-800 dark:text-slate-200">
        <input name="isActive" type="checkbox" defaultChecked className="size-4 rounded border-slate-300 text-cyan-500 focus:ring-cyan-500" disabled={isPending} />
        Aktif
      </label>

      <Button className="w-full" type="submit" disabled={isPending}>
        {isPending ? "Kaydediliyor..." : "Kupon Oluştur"}
      </Button>
    </form>
  );
}
