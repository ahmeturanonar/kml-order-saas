"use client";

import { startTransition, useRef, useState } from "react";
import { UploadCloud } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import {
  DEFAULT_ELEVATION_RESOLUTION,
  ELEVATION_RESOLUTION_OPTIONS,
  type ElevationResolution,
} from "@/lib/elevation-resolution";

export function UploadForm({
  creditBalance,
  price,
}: {
  creditBalance: number;
  price: number;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [resolution, setResolution] = useState<ElevationResolution>(
    DEFAULT_ELEVATION_RESOLUTION,
  );

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
              setResolution(DEFAULT_ELEVATION_RESOLUTION);
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
        <label className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-3xl border border-dashed border-slate-300 px-4 py-8 text-center transition-colors hover:border-cyan-400 dark:border-slate-700 dark:hover:border-cyan-500 sm:px-6 sm:py-10">
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

        <fieldset className="space-y-3">
          <legend className="text-sm font-semibold text-slate-950 dark:text-white">
            Elevation Cozunurlugu
          </legend>
          <div className="grid gap-3">
            {ELEVATION_RESOLUTION_OPTIONS.map((option) => {
              const checked = resolution === option.value;

              return (
                <label
                  key={option.value}
                  className={`flex cursor-pointer gap-3 rounded-2xl border px-4 py-4 transition-colors ${
                    checked
                      ? "border-cyan-400 bg-cyan-50/80 dark:border-cyan-500 dark:bg-cyan-500/10"
                      : "border-slate-200 bg-white/70 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-950/60 dark:hover:border-slate-700"
                  }`}
                >
                  <input
                    type="radio"
                    name="resolution"
                    value={option.value}
                    checked={checked}
                    onChange={() => setResolution(option.value)}
                    className="mt-1 size-4 border-slate-300 text-cyan-500 focus:ring-cyan-500 dark:border-slate-600"
                    disabled={creditBalance < price || isUploading}
                  />
                  <div className="space-y-1">
                    <p className="font-medium text-slate-900 dark:text-white">
                      {option.title} ({option.value})
                    </p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      {option.description}
                    </p>
                    {option.detail ? (
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        {option.detail}
                      </p>
                    ) : null}
                  </div>
                </label>
              );
            })}
          </div>
        </fieldset>

        {creditBalance < price ? (
          <p className="text-sm font-medium text-rose-500">Yetersiz kredi.</p>
        ) : null}

        <Button
          className="w-full sm:w-auto"
          type="submit"
          disabled={creditBalance < price || isUploading}
        >
          {isUploading ? "Yukleniyor..." : "KML yukle"}
        </Button>
      </form>
    </Card>
  );
}
