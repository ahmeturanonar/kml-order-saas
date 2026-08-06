export function FormMessage({ message }: { message?: string | null }) {
  if (!message) {
    return null;
  }

  return <p className="text-sm text-rose-500">{message}</p>;
}
