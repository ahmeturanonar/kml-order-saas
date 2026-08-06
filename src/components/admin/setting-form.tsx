"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { updateKmlPriceAction } from "@/actions/admin-actions";
import { Button } from "@/components/ui/button";

export function SettingForm({ currentPrice }: { currentPrice: number }) {
  const [isPending, startTransition] = useTransition();

  return (
    <form
      className="space-y-3"
      onSubmit={(event) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        startTransition(async () => {
          try {
            await updateKmlPriceAction(formData);
            toast.success("Fiyatlandırma güncellendi.");
            window.location.reload();
          } catch (error) {
            toast.error(error instanceof Error ? error.message : "Fiyatlandırma güncellenemedi.");
          }
        });
      }}
    >
      <div className="flex flex-wrap items-center gap-3">
        <input
          name="price"
          type="number"
          min={1}
          step={1}
          defaultValue={currentPrice}
          className="h-11 rounded-xl border border-slate-200 bg-white px-4 dark:border-slate-700 dark:bg-slate-950"
          disabled={isPending}
        />
        <Button type="submit" disabled={isPending}>
          {isPending ? "Kaydediliyor..." : "Fiyatı kaydet"}
        </Button>
      </div>
    </form>
  );
}
