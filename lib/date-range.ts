export const DISPLAY_TIME_ZONE = "Asia/Shanghai";

export const SNAPSHOT_GRANULARITIES = ["hour", "day", "week", "month"] as const;
export type SnapshotGranularity = typeof SNAPSHOT_GRANULARITIES[number];

export const SNAPSHOT_GRANULARITY_OPTIONS: { value: SnapshotGranularity; label: string }[] = [
  { value: "hour", label: "按小时" },
  { value: "day", label: "按天" },
  { value: "week", label: "按周" },
  { value: "month", label: "按月" },
];

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export type DateRange = {
  from: string;
  to: string;
  label: string;
  preset: 7 | 30 | 90 | null;
};

function toDateString(date: Date) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: DISPLAY_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

function shiftDate(dateString: string, amount: number) {
  const date = new Date(`${dateString}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + amount);
  return date.toISOString().slice(0, 10);
}

function todayInDisplayZone() {
  return toDateString(new Date());
}

function isValidDate(value: string | undefined): value is string {
  if (!value || !DATE_PATTERN.test(value)) return false;
  const date = new Date(`${value}T12:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().startsWith(value);
}

export function resolveDateRange(params: { preset?: string; from?: string; to?: string }): DateRange {
  const today = todayInDisplayZone();
  const customFrom = isValidDate(params.from) ? params.from : null;
  const customTo = isValidDate(params.to) ? params.to : null;

  if (customFrom && customTo && customFrom <= customTo) {
    return {
      from: customFrom,
      to: customTo,
      label: `${customFrom} 至 ${customTo}`,
      preset: null,
    };
  }

  const preset = params.preset === "7" || params.preset === "90" ? Number(params.preset) as 7 | 90 : 30;
  return {
    from: shiftDate(today, -(preset - 1)),
    to: today,
    label: `最近 ${preset} 天`,
    preset,
  };
}

export function resolveGranularity(value: string | null | undefined): SnapshotGranularity {
  return SNAPSHOT_GRANULARITIES.includes(value as SnapshotGranularity)
    ? value as SnapshotGranularity
    : "day";
}

export function getDateRangeDays(range: DateRange) {
  const from = new Date(`${range.from}T12:00:00Z`);
  const to = new Date(`${range.to}T12:00:00Z`);
  return Math.floor((to.getTime() - from.getTime()) / 86400000) + 1;
}

export function formatSnapshotDate(value: string | null) {
  if (!value) return "尚未采集";
  return new Intl.DateTimeFormat("zh-CN", {
    timeZone: DISPLAY_TIME_ZONE,
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}
