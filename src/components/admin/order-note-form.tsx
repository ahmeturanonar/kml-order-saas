"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { saveOrderNoteAction } from "@/actions/admin-actions";
import { Button } from "@/components/ui/button";

export function OrderNoteForm({ orderId }: { orderId: string }) {
  const [isPending, startTransition] = useTransition();

  return (
    <form
      className="space-y-3"
      onSubmit={(event) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        startTransition(async () => {
          try {
            await saveOrderNoteAction(formData);
            toast.success("Dahili not eklendi.");
            window.location.reload();
          } catch (error) {
            toast.error(error instanceof Error ? error.message : "Not kaydedilemedi.");
          }
        });
      }}
    >
      <input type="hidden" name="orderId" value={orderId} />
      <textarea
        name="body"
        rows={4}
        required
        placeholder="Bu sipariş için dahili not ekleyin"
        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm dark:border-slate-700 dark:bg-slate-950"
        disabled={isPending}
      />
      <Button type="submit" size="sm" disabled={isPending}>
        {isPending ? "Kaydediliyor..." : "Not ekle"}
      </Button>
    </form>
  );
}
