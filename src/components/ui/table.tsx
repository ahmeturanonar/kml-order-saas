import { cn } from "@/lib/utils";

export function Table({ className, ...props }: React.TableHTMLAttributes<HTMLTableElement>) {
  return (
    <div className="overflow-x-auto">
      <table className={cn("min-w-full text-left text-sm", className)} {...props} />
    </div>
  );
}

export function THead(props: React.HTMLAttributes<HTMLTableSectionElement>) {
  return <thead className="border-b border-slate-200 dark:border-slate-800" {...props} />;
}

export function TBody(props: React.HTMLAttributes<HTMLTableSectionElement>) {
  return <tbody {...props} />;
}

export function TH(props: React.ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400"
      {...props}
    />
  );
}

export function TD(props: React.TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td
      className="border-b border-slate-100 px-4 py-4 align-top text-slate-700 dark:border-slate-900 dark:text-slate-200"
      {...props}
    />
  );
}

export function TR(props: React.HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr
      className="transition-colors hover:bg-slate-50/70 dark:hover:bg-slate-900/60"
      {...props}
    />
  );
}
