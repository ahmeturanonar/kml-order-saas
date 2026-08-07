"use client";

import { startTransition, useRef, useState } from "react";
import { UploadCloud } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";

export function UploadForm({
  creditBalance,
  price,
}: {
  creditBalance: number;
  price: number;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  return (
    <Card className="space-y-5">
      <div>
        <CardTitle>Yeni KML yukle</CardTitle>
        <CardDescription>
          Her yukleme {price} TL&apos;dir. Desteklenen bicim: `.kml`, en fazla 50 MB.
        </CardDescription>
      </div>

      <form
        ref={formRef}
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          const formData = new FormData(event.currentTarget);

          setIsUploading(true);
          startTransition(async () => {
            try {
              const response = await fetch("/api/orders/upload", {
                method: "POST",
                body: formData,
              });

              const data = (await response.json()) as {
                message: string;
                duplicateMessage?: string;
              };
              if (!response.ok) {
                toast.error(data.message);
                return;
              }

              if (data.duplicateMessage) {
                toast.warning(data.duplicateMessage);
              }
              toast.success(data.message);
              formRef.current?.reset();
              window.setTimeout(() => {
                window.location.reload();
              }, data.duplicateMessage ? 1500 : 800);
            } catch {
              toast.error("Yukleme basarisiz oldu. Lutfen tekrar deneyin.");
            } finally {
              setIsUploading(false);
            }
          });
        }}
      >
        <label className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-3xl border border-dashed border-slate-300 px-6 py-10 text-center transition-colors hover:border-cyan-400 dark:border-slate-700 dark:hover:border-cyan-500">
          <UploadCloud className="size-8 text-cyan-500" />
          <div>
            <p className="font-medium text-slate-900 dark:text-white">Bir KML dosyasi secin</p>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Dosyalar guvenle saklanir ve sunucu tarafinda otomatik olarak islenir.
            </p>
          </div>
          <input
            name="file"
            type="file"
            accept=".kml,application/vnd.google-earth.kml+xml,application/xml,text/xml"
            className="hidden"
            required
            disabled={creditBalance < price || isUploading}
          />
        </label>

        {creditBalance < price ? (
          <p className="text-sm font-medium text-rose-500">Yetersiz kredi.</p>
        ) : null}

        <Button type="submit" disabled={creditBalance < price || isUploading}>
          {isUploading ? "Yukleniyor..." : "KML yukle"}
        </Button>
      </form>
    </Card>
  );
}
