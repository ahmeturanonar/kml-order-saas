"use client";

import { startTransition, useState } from "react";
import { toast } from "sonner";
import { CREDIT_PACKAGES } from "@/lib/constants";
import { formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";

export function BuyCreditsCard() {
  const [loadingAmount, setLoadingAmount] = useState<number | null>(null);

  return (
    <Card className="space-y-5">
      <div>
        <CardTitle>Kredi satın al</CardTitle>
        <CardDescription>
          Stripe ile ön ödemeli kredi satın alın. Başarılı ödemenin ardından krediler otomatik olarak eklenir.
        </CardDescription>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {CREDIT_PACKAGES.map((amount) => (
          <button
            key={amount}
            type="button"
            className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-5 text-left transition hover:border-cyan-400 hover:bg-cyan-50 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-cyan-500 dark:hover:bg-cyan-500/10"
            disabled={loadingAmount === amount}
            onClick={() => {
              setLoadingAmount(amount);
              startTransition(async () => {
                try {
                  const response = await fetch("/api/stripe/checkout", {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ amount }),
                  });

                  const data = (await response.json()) as { url?: string; message?: string };
                  if (!response.ok || !data.url) {
                    toast.error(data.message ?? "Ödeme oturumu oluşturulamadı.");
                    return;
                  }

                  window.location.href = data.url;
                } catch {
                  toast.error("Ödeme başlatılamadı.");
                } finally {
                  setLoadingAmount(null);
                }
              });
            }}
          >
            <p className="text-xs uppercase tracking-[0.24em] text-cyan-600">Kredi paketi</p>
            <p className="mt-3 text-2xl font-semibold text-slate-950 dark:text-white">
              {formatCurrency(amount)}
            </p>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Müşteri bakiyesine {amount} kredi ekler.
            </p>
            <Button className="mt-4 w-full" type="button" disabled={loadingAmount === amount}>
              {loadingAmount === amount ? "Yönlendiriliyor..." : "Şimdi satın al"}
            </Button>
          </button>
        ))}
      </div>
    </Card>
  );
}
