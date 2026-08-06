import { PaymentStatus } from "@prisma/client";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { generatePaymentPackageName } from "@/lib/utils";
import { getAppUrl } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import { assertRateLimit } from "@/lib/rate-limit";
import { assertRequestOrigin } from "@/lib/request";
import { getStripeServerClient } from "@/lib/stripe";
import { createCheckoutSchema } from "@/lib/validations/payment";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ message: "Yetkisiz erişim." }, { status: 401 });
  }

  assertRequestOrigin(request);
  assertRateLimit(`checkout:${session.user.id}`, 20, 15 * 60 * 1000);

  const json = await request.json();
  const parsed = createCheckoutSchema.safeParse({
    amount: Number(json.amount),
  });

  if (!parsed.success) {
    return NextResponse.json(
      { message: parsed.error.issues[0]?.message ?? "Geçersiz paket." },
      { status: 400 },
    );
  }

  const payment = await prisma.payment.create({
    data: {
      userId: session.user.id,
      amount: parsed.data.amount,
      packageName: generatePaymentPackageName(parsed.data.amount),
      status: PaymentStatus.PENDING,
    },
  });

  const stripe = getStripeServerClient();
  const checkoutSession = await stripe.checkout.sessions.create({
    mode: "payment",
    customer_email: session.user.email ?? undefined,
    success_url: `${getAppUrl()}/dashboard/payments?status=success`,
    cancel_url: `${getAppUrl()}/dashboard/payments?status=cancelled`,
    metadata: {
      paymentId: payment.id,
      userId: session.user.id,
      amount: String(parsed.data.amount),
    },
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "try",
          unit_amount: parsed.data.amount * 100,
          product_data: {
            name: generatePaymentPackageName(parsed.data.amount),
            description: `KML siparişi yüklemeleri için ${parsed.data.amount} kredi`,
          },
        },
      },
    ],
  });

  await prisma.payment.update({
    where: { id: payment.id },
    data: {
      stripeSessionId: checkoutSession.id,
    },
  });

  return NextResponse.json({ url: checkoutSession.url });
}
