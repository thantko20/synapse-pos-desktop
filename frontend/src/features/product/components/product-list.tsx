import { useDeferredValue, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
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
import { DataTable } from "#/components/data-table";
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
    }),
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
    [navigate],
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
        <Button
          render={({ className, children }) => (
            <Link
              to="/products/new"
              className={className}
              children={children}
            />
          )}
        >
          <PlusIcon data-icon="inline-start" />
          New Product
        </Button>
      </div>

      <DataTable
        table={table}
        isLoading={isLoading}
        loadingText="Loading products..."
        emptyText="No products found."
        pagination={{ page, totalPages, onPageChange: setPage }}
        toolbar={
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
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
        }
      />

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
