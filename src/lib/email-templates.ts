import { formatCurrency } from "@/lib/utils";

function wrapEmail(title: string, body: string) {
  return `
    <div style="font-family:Arial,sans-serif;line-height:1.6;color:#0f172a;max-width:640px;margin:0 auto;padding:24px;">
      <p style="font-size:12px;letter-spacing:0.2em;text-transform:uppercase;color:#0891b2;margin:0 0 12px;">Surfer KML SaaS</p>
      <h1 style="font-size:24px;margin:0 0 16px;">${title}</h1>
      ${body}
      <p style="margin-top:24px;color:#475569;">Teşekkürler,<br />Surfer KML SaaS</p>
    </div>
  `;
}

export function welcomeEmailTemplate(name: string) {
  return {
    subject: "Surfer KML SaaS'a hoş geldiniz",
    html: wrapEmail(
      "Aramıza hoş geldiniz",
      `<p>Merhaba ${name},</p><p>Hesabınız hazır. Artık kredi satın alabilir, KML dosyaları yükleyebilir ve sipariş ilerlemesini panelinizden takip edebilirsiniz.</p>`,
    ),
  };
}

export function passwordResetEmailTemplate(resetUrl: string) {
  return {
    subject: "Şifrenizi sıfırlayın",
    html: wrapEmail(
      "Şifrenizi sıfırlayın",
      `<p>Şifrenizi sıfırlamak için bir istek aldık.</p><p><a href="${resetUrl}" style="display:inline-block;background:#06b6d4;color:#082f49;padding:12px 18px;border-radius:10px;text-decoration:none;font-weight:700;">Şifreyi sıfırla</a></p><p>Bu isteği siz yapmadıysanız bu e-postayı yok sayabilirsiniz.</p>`,
    ),
  };
}

export function creditPurchasedEmailTemplate(amount: number, balanceAfter: number) {
  return {
    subject: "Hesabınıza kredi eklendi",
    html: wrapEmail(
      "Kredi satın alımı başarılı",
      `<p>Ödemeniz başarıyla tamamlandı.</p><p><strong>Eklenen kredi:</strong> ${formatCurrency(amount)}<br /><strong>Mevcut bakiye:</strong> ${formatCurrency(balanceAfter)}</p>`,
    ),
  };
}

export function adminCreditEmailTemplate(params: {
  amount: number;
  balanceAfter: number;
  adminName: string;
  reason: string;
}) {
  const action = params.amount >= 0 ? "eklendi" : "çıkarıldı";

  return {
    subject: `Krediler yönetici tarafından ${action}`,
    html: wrapEmail(
      `Krediler ${action}`,
      `<p>Bir yönetici (${params.adminName}) hesabınızdaki kredileri güncelledi.</p><p><strong>Tutar:</strong> ${formatCurrency(params.amount)}<br /><strong>Değişiklik sonrası bakiye:</strong> ${formatCurrency(params.balanceAfter)}<br /><strong>Neden:</strong> ${params.reason}</p>`,
    ),
  };
}

export function orderEmailTemplate(params: {
  title: string;
  message: string;
  orderNumber?: string;
}) {
  return {
    subject: params.title,
    html: wrapEmail(
      params.title,
      `<p>${params.message}</p>${params.orderNumber ? `<p><strong>Sipariş:</strong> ${params.orderNumber}</p>` : ""}`,
    ),
  };
}
