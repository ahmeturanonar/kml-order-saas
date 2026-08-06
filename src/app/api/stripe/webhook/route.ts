import { CreditSource, CreditTransactionType, NotificationType, PaymentStatus } from "@prisma/client";
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { recordAuditLog } from "@/lib/audit";
import { createCreditTransaction } from "@/lib/credits";
import { creditPurchasedEmailTemplate } from "@/lib/email-templates";
import { getStripeWebhookSecret } from "@/lib/env";
import { logger } from "@/lib/logger";
import { createNotification } from "@/lib/notifications";
import { prisma } from "@/lib/prisma";
import { getStripeServerClient } from "@/lib/stripe";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const stripe = getStripeServerClient();
  const signature = request.headers.get("stripe-signature");
  const payload = await request.text();

  if (!signature) {
    return NextResponse.json({ message: "Missing stripe signature." }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      payload,
      signature,
      getStripeWebhookSecret(),
    );
  } catch (error) {
    logger.error({ error }, "Invalid Stripe webhook signature");
    return NextResponse.json({ message: "Invalid signature." }, { status: 400 });
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const paymentId = session.metadata?.paymentId;
      const userId = session.metadata?.userId;
      const amount = Number(session.metadata?.amount ?? "0");

      if (paymentId && userId) {
        const paymentIntentId =
          typeof session.payment_intent === "string" ? session.payment_intent : null;
        const paymentIntent = paymentIntentId
          ? await stripe.paymentIntents.retrieve(paymentIntentId, {
              expand: ["latest_charge"],
            })
          : null;
        const latestCharge =
          paymentIntent && typeof paymentIntent.latest_charge !== "string"
            ? paymentIntent.latest_charge
            : null;
        let email: string | null = null;
        let balanceAfter = 0;

        await prisma.$transaction(async (tx) => {
          const currentPayment = await tx.payment.findUnique({
            where: { id: paymentId },
          });

          if (!currentPayment || currentPayment.status === PaymentStatus.SUCCEEDED) {
            return;
          }

          const updatedUser = await tx.user.update({
            where: { id: userId },
            data: {
              creditBalance: {
                increment: amount,
              },
            },
            select: {
              creditBalance: true,
              email: true,
            },
          });
          email = updatedUser.email;
          balanceAfter = updatedUser.creditBalance;

          await tx.payment.update({
            where: { id: paymentId },
            data: {
              status: PaymentStatus.SUCCEEDED,
              paidAt: new Date(),
              stripePaymentIntentId: paymentIntentId,
              receiptUrl: latestCharge?.receipt_url ?? null,
            },
          });

          await createCreditTransaction(tx, {
            userId,
            paymentId,
            amount,
            type: CreditTransactionType.PURCHASE,
            description: `Stripe purchase: ${amount} TL credits`,
            balanceAfter: updatedUser.creditBalance,
            sourceType: CreditSource.STRIPE,
          });

          await recordAuditLog(tx, {
            actorUserId: userId,
            action: "PAYMENT_SUCCEEDED",
            targetType: "PAYMENT",
            targetId: paymentId,
            targetLabel: currentPayment.packageName,
            metadata: {
              amount,
            },
          });
        });

        const emailTemplate = creditPurchasedEmailTemplate(amount, balanceAfter);
        await createNotification({
          userId,
          email: email ?? undefined,
          type: NotificationType.PAYMENT,
          title: "Payment successful",
          message: `${amount} credits were added to your balance.`,
          emailSubject: emailTemplate.subject,
          emailHtml: emailTemplate.html,
          linkPath: "/dashboard/payments",
        });
      }
    }

    if (
      event.type === "checkout.session.expired" ||
      event.type === "checkout.session.async_payment_failed"
    ) {
      const session = event.data.object as Stripe.Checkout.Session;
      const paymentId = session.metadata?.paymentId;

      if (paymentId) {
        await prisma.payment.updateMany({
          where: {
            id: paymentId,
            status: PaymentStatus.PENDING,
          },
          data: {
            status: PaymentStatus.CANCELLED,
            cancelledAt: new Date(),
          },
        });
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    logger.error({ error }, "Stripe webhook handling failed");
    return NextResponse.json({ message: "Webhook handler failed." }, { status: 500 });
  }
}
