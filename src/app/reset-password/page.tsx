import { notFound } from "next/navigation";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  if (!token) {
    notFound();
  }

  return (
    <div className="grid min-h-screen place-items-center px-6 py-16">
      <ResetPasswordForm token={token} />
    </div>
  );
}
