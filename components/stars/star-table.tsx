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
import { ArrowDown, ArrowUp, ArrowUpDown, ExternalLink } from "lucide-react";

import { ExportButton } from "@/components/stars/export-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { StarLeaderboardRow } from "@/lib/stars";

function formatUpdatedAt(value: string | null) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("zh-CN", { timeZone: "Asia/Shanghai", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }).format(new Date(value));
}

function GrowthValue({ value }: { value: number | null }) {
  if (value === null) return <span className="text-muted-foreground">-</span>;
  if (value > 0) return <span className="font-medium text-emerald-700">+{value.toLocaleString("zh-CN")}</span>;
  return <span className="text-muted-foreground">{value.toLocaleString("zh-CN")}</span>;
}

function VisibilityBadge({ visibility }: { visibility: StarLeaderboardRow["visibility"] }) {
  if (visibility === "private") return <span className="inline-flex rounded-md bg-violet-50 px-2 py-1 text-xs font-medium text-violet-700">私有</span>;
  if (visibility === "public") return <span className="inline-flex rounded-md bg-sky-50 px-2 py-1 text-xs font-medium text-sky-700">公开</span>;
  return <span className="text-xs text-muted-foreground">未采集</span>;
}

export function StarTable({ data, range }: { data: StarLeaderboardRow[]; range: string }) {
  const [sorting, setSorting] = useState<SortingState>([{ id: "stars", desc: true }]);
  const [query, setQuery] = useState("");
  const [visibility, setVisibility] = useState("all");

  const filteredData = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return data.filter((row) => {
      const matchesQuery = !normalizedQuery || `${row.fullName} ${row.projectName} ${row.topic}`.toLowerCase().includes(normalizedQuery);
      const matchesVisibility = visibility === "all" || row.visibility === visibility;
      return matchesQuery && matchesVisibility;
    });
  }, [data, query, visibility]);

  const columns = useMemo<ColumnDef<StarLeaderboardRow>[]>(() => [
    {
      id: "rank",
      header: "排名",
      cell: ({ row }) => <span className="font-mono text-xs text-muted-foreground">{String(row.index + 1).padStart(2, "0")}</span>,
      enableSorting: false,
    },
    {
      accessorKey: "fullName",
      header: "仓库",
      cell: ({ row }) => (
        <div className="min-w-56">
          <Link href={row.original.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 font-medium hover:text-primary">
            {row.original.fullName}
            <ExternalLink className="size-3.5 text-muted-foreground" />
          </Link>
          <p className="mt-1 max-w-80 truncate text-xs text-muted-foreground">{row.original.topic}</p>
        </div>
      ),
    },
    {
      accessorKey: "visibility",
      header: "可见性",
      cell: ({ getValue }) => <VisibilityBadge visibility={getValue<StarLeaderboardRow["visibility"]>()} />,
    },
    {
      accessorKey: "projectName",
      header: "项目",
      cell: ({ getValue }) => <span className="text-sm">{String(getValue())}</span>,
    },
    {
      accessorKey: "stars",
      header: "当前 Star",
      sortUndefined: "last",
      cell: ({ getValue }) => {
        const value = getValue<number | null>();
        return value === null ? <span className="text-muted-foreground">-</span> : <span className="font-semibold tabular-nums">{value.toLocaleString("zh-CN")}</span>;
      },
    },
    {
      accessorKey: "growth",
      header: `${range}增长`,
      sortUndefined: "last",
      cell: ({ getValue }) => <GrowthValue value={getValue<number | null>()} />,
    },
    {
      accessorKey: "forks",
      header: "Fork",
      sortUndefined: "last",
      cell: ({ getValue }) => {
        const value = getValue<number | null>();
        return <span className="tabular-nums text-muted-foreground">{value?.toLocaleString("zh-CN") ?? "-"}</span>;
      },
    },
    {
      accessorKey: "capturedAt",
      header: "最近快照",
      cell: ({ getValue }) => <span className="text-xs text-muted-foreground">{formatUpdatedAt(getValue<string | null>())}</span>,
    },
    {
      id: "status",
      header: "状态",
      cell: ({ row }) => row.original.capturedAt ? (
        <span className="inline-flex items-center gap-1.5 text-xs text-emerald-700"><i className="size-1.5 rounded-full bg-emerald-600" />已采集</span>
      ) : (
        <span className="text-xs text-muted-foreground">暂无快照</span>
      ),
      enableSorting: false,
    },
  ], [range]);

  // TanStack Table owns internal table functions; React Compiler must not memoize this hook result.
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
      <div className="flex flex-wrap items-center gap-3 border-b bg-muted/20 px-5 py-3 md:px-6">
        <label className="sr-only" htmlFor="repository-search">搜索仓库</label>
        <Input id="repository-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索仓库、项目或主题" className="h-10 min-w-56 max-w-sm bg-card" />
        <label className="sr-only" htmlFor="visibility-filter">筛选可见性</label>
        <select id="visibility-filter" value={visibility} onChange={(event) => setVisibility(event.target.value)} className="h-10 rounded-lg border border-input bg-card px-3 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring/30">
          <option value="all">全部可见性</option>
          <option value="public">公开仓库</option>
          <option value="private">私有仓库</option>
          <option value="unknown">暂无快照</option>
        </select>
        <span className="text-xs text-muted-foreground">显示 {filteredData.length} / {data.length}</span>
        <span className="ml-auto"><ExportButton rows={filteredData} range={range} /></span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left">
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id} className="border-b bg-muted/40">
                {headerGroup.headers.map((header) => (
                  <th key={header.id} className="h-12 whitespace-nowrap px-4 text-xs font-medium text-muted-foreground first:pl-6 last:pr-6">
                    {header.isPlaceholder ? null : header.column.getCanSort() ? (
                      <Button variant="ghost" size="sm" className="-ml-3 h-10 px-3" onClick={header.column.getToggleSortingHandler()}>
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {header.column.getIsSorted() === "asc" ? <ArrowUp /> : header.column.getIsSorted() === "desc" ? <ArrowDown /> : <ArrowUpDown />}
                      </Button>
                    ) : flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.length > 0 ? table.getRowModel().rows.map((row) => (
              <tr key={row.id} className="border-b last:border-0 hover:bg-muted/30">
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="h-16 whitespace-nowrap px-4 text-sm first:pl-6 last:pr-6">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            )) : (
              <tr><td colSpan={columns.length} className="h-40 text-center text-sm text-muted-foreground">没有匹配的仓库</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
