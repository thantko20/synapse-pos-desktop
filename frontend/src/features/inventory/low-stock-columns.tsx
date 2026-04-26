import type { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDownIcon } from "lucide-react";
import { Button } from "#/components/ui/button";
import type { LowStockVariant } from "./types";

export function getLowStockColumns(): ColumnDef<LowStockVariant>[] {
  return [
    {
      accessorKey: "productName",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Product
          <ArrowUpDownIcon data-icon="inline-end" />
        </Button>
      ),
      cell: ({ row }) => (
        <div className="space-y-1">
          <div className="font-medium">{row.original.productName}</div>
          <div className="text-xs text-muted-foreground">
            {row.original.variantName}
          </div>
        </div>
      ),
    },
    {
      accessorKey: "sku",
      header: "SKU",
      cell: ({ row }) => row.original.sku || "-",
    },
    {
      accessorKey: "quantity",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Stock
          <ArrowUpDownIcon data-icon="inline-end" />
        </Button>
      ),
      cell: ({ row }) => {
        const qty = row.original.quantity;
        const reorder = row.original.reorderPoint;
        return (
          <span className={qty <= reorder ? "text-destructive font-medium" : ""}>
            {qty}
          </span>
        );
      },
    },
    {
      accessorKey: "reorderPoint",
      header: "Reorder Point",
    },
    {
      accessorKey: "alertThreshold",
      header: "Alert Threshold",
    },
  ];
}
