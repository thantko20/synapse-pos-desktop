import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type SortingState,
} from "@tanstack/react-table";

import { Button } from "#/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "#/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "#/components/ui/tabs";
import { inventoryQueries } from "../queries";
import { getLowStockColumns } from "../low-stock-columns";
import { getMovementColumns } from "../movement-columns";
import type { LowStockVariant } from "../types";

export function InventoryList() {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [lowStockPage, setLowStockPage] = useState(1);
  const [movementPage, setMovementPage] = useState(1);
  const [selectedVariant, setSelectedVariant] =
    useState<LowStockVariant | null>(null);
  const [activeTab, setActiveTab] = useState("low-stock");

  const { data: lowStockResult, isLoading: lowStockLoading } = useQuery(
    inventoryQueries.lowStock({ page: lowStockPage, pageSize: 10 }),
  );

  const { data: movementsResult, isLoading: movementsLoading } = useQuery({
    ...inventoryQueries.movements({
      productVariantId: selectedVariant?.productVariantId ?? "",
      page: movementPage,
      pageSize: 10,
    }),
    enabled: activeTab === "movements" && !!selectedVariant,
  });

  const lowStockColumns = useMemo(() => getLowStockColumns(), []);
  const movementColumns = useMemo(() => getMovementColumns(), []);

  const lowStockTable = useReactTable({
    data: lowStockResult?.items ?? [],
    columns: lowStockColumns,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    state: { sorting },
  });

  const movementTable = useReactTable({
    data: movementsResult?.items ?? [],
    columns: movementColumns,
    getCoreRowModel: getCoreRowModel(),
  });

  const lowStockTotalPages = lowStockResult
    ? Math.max(1, Math.ceil(lowStockResult.total / lowStockResult.pageSize))
    : 1;

  const movementTotalPages = movementsResult
    ? Math.max(
        1,
        Math.ceil(movementsResult.total / movementsResult.pageSize),
      )
    : 1;

  function handleViewMovements(variant: LowStockVariant) {
    setSelectedVariant(variant);
    setMovementPage(1);
    setActiveTab("movements");
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="font-heading text-2xl font-bold">Inventory</h1>
        <p className="text-sm text-muted-foreground">
          Track stock levels and view movement history.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="low-stock">Low Stock</TabsTrigger>
          <TabsTrigger value="movements">Movements</TabsTrigger>
        </TabsList>

        <TabsContent value="low-stock">
          {lowStockLoading ? (
            <div className="text-sm text-muted-foreground">
              Loading low stock items...
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border bg-card">
              <Table>
                <TableHeader>
                  {lowStockTable.getHeaderGroups().map((headerGroup) => (
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
                  {lowStockTable.getRowModel().rows.length ? (
                    lowStockTable.getRowModel().rows.map((row) => (
                      <TableRow
                        key={row.id}
                        className="cursor-pointer"
                        onClick={() => handleViewMovements(row.original)}
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
                        colSpan={lowStockColumns.length}
                        className="h-24 text-center"
                      >
                        No low stock items.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}

          <div className="flex items-center justify-between rounded-xl border bg-card px-4 py-3 mt-3">
            <div className="text-xs text-muted-foreground">
              Showing page {lowStockResult?.page ?? 1} of {lowStockTotalPages}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setLowStockPage((v) => v - 1)}
                disabled={lowStockPage <= 1}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setLowStockPage((v) => v + 1)}
                disabled={lowStockPage >= lowStockTotalPages}
              >
                Next
              </Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="movements">
          {selectedVariant && (
            <div className="rounded-xl border bg-card p-4 mb-3">
              <div className="text-sm font-medium">
                {selectedVariant.productName} &mdash;{" "}
                {selectedVariant.variantName}
              </div>
              <div className="text-xs text-muted-foreground">
                SKU: {selectedVariant.sku || "N/A"} &middot; Current stock:{" "}
                {selectedVariant.quantity}
              </div>
            </div>
          )}

          {!selectedVariant ? (
            <div className="text-sm text-muted-foreground">
              Select a variant from the Low Stock tab to view its movement
              history.
            </div>
          ) : movementsLoading ? (
            <div className="text-sm text-muted-foreground">
              Loading movements...
            </div>
          ) : (
            <>
              <div className="overflow-hidden rounded-xl border bg-card">
                <Table>
                  <TableHeader>
                    {movementTable.getHeaderGroups().map((headerGroup) => (
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
                    {movementTable.getRowModel().rows.length ? (
                      movementTable.getRowModel().rows.map((row) => (
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
                          colSpan={movementColumns.length}
                          className="h-24 text-center"
                        >
                          No movements recorded.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>

              <div className="flex items-center justify-between rounded-xl border bg-card px-4 py-3 mt-3">
                <div className="text-xs text-muted-foreground">
                  Showing page {movementsResult?.page ?? 1} of{" "}
                  {movementTotalPages}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setMovementPage((v) => v - 1)}
                    disabled={movementPage <= 1}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setMovementPage((v) => v + 1)}
                    disabled={movementPage >= movementTotalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
