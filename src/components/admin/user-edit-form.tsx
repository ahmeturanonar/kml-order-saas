"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { updateUserProfileAction } from "@/actions/admin-actions";
import { Button } from "@/components/ui/button";

export function UserEditForm({
  userId,
  name,
  email,
}: {
  userId: string;
  name: string;
  email: string;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <details className="rounded-2xl border border-slate-200/80 p-3 dark:border-slate-800">
      <summary className="cursor-pointer text-sm font-semibold text-slate-700 dark:text-slate-200">
        Kullanıcıyı düzenle
      </summary>
      <form
        className="mt-3 space-y-2"
        onSubmit={(event) => {
          event.preventDefault();
          const formData = new FormData(event.currentTarget);
          startTransition(async () => {
            try {
              await updateUserProfileAction(formData);
              toast.success("Kullanıcı güncellendi.");
              window.location.reload();
            } catch (error) {
              toast.error(error instanceof Error ? error.message : "Kullanıcı güncellenemedi.");
            }
          });
        }}
      >
        <input type="hidden" name="userId" value={userId} />
        <input
          name="name"
          defaultValue={name}
          required
          className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-950"
          disabled={isPending}
        />
        <input
          name="email"
          type="email"
          defaultValue={email}
          required
          className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-950"
          disabled={isPending}
        />
        <Button type="submit" size="sm" disabled={isPending}>
          {isPending ? "Kaydediliyor..." : "Değişiklikleri kaydet"}
        </Button>
      </form>
    </details>
  );
}
