"use client";

import { startTransition, useState } from "react";
import { toast } from "sonner";
import { setCouponStatusAction } from "@/actions/coupon-actions";
import { Button } from "@/components/ui/button";

export function CouponStatusButton({
  couponId,
  isActive,
}: {
  couponId: string;
  isActive: boolean;
}) {
  const [isPending, setIsPending] = useState(false);

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        const formData = new FormData();
        formData.set("couponId", couponId);
        formData.set("isActive", String(!isActive));

        setIsPending(true);
        startTransition(async () => {
          try {
            const result = await setCouponStatusAction(formData);
            toast.success(result.message);
            window.location.reload();
          } catch (error) {
            toast.error(error instanceof Error ? error.message : "Kupon durumu güncellenemedi.");
          } finally {
            setIsPending(false);
          }
        });
      }}
    >
      <Button type="submit" size="sm" variant={isActive ? "outline" : "default"} disabled={isPending}>
        {isPending ? "İşleniyor..." : isActive ? "Pasif yap" : "Aktif yap"}
      </Button>
    </form>
  );
}
