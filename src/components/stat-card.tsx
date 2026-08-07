import { Card, CardDescription, CardTitle } from "@/components/ui/card";

export function StatCard({
  title,
  value,
  description,
}: {
  title: string;
  value: string;
  description: string;
}) {
  return (
    <Card className="space-y-2">
      <CardDescription>{title}</CardDescription>
      <CardTitle className="text-2xl sm:text-3xl">{value}</CardTitle>
      <p className="text-sm text-slate-500 dark:text-slate-400">{description}</p>
    </Card>
  );
}
