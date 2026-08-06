"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { adjustUserCreditAction } from "@/actions/admin-actions";
import { Button } from "@/components/ui/button";

export function CreditAdjustForm({
  userId,
  mode,
}: {
  userId: string;
  mode: "add" | "remove";
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <form
      className="space-y-2"
      onSubmit={(event) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        const amount = Number(formData.get("amount") ?? "0");
        if (!window.confirm(`${Math.abs(amount)} TL ${mode === "add" ? "eklemek" : "çıkarmak"} istediğinizden emin misiniz?`)) {
          return;
        }

        startTransition(async () => {
          try {
            if (mode === "remove") {
              formData.set("amount", String(-Math.abs(amount)));
            }

            await adjustUserCreditAction(formData);
            toast.success("Kredi bakiyesi güncellendi.");
            window.location.reload();
          } catch (error) {
            toast.error(error instanceof Error ? error.message : "Kredi güncellemesi başarısız oldu.");
          }
        });
      }}
    >
      <input type="hidden" name="userId" value={userId} />
      <div className="grid gap-2 md:grid-cols-[120px_1fr_auto]">
        <input
          name="amount"
          type="number"
          min={1}
          step={1}
          required
          placeholder={mode === "add" ? "100" : "50"}
          className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-950"
          disabled={isPending}
        />
        <input
          name="reason"
          required
          placeholder={mode === "add" ? "Yönetici kredi düzeltmesi" : "Manuel kredi çıkarma"}
          className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-950"
          disabled={isPending}
        />
        <Button type="submit" size="sm" variant={mode === "add" ? "default" : "outline"} disabled={isPending}>
          {isPending ? "Kaydediliyor..." : mode === "add" ? "Kredi ekle" : "Kredi çıkar"}
        </Button>
      </div>
    </form>
  );
}
