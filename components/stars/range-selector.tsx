"use client";

import { useRef } from "react";

import {
  SNAPSHOT_GRANULARITY_OPTIONS,
  type DateRange,
  type SnapshotGranularity,
} from "@/lib/date-range";
import { cn } from "@/lib/utils";
import { usePageNavigate } from "@/components/layout/page-transition-context";

const presets = [7, 30, 90] as const;

export function RangeSelector({ value, granularity }: { value: DateRange; granularity: SnapshotGranularity }) {
  const navigate = usePageNavigate();
  const formRef = useRef<HTMLFormElement>(null);

  function buildUrl(nextGranularity: SnapshotGranularity) {
    const params = new URLSearchParams();
    if (value.preset) params.set("preset", String(value.preset));
    else {
      params.set("from", value.from);
      params.set("to", value.to);
    }
    params.set("granularity", nextGranularity);
    return `/dashboard?${params.toString()}`;
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!formRef.current) return;
    const fd = new FormData(formRef.current);
    const params = new URLSearchParams();
    const from = fd.get("from");
    const to = fd.get("to");
    if (from) params.set("from", String(from));
    if (to) params.set("to", String(to));
    params.set("granularity", granularity);
    navigate(`/dashboard?${params.toString()}`);
  }

  return (
    <div className="flex flex-wrap items-center justify-end gap-1.5">
      <div className="inline-flex items-center rounded-md bg-muted p-0.5" aria-label="图表颗粒度">
        {SNAPSHOT_GRANULARITY_OPTIONS.map((option) => {
          const selected = granularity === option.value;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => navigate(buildUrl(option.value))}
              className={cn(
                "grid h-7 place-items-center rounded-sm px-2 text-[11px] font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                selected && "bg-card text-foreground shadow-[0_1px_2px_rgb(0_0_0/4%)]",
              )}
              aria-pressed={selected}
            >
              {option.label}
            </button>
          );
        })}
      </div>
      <div className="inline-flex items-center rounded-md bg-muted p-0.5" aria-label="快捷时间范围">
        {presets.map((preset) => {
          const selected = value.preset === preset;
          return (
            <button
              key={preset}
              type="button"
              onClick={() => { navigate(`/dashboard?preset=${preset}&granularity=${granularity}`); }}
              className={cn(
                "grid h-7 min-w-11 place-items-center rounded-sm px-2.5 text-[11px] font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                selected && "bg-card text-foreground shadow-[0_1px_2px_rgb(0_0_0/4%)]",
              )}
              aria-current={selected ? "page" : undefined}
            >
              {preset}d
            </button>
          );
        })}
      </div>
      <form ref={formRef} onSubmit={handleSubmit} className="flex items-center gap-1 rounded-md border bg-background p-1">
        <input type="date" name="from" defaultValue={value.from} aria-label="开始日期" className="h-7 w-[120px] rounded-sm bg-transparent px-1.5 text-[11px] outline-none focus-visible:ring-1 focus-visible:ring-ring" />
        <span className="text-[11px] text-muted-foreground">–</span>
        <input type="date" name="to" defaultValue={value.to} aria-label="结束日期" className="h-7 w-[120px] rounded-sm bg-transparent px-1.5 text-[11px] outline-none focus-visible:ring-1 focus-visible:ring-ring" />
        <button type="submit" className="h-7 rounded-sm bg-foreground px-2.5 text-[11px] font-medium text-background transition-colors hover:bg-foreground/90">应用</button>
      </form>
    </div>
  );
}
