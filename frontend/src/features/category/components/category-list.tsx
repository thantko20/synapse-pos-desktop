"use client";

import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type SortingState,
} from "@tanstack/react-table";
import { categoryQueries } from "../queries";
import { categoryApi } from "../api";
import type { Category } from "../types";
import { getCategoryColumns } from "../columns";
import { CategoryFormDialog } from "./category-form-dialog";
import { ArchiveDialog } from "./archive-dialog";
import { toast } from "sonner";

import { Button } from "#/components/ui/button";
import { Input } from "#/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "#/components/ui/table";
import { PlusIcon, SearchIcon } from "lucide-react";

export function CategoryList() {
  const queryClient = useQueryClient();
  const [sorting, setSorting] = useState<SortingState>([]);
  const [showArchived, setShowArchived] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editCategory, setEditCategory] = useState<Category | null>(null);
  const [archiveCategory, setArchiveCategory] = useState<Category | null>(null);

  const { data: result, isLoading } = useQuery(
    categoryQueries.all({ includeArchived: showArchived }),
  );

  const createMutation = useMutation({
    mutationFn: categoryApi.createCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      toast.success("Category created");
      setCreateDialogOpen(false);
    },
    onError: () => {
      toast.error("Failed to create category");
    },
  });

  const updateMutation = useMutation({
    mutationFn: categoryApi.updateCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      toast.success("Category updated");
      setEditCategory(null);
    },
    onError: () => {
      toast.error("Failed to update category");
    },
  });

  const archiveMutation = useMutation({
    mutationFn: categoryApi.archiveCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      toast.success("Category archived");
      setArchiveCategory(null);
    },
    onError: () => {
      toast.error("Failed to archive category");
    },
  });

  const columns = useMemo(
    () =>
      getCategoryColumns({
        onEdit: (category) => setEditCategory(category),
        onArchive: (category) => setArchiveCategory(category),
      }),
    [],
  );

  const categories = result?.items ?? [];

  const table = useReactTable({
    data: categories,
    columns,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    state: {
      sorting,
    },
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl font-bold">Categories</h1>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <PlusIcon data-icon="inline-start" />
          New Category
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative max-w-sm">
          <SearchIcon className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
          <Input
            placeholder="Filter categories..."
            value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
            onChange={(event) =>
              table.getColumn("name")?.setFilterValue(event.target.value)
            }
            className="pl-8"
          />
        </div>
        <Button
          variant={showArchived ? "secondary" : "outline"}
          size="sm"
          onClick={() => setShowArchived((prev) => !prev)}
        >
          {showArchived ? "Hide archived" : "Show archived"}
        </Button>
      </div>

      {isLoading ? (
        <div className="text-sm text-muted-foreground">
          Loading categories...
        </div>
      ) : (
        <div className="overflow-hidden rounded-md border">
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
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow key={row.id}>
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
                    No categories found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}

      <div className="flex items-center justify-end gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        >
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
        >
          Next
        </Button>
      </div>

      <CategoryFormDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSubmit={(data) => createMutation.mutate(data)}
        isPending={createMutation.isPending}
      />

      <CategoryFormDialog
        open={!!editCategory}
        onOpenChange={(open) => !open && setEditCategory(null)}
        category={editCategory}
        onSubmit={(data) =>
          editCategory &&
          updateMutation.mutate({ id: editCategory.id, ...data })
        }
        isPending={updateMutation.isPending}
      />

      {archiveCategory && (
        <ArchiveDialog
          open={!!archiveCategory}
          onOpenChange={(open) => !open && setArchiveCategory(null)}
          categoryName={archiveCategory.name}
          onConfirm={() => archiveMutation.mutate({ id: archiveCategory.id })}
          isPending={archiveMutation.isPending}
        />
      )}
    </div>
  );
}
