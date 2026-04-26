import type { ColumnDef } from "@tanstack/react-table";
import type { InventoryMovement } from "./types";

const movementTypeLabels: Record<string, string> = {
  purchase: "Purchase",
  sale: "Sale",
  adjustment: "Adjustment",
  return: "Return",
  transfer: "Transfer",
};

export function getMovementColumns(): ColumnDef<InventoryMovement>[] {
  return [
    {
      accessorKey: "createdAt",
      header: "Date",
      cell: ({ row }) => {
        const date = row.original.createdAt;
        if (!date) return "-";
        return new Date(date).toLocaleString();
      },
    },
    {
      accessorKey: "movementType",
      header: "Type",
      cell: ({ row }) => {
        const type = row.original.movementType;
        return movementTypeLabels[type] ?? type;
      },
    },
    {
      accessorKey: "quantity",
      header: "Quantity",
      cell: ({ row }) => {
        const qty = row.original.quantity;
        return (
          <span className={qty >= 0 ? "text-green-600" : "text-destructive"}>
            {qty >= 0 ? `+${qty}` : qty}
          </span>
        );
      },
    },
    {
      accessorKey: "referenceType",
      header: "Reference",
      cell: ({ row }) => {
        const refType = row.original.referenceType;
        const refId = row.original.referenceId;
        if (!refType) return "-";
        return (
          <div className="space-y-0.5">
            <div className="text-sm">{refType}</div>
            {refId && (
              <div className="text-xs text-muted-foreground truncate max-w-[120px]">
                {refId}
              </div>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "notes",
      header: "Notes",
      cell: ({ row }) => row.original.notes || "-",
    },
  ];
}
