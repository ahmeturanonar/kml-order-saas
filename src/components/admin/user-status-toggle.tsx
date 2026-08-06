"use client";

import { UserStatus } from "@prisma/client";
import { useTransition } from "react";
import { toast } from "sonner";
import { setUserStatusAction } from "@/actions/admin-actions";
import { Button } from "@/components/ui/button";

export function UserStatusToggle({
  userId,
  currentStatus,
}: {
  userId: string;
  currentStatus: UserStatus;
}) {
  const [isPending, startTransition] = useTransition();
  const nextStatus = currentStatus === UserStatus.ACTIVE ? UserStatus.DISABLED : UserStatus.ACTIVE;

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        if (
          !window.confirm(
            nextStatus === UserStatus.DISABLED
              ? "Bu kullanıcı devre dışı bırakılsın mı?"
              : "Bu kullanıcı etkinleştirilsin mi?",
          )
        ) {
          return;
        }

        const formData = new FormData(event.currentTarget);
        startTransition(async () => {
          try {
            await setUserStatusAction(formData);
            toast.success("Kullanıcı durumu güncellendi.");
            window.location.reload();
          } catch (error) {
            toast.error(error instanceof Error ? error.message : "Kullanıcı durumu güncellenemedi.");
          }
        });
      }}
    >
      <input type="hidden" name="userId" value={userId} />
      <input type="hidden" name="status" value={nextStatus} />
      <Button
        type="submit"
        size="sm"
        variant={nextStatus === UserStatus.DISABLED ? "destructive" : "secondary"}
        disabled={isPending}
      >
        {isPending ? "Kaydediliyor..." : nextStatus === UserStatus.DISABLED ? "Devre dışı bırak" : "Etkinleştir"}
      </Button>
    </form>
  );
}
