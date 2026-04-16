import { useMemo, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table"
import { PlusIcon } from "lucide-react"
import { toast } from "sonner"

import { Button } from "#/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "#/components/ui/table"
import { getUnitColumns } from "../columns"
import { unitApi } from "../api"
import { unitQueries } from "../queries"
import type { Unit } from "../types"
import { UnitFormDialog } from "./unit-form-dialog"

export function UnitList() {
  const queryClient = useQueryClient()
  const [createOpen, setCreateOpen] = useState(false)
  const [editUnit, setEditUnit] = useState<Unit | null>(null)

  const { data: result, isLoading } = useQuery(unitQueries.all())

  const createMutation = useMutation({
    mutationFn: unitApi.createUnit,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["units"] })
      toast.success("Unit created")
      setCreateOpen(false)
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })

  const updateMutation = useMutation({
    mutationFn: unitApi.updateUnit,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["units"] })
      toast.success("Unit updated")
      setEditUnit(null)
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })

  const columns = useMemo(
    () => getUnitColumns({ onEdit: (unit) => setEditUnit(unit) }),
    []
  )

  const table = useReactTable({
    data: result?.items ?? [],
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-bold">Units</h1>
          <p className="text-sm text-muted-foreground">
            Manage the shared unit catalog used by product variants.
          </p>
        </div>

        <Button onClick={() => setCreateOpen(true)}>
          <PlusIcon data-icon="inline-start" />
          New Unit
        </Button>
      </div>

      {isLoading ? (
        <div className="text-sm text-muted-foreground">Loading units...</div>
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
                        : flexRender(header.column.columnDef.header, header.getContext())}
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
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-24 text-center">
                    No units found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}

      <UnitFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSubmit={(value) => createMutation.mutate(value)}
        isPending={createMutation.isPending}
      />

      <UnitFormDialog
        open={!!editUnit}
        onOpenChange={(open) => !open && setEditUnit(null)}
        unit={editUnit}
        onSubmit={(value) => editUnit && updateMutation.mutate({ id: editUnit.id, ...value })}
        isPending={updateMutation.isPending}
      />
    </div>
  )
}
