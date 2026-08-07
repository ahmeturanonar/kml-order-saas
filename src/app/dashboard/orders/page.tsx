import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { getKmlPrice } from "@/lib/settings";
import { formatCurrency } from "@/lib/utils";
import { OrderList } from "@/components/dashboard/order-list";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function DashboardOrdersPage() {
  const session = await requireUser();
  const kmlPrice = await getKmlPrice();
  const orders = await prisma.order.findMany({
    where: { userId: session.user.id },
    include: { uploadedFile: true, generatedFile: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <Card>
      <div className="mb-4">
        <CardTitle>Siparis gecmisi</CardTitle>
        <CardDescription>
          Her KML yuklemesi {formatCurrency(kmlPrice)} ucretli bir siparise donusturulur.
        </CardDescription>
      </div>

      <OrderList orders={orders} variant="full" />
    </Card>
  );
}
