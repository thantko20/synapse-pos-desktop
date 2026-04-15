import type { ColumnDef } from "@tanstack/react-table"
import type { Category } from "../types"
import { Button } from "#/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "#/components/ui/dropdown-menu"
import { ArrowUpDownIcon, MoreHorizontalIcon } from "lucide-react"

interface ColumnContext {
  onEdit: (category: Category) => void
  onArchive: (category: Category) => void
}

export function getCategoryColumns(ctx: ColumnContext): ColumnDef<Category>[] {
  return [
    {
      accessorKey: "name",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Name
          <ArrowUpDownIcon data-icon="inline-end" />
        </Button>
      ),
    },
    {
      accessorKey: "description",
      header: "Description",
    },
    {
      accessorKey: "isActive",
      header: "Status",
      cell: ({ row }) => (row.getValue("isActive") ? "Active" : "Archived"),
    },
    {
      id: "actions",
      enableHiding: false,
      cell: ({ row }) => {
        const category = row.original
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon-xs">
                <span className="sr-only">Open menu</span>
                <MoreHorizontalIcon />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuGroup>
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => ctx.onEdit(category)}>
                  Edit
                </DropdownMenuItem>
                {category.isActive && (
                  <DropdownMenuItem
                    onClick={() => ctx.onArchive(category)}
                    className="text-destructive"
                  >
                    Archive
                  </DropdownMenuItem>
                )}
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]
}