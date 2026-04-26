import type { ReactNode } from "react";
import { flexRender, type Table as TanStackTable } from "@tanstack/react-table";
import { Button } from "#/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "#/components/ui/table";

interface Pagination {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

interface DataTableProps<TData> {
  table: TanStackTable<TData>;
  isLoading?: boolean;
  loadingText?: string;
  emptyText?: string;
  pagination?: Pagination;
  onRowClick?: (row: TData) => void;
  toolbar?: ReactNode;
}

export function DataTable<TData>({
  table,
  isLoading = false,
  loadingText = "Loading...",
  emptyText = "No results.",
  pagination,
  onRowClick,
  toolbar,
}: DataTableProps<TData>) {
  const columns = table.getAllColumns();

  return (
    <div className="flex flex-col gap-3">
      {isLoading ? (
        <div className="text-sm text-muted-foreground">{loadingText}</div>
      ) : (
        <div className="overflow-hidden rounded-xl border bg-card">
          {toolbar && <div className="border-b p-4">{toolbar}</div>}
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    className={onRowClick ? "cursor-pointer" : undefined}
                    onClick={
                      onRowClick ? () => onRowClick(row.original) : undefined
                    }
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-24 text-center"
                  >
                    {emptyText}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {pagination && (
        <div className="flex items-center justify-between rounded-xl border bg-card px-4 py-3">
          <div className="text-xs text-muted-foreground">
            Showing page {pagination.page} of {pagination.totalPages}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => pagination.onPageChange(pagination.page - 1)}
              disabled={pagination.page <= 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => pagination.onPageChange(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
