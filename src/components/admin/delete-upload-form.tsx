"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { deleteInvalidUploadAction } from "@/actions/admin-actions";
import { Button } from "@/components/ui/button";

export function DeleteUploadForm({ orderId }: { orderId: string }) {
  const [isPending, startTransition] = useTransition();

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        if (!window.confirm("Bu geçersiz yükleme silinsin ve krediler iade edilsin mi?")) {
          return;
        }

        const formData = new FormData(event.currentTarget);
        startTransition(async () => {
          try {
            await deleteInvalidUploadAction(formData);
            toast.success("Geçersiz yükleme silindi ve krediler iade edildi.");
          } catch (error) {
            toast.error(error instanceof Error ? error.message : "Silme işlemi başarısız oldu.");
          }
        });
      }}
    >
      <input type="hidden" name="orderId" value={orderId} />
      <Button type="submit" size="sm" variant="destructive" disabled={isPending}>
        {isPending ? "Siliniyor..." : "Sil"}
      </Button>
    </form>
  );
}
