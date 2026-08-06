import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold",
  {
    variants: {
      variant: {
        neutral: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-100",
        success: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-200",
        warning: "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-200",
        danger: "bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-200",
        info: "bg-cyan-100 text-cyan-700 dark:bg-cyan-500/20 dark:text-cyan-200",
      },
    },
    defaultVariants: {
      variant: "neutral",
    },
  },
);

export function Badge({
  className,
  variant,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badgeVariants>) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}
