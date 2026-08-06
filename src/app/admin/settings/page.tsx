import { SettingForm } from "@/components/admin/setting-form";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";
import { APP_SETTING_KEYS, getKmlPrice } from "@/lib/settings";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const [kmlPrice, setting] = await Promise.all([
    getKmlPrice(),
    prisma.appSetting.findUnique({
      where: { key: APP_SETTING_KEYS.kmlPrice },
      include: {
        updatedBy: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    }),
  ]);

  return (
    <Card className="space-y-5">
      <div>
        <CardTitle>Fiyatlandırma ayarları</CardTitle>
        <CardDescription>Gelecekteki yüklemelerde kullanılacak KML fiyatını değiştirin. Değişiklikler hemen uygulanır.</CardDescription>
      </div>

      <SettingForm currentPrice={kmlPrice} />

      {setting ? (
        <div className="rounded-2xl border border-slate-200/80 p-4 text-sm text-slate-500 dark:border-slate-800 dark:text-slate-400">
          Son güncelleme: {formatDate(setting.updatedAt)}
          {setting.updatedBy ? ` by ${setting.updatedBy.name ?? setting.updatedBy.email}` : ""}
        </div>
      ) : null}
    </Card>
  );
}
