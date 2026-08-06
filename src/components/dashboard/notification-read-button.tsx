"use client";

import { startTransition, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function NotificationReadButton({ notificationId }: { notificationId: string }) {
  const [isPending, setIsPending] = useState(false);

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      disabled={isPending}
      onClick={() => {
        setIsPending(true);
        startTransition(async () => {
          try {
            const response = await fetch("/api/notifications/read", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ notificationId }),
            });
            const data = (await response.json()) as { message: string };
            if (!response.ok) {
              toast.error(data.message);
              return;
            }

            toast.success(data.message);
            window.location.reload();
          } catch {
            toast.error("Bildirim güncellenemedi.");
          } finally {
            setIsPending(false);
          }
        });
      }}
    >
      {isPending ? "Kaydediliyor..." : "Okundu olarak işaretle"}
    </Button>
  );
}
