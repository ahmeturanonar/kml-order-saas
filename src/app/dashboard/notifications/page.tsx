import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { formatDate } from "@/lib/utils";
import { NotificationReadButton } from "@/components/dashboard/notification-read-button";
import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function DashboardNotificationsPage() {
  const session = await requireUser();
  const notifications = await prisma.notification.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <Card>
      <div className="mb-6">
        <CardTitle>Bildirimler</CardTitle>
        <CardDescription>Durum değişiklikleri ve kredi hareketleri burada görünür.</CardDescription>
      </div>

      <div className="space-y-4">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className="rounded-2xl border border-slate-200 p-4 dark:border-slate-800"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-slate-900 dark:text-white">{notification.title}</p>
                  {!notification.readAt ? <Badge variant="info">Yeni</Badge> : null}
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {formatDate(notification.createdAt)}
                </p>
              </div>
              <Badge variant={notification.readAt ? "neutral" : "info"}>
                {notification.readAt ? "Okundu" : "Okunmadı"}
              </Badge>
              {!notification.readAt ? (
                <NotificationReadButton notificationId={notification.id} />
              ) : null}
            </div>
            <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">{notification.message}</p>
          </div>
        ))}
      </div>
    </Card>
  );
}
