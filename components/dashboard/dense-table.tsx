"use client";

import { cn } from "@/lib/utils";

interface TableColumn<T> {
  key: keyof T;
  label: string;
  width?: string;
  className?: string;
  render?: (value: unknown, row: T) => React.ReactNode;
}

interface DenseTableProps<T> {
  columns: TableColumn<T>[];
  data: T[];
  keyField: keyof T;
  onRowClick?: (row: T) => void;
  rowHeight?: string;
  striped?: boolean;
}

/**
 * High-density data table component
 * - Each row fits within 36px vertical space
 * - Micro-typography for micro-UI compliance
 * - Compact cell padding
 */
export function DenseTable<T extends Record<string, unknown>>({
  columns,
  data,
  keyField,
  onRowClick,
  rowHeight = "h-9",
  striped = true,
}: DenseTableProps<T>) {
  return (
    <div className="overflow-x-auto rounded-dense border border-white/10">
      <table className="w-full text-xs">
        {/* Header */}
        <thead>
          <tr className="border-b border-white/10 bg-white/[0.02]">
            {columns.map((col) => (
              <th
                key={String(col.key)}
                className={cn(
                  "px-3 py-2 text-left font-semibold text-zinc-400 whitespace-nowrap",
                  col.width,
                  col.className
                )}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>

        {/* Body */}
        <tbody>
          {data.length > 0 ? (
            data.map((row, idx) => (
              <tr
                key={String(row[keyField])}
                className={cn(
                  rowHeight,
                  "border-b border-white/10 transition-colors",
                  striped && idx % 2 === 1 ? "bg-white/[0.02]" : "",
                  onRowClick ? "cursor-pointer hover:bg-white/[0.04]" : ""
                )}
                onClick={() => onRowClick?.(row)}
              >
                {columns.map((col) => (
                  <td
                    key={String(col.key)}
                    className={cn(
                      "px-3 py-2 whitespace-nowrap text-zinc-300 truncate",
                      col.width,
                      col.className
                    )}
                  >
                    {(col.render
                      ? col.render(row[col.key], row)
                      : row[col.key]) as unknown as React.ReactNode}
                  </td>
                ))}
              </tr>
            ))
          ) : (
            <tr>
              <td
                colSpan={columns.length}
                className={cn(
                  rowHeight,
                  "px-3 py-2 text-center text-zinc-500"
                )}
              >
                No data available
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

/**
 * Pagination component for dense tables
 */
export function TablePagination({
  current,
  total,
  pageSize,
  onPageChange,
}: {
  current: number;
  total: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}) {
  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="flex items-center justify-between px-3 py-2 border-t border-white/10 bg-white/[0.01] text-xs text-zinc-500">
      <p>
        Showing {(current - 1) * pageSize + 1} to {Math.min(current * pageSize, total)} of {total}
      </p>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(current - 1)}
          disabled={current === 1}
          className="px-2 py-1 rounded-dense border border-white/10 hover:bg-white/[0.04] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Previous
        </button>
        <span className="px-2 py-1 text-zinc-400">
          Page {current} of {totalPages}
        </span>
        <button
          onClick={() => onPageChange(current + 1)}
          disabled={current === totalPages}
          className="px-2 py-1 rounded-dense border border-white/10 hover:bg-white/[0.04] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next
        </button>
      </div>
    </div>
  );
}
