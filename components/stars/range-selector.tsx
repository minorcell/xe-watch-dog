import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { DateRange } from "@/lib/date-range";
import { cn } from "@/lib/utils";

const presets = [7, 30, 90] as const;

export function RangeSelector({ value }: { value: DateRange }) {
  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      <div className="inline-flex items-center rounded-lg bg-muted p-1" aria-label="快捷时间范围">
        {presets.map((preset) => {
          const selected = value.preset === preset;
          return (
            <Link
              key={preset}
              href={`/dashboard?preset=${preset}`}
              className={cn(
                "grid min-h-10 min-w-14 place-items-center rounded-md px-3 text-xs font-medium text-muted-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                selected && "bg-card text-foreground shadow-xs",
              )}
              aria-current={selected ? "page" : undefined}
            >
              {preset} 天
            </Link>
          );
        })}
      </div>
      <form action="/dashboard" method="get" className="flex flex-wrap items-end gap-2 rounded-lg border bg-background p-1.5">
        <label className="grid gap-1 px-1.5 text-[10px] font-medium text-muted-foreground">
          开始
          <Input type="date" name="from" defaultValue={value.from} aria-label="开始日期" className="h-9 w-[132px] bg-card px-2 text-xs" />
        </label>
        <label className="grid gap-1 px-1.5 text-[10px] font-medium text-muted-foreground">
          结束
          <Input type="date" name="to" defaultValue={value.to} aria-label="结束日期" className="h-9 w-[132px] bg-card px-2 text-xs" />
        </label>
        <Button type="submit" size="sm" className="h-9">应用</Button>
      </form>
    </div>
  );
}
