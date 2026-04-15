import { useDeferredValue, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type SortingState,
} from "@tanstack/react-table";
import { useNavigate } from "@tanstack/react-router";
import { PlusIcon, SearchIcon } from "lucide-react";
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
import { productApi } from "../api";
import { getProductColumns } from "../columns";
import { productQueries } from "../queries";
import type { Product } from "../types";
import { ArchiveDialog } from "./archive-dialog";
import { Link } from "@tanstack/react-router";

export function ProductList() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [sorting, setSorting] = useState<SortingState>([]);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [showArchived, setShowArchived] = useState(false);
  const [archiveProduct, setArchiveProduct] = useState<Product | null>(null);
  const deferredQuery = useDeferredValue(query);

  const { data: result, isLoading } = useQuery(
    productQueries.all({
      page,
      pageSize: 10,
      includeArchived: showArchived,
      query: deferredQuery,
    })
  );

  const archiveMutation = useMutation({
    mutationFn: productApi.archiveProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success("Product archived");
      setArchiveProduct(null);
    },
    onError: () => {
      toast.error("Failed to archive product");
    },
  });

  const columns = useMemo(
    () =>
      getProductColumns({
        onEdit: (product) =>
          navigate({ to: "/products/$id/edit", params: { id: product.id } }),
        onArchive: (product) => setArchiveProduct(product),
      }),
    [navigate]
  );

  const products = result?.items ?? [];
  const table = useReactTable({
    data: products,
    columns,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    state: { sorting },
  });

  const totalPages = result
    ? Math.max(1, Math.ceil(result.total / result.pageSize))
    : 1;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-bold">Products</h1>
          <p className="text-sm text-muted-foreground">
            Manage products and their sellable variants in one place.
          </p>
        </div>
        <Link className={""} to="/products/new">
          <PlusIcon data-icon="inline-start" />
          New Product
        </Link>
      </div>

      <div className="flex flex-col gap-3 rounded-xl border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full max-w-md">
          <SearchIcon className="absolute top-2.5 left-2.5 size-4 text-muted-foreground" />
          <Input
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setPage(1);
            }}
            placeholder="Search products, brand, SKU, or barcode"
            className="pl-8"
          />
        </div>
        <Button
          variant={showArchived ? "secondary" : "outline"}
          size="sm"
          onClick={() => {
            setShowArchived((value) => !value);
            setPage(1);
          }}
        >
          {showArchived ? "Hide archived" : "Show archived"}
        </Button>
      </div>

      {isLoading ? (
        <div className="text-sm text-muted-foreground">Loading products...</div>
      ) : (
        <div className="overflow-hidden rounded-xl border bg-card">
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
                            header.getContext()
                          )}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow key={row.id}>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
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
                    No products found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}

      <div className="flex items-center justify-between rounded-xl border bg-card px-4 py-3">
        <div className="text-xs text-muted-foreground">
          Showing page {result?.page ?? 1} of {totalPages}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((value) => value - 1)}
            disabled={page <= 1}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((value) => value + 1)}
            disabled={page >= totalPages}
          >
            Next
          </Button>
        </div>
      </div>

      {archiveProduct && (
        <ArchiveDialog
          open={!!archiveProduct}
          onOpenChange={(open) => !open && setArchiveProduct(null)}
          productName={archiveProduct.name}
          onConfirm={() => archiveMutation.mutate({ id: archiveProduct.id })}
          isPending={archiveMutation.isPending}
        />
      )}
    </div>
  );
}
