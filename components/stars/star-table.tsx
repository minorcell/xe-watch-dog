"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table";
import { ArrowDown, ArrowUp, ArrowUpDown, ExternalLink, Search } from "lucide-react";

import { ExportButton } from "@/components/stars/export-button";
import type { StarLeaderboardRow } from "@/lib/stars";

function formatUpdatedAt(value: string | null) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("zh-CN", {
    timeZone: "Asia/Shanghai",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function GrowthValue({ value }: { value: number | null }) {
  if (value === null) return <span className="text-muted-foreground">-</span>;
  if (value > 0)
    return (
      <span className="font-medium tabular-nums text-emerald-600 dark:text-emerald-500">
        +{value.toLocaleString("zh-CN")}
      </span>
    );
  return (
    <span className="tabular-nums text-muted-foreground">
      {value.toLocaleString("zh-CN")}
    </span>
  );
}

function VisibilityBadge({ visibility }: { visibility: StarLeaderboardRow["visibility"] }) {
  if (visibility === "private")
    return <span className="inline-flex rounded px-1.5 py-0.5 text-[11px] text-muted-foreground">私有</span>;
  if (visibility === "public")
    return <span className="inline-flex rounded px-1.5 py-0.5 text-[11px] text-muted-foreground">公开</span>;
  return <span className="text-[11px] text-muted-foreground/60">未采集</span>;
}

export function StarTable({
  data,
  range,
  query,
  onQueryChange,
  visibility,
  onVisibilityChange,
  onRepoClick,
}: {
  data: StarLeaderboardRow[];
  range: string;
  query: string;
  onQueryChange: (v: string) => void;
  visibility: string;
  onVisibilityChange: (v: string) => void;
  onRepoClick?: (fullName: string) => void;
}) {
  const [sorting, setSorting] = useState<SortingState>([{ id: "stars", desc: true }]);

  const filteredData = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return data.filter((row) => {
      const matchesQuery =
        !normalizedQuery ||
        `${row.fullName} ${row.projectName} ${row.topic}`.toLowerCase().includes(normalizedQuery);
      const matchesVisibility = visibility === "all" || row.visibility === visibility;
      return matchesQuery && matchesVisibility;
    });
  }, [data, query, visibility]);

  const columns = useMemo<ColumnDef<StarLeaderboardRow>[]>(
    () => [
      {
        id: "rank",
        header: "#",
        size: 48,
        cell: ({ row }) => (
          <span className="font-mono text-[11px] text-muted-foreground">
            {String(row.index + 1).padStart(2, "0")}
          </span>
        ),
        enableSorting: false,
      },
      {
        accessorKey: "fullName",
        header: "仓库",
        cell: ({ row }) => (
          <div className="min-w-48">
            <Link
              href={row.original.url}
              target="_blank"
              rel="noreferrer"
              className="text-xs font-medium hover:text-primary"
              onClick={(e) => e.stopPropagation()}
            >
              {row.original.fullName}
            </Link>
            <p className="mt-0.5 max-w-72 truncate text-[11px] text-muted-foreground">
              {row.original.topic}
            </p>
          </div>
        ),
      },
      {
        accessorKey: "visibility",
        header: "可见性",
        size: 72,
        cell: ({ getValue }) => (
          <VisibilityBadge visibility={getValue<StarLeaderboardRow["visibility"]>()} />
        ),
      },
      {
        accessorKey: "projectName",
        header: "项目",
        size: 96,
        cell: ({ getValue }) => <span className="text-xs">{String(getValue())}</span>,
      },
      {
        accessorKey: "stars",
        header: "Star",
        size: 80,
        sortUndefined: "last",
        cell: ({ getValue }) => {
          const value = getValue<number | null>();
          return value === null ? (
            <span className="text-muted-foreground">-</span>
          ) : (
            <span className="text-xs font-semibold tabular-nums">
              {value.toLocaleString("zh-CN")}
            </span>
          );
        },
      },
      {
        accessorKey: "growth",
        header: range + "增长",
        size: 80,
        sortUndefined: "last",
        cell: ({ getValue }) => <GrowthValue value={getValue<number | null>()} />,
      },
      {
        accessorKey: "forks",
        header: "Fork",
        size: 64,
        sortUndefined: "last",
        cell: ({ getValue }) => {
          const value = getValue<number | null>();
          return (
            <span className="tabular-nums text-xs text-muted-foreground">
              {value?.toLocaleString("zh-CN") ?? "-"}
            </span>
          );
        },
      },
      {
        accessorKey: "capturedAt",
        header: "最近快照",
        size: 100,
        cell: ({ getValue }) => (
          <span className="text-[11px] text-muted-foreground">
            {formatUpdatedAt(getValue<string | null>())}
          </span>
        ),
      },
      {
        id: "status",
        header: "状态",
        size: 72,
        cell: ({ row }) =>
          row.original.capturedAt ? (
            <span className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <i className="size-1.5 rounded-full bg-emerald-500" />
              已采集
            </span>
          ) : (
            <span className="text-[11px] text-muted-foreground/60">暂无快照</span>
          ),
        enableSorting: false,
      },
    ],
    [range],
  );

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data: filteredData,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 border-b px-4 py-2">
        <div className="relative max-w-56 flex-1">
          <Search className="pointer-events-none absolute left-2 top-1/2 size-3 -translate-y-1/2 text-muted-foreground" />
          <input
            id="repository-search"
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="搜索仓库…"
            className="h-7 w-full rounded-md border bg-transparent pl-7 pr-2 text-[11px] outline-none transition-colors placeholder:text-muted-foreground/50 focus-visible:border-foreground/20 focus-visible:ring-1 focus-visible:ring-ring"
          />
        </div>
        <select
          id="visibility-filter"
          value={visibility}
          onChange={(event) => onVisibilityChange(event.target.value)}
          className="h-7 rounded-md border bg-transparent px-2 text-[11px] outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          <option value="all">全部可见性</option>
          <option value="public">公开仓库</option>
          <option value="private">私有仓库</option>
          <option value="unknown">暂无快照</option>
        </select>
        <span className="text-[11px] text-muted-foreground">
          {filteredData.length} / {data.length}
        </span>
        <span className="ml-auto">
          <ExportButton rows={filteredData} range={range} />
        </span>
      </div>

      {/* Table body */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left">
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id} className="border-b bg-muted/30">
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="h-8 whitespace-nowrap px-3 text-[11px] font-medium text-muted-foreground first:pl-4 last:pr-4"
                    style={{ width: header.column.columnDef.size }}
                    aria-sort={header.column.getIsSorted() === "asc" ? "ascending" : header.column.getIsSorted() === "desc" ? "descending" : undefined}
                  >
                    {header.isPlaceholder ? null : header.column.getCanSort() ? (
                      <button
                        type="button"
                        className="inline-flex items-center gap-1 -ml-1.5 rounded px-1.5 py-1 transition-colors hover:bg-accent hover:text-accent-foreground"
                        onClick={header.column.getToggleSortingHandler()}
                        aria-label={`按 ${String(header.column.columnDef.header)} 排序`}
                      >
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {header.column.getIsSorted() === "asc" ? (
                          <ArrowUp className="size-3" />
                        ) : header.column.getIsSorted() === "desc" ? (
                          <ArrowDown className="size-3" />
                        ) : (
                          <ArrowUpDown className="size-3 text-muted-foreground/40" />
                        )}
                      </button>
                    ) : (
                      flexRender(header.column.columnDef.header, header.getContext())
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.length > 0 ? (
              table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  className="border-b border-border/50 transition-colors last:border-0 hover:bg-muted/30 cursor-pointer"
                  onClick={() => onRepoClick?.(row.original.fullName)}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td
                      key={cell.id}
                      className="h-10 whitespace-nowrap px-3 text-xs first:pl-4 last:pr-4"
                      style={{ width: cell.column.columnDef.size }}
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length} className="h-32 text-center text-xs text-muted-foreground">
                  没有匹配的仓库
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
