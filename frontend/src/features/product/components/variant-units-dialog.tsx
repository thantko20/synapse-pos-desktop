import { useEffect, useMemo, useState } from "react"
import { PlusIcon, Trash2Icon } from "lucide-react"

import { Button } from "#/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "#/components/ui/dialog"
import {
  Field,
  FieldGroup,
  FieldLabel,
} from "#/components/ui/field"
import { Input } from "#/components/ui/input"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "#/components/ui/select"
import type { Unit } from "#/features/unit"
import { summarizeVariantUnits, validateVariantUnits } from "../unit-summary"

export interface VariantUnitFormValue {
  unitId: string
  parentUnitId: string
  factorToParent: number
  isDefault: boolean
}

interface VariantUnitsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  variantName: string
  units: Unit[]
  value: VariantUnitFormValue[]
  onSave: (value: VariantUnitFormValue[]) => void
}

function createEmptyUnit(): VariantUnitFormValue {
  return {
    unitId: "",
    parentUnitId: "",
    factorToParent: 1,
    isDefault: false,
  }
}

export function VariantUnitsDialog({
  open,
  onOpenChange,
  variantName,
  units,
  value,
  onSave,
}: VariantUnitsDialogProps) {
  const [draft, setDraft] = useState<VariantUnitFormValue[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setDraft(value.length ? value : [createEmptyUnit()])
      setError(null)
    }
  }, [open, value])

  const unitNameById = useMemo(
    () => new Map(units.map((unit) => [unit.id, unit.name])),
    [units]
  )

  const preview = summarizeVariantUnits(
    draft
      .filter((item) => item.unitId)
      .map((item) => ({
        ...item,
        unitName: unitNameById.get(item.unitId) ?? item.unitId,
      }))
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Variant Units</DialogTitle>
          <DialogDescription>
            Configure how <span className="font-medium text-foreground">{variantName || "this variant"}</span> is sold.
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-lg border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
          {preview}
        </div>

        <div className="space-y-3">
          {draft.map((item, index) => {
            const availableParents = draft.filter((candidate, candidateIndex) => {
              return candidateIndex !== index && candidate.unitId
            })

            return (
              <div key={index} className="rounded-xl border bg-background p-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div>
                    <div className="font-medium">Unit {index + 1}</div>
                    <div className="text-xs text-muted-foreground">
                      Base units have no parent. Compound units point to the package they contain.
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    disabled={draft.length === 1}
                    onClick={() => {
                      setDraft((current) => current.filter((_, itemIndex) => itemIndex !== index))
                    }}
                  >
                    <Trash2Icon />
                    <span className="sr-only">Remove unit</span>
                  </Button>
                </div>

                <FieldGroup>
                  <Field>
                    <FieldLabel>Unit</FieldLabel>
                    <Select
                      value={item.unitId}
                      onValueChange={(unitId) => {
                        setDraft((current) =>
                          current.map((currentItem, itemIndex) =>
                            itemIndex === index
                              ? {
                                  ...currentItem,
                                  unitId: unitId ?? "",
                                  parentUnitId:
                                    currentItem.parentUnitId === unitId
                                      ? ""
                                      : currentItem.parentUnitId,
                                }
                              : currentItem
                          )
                        )
                      }}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select a unit" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          {units.map((unit) => (
                            <SelectItem key={unit.id} value={unit.id}>
                              {unit.name}
                              {unit.symbol ? ` (${unit.symbol})` : ""}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </Field>

                  <Field>
                    <FieldLabel>Parent Unit</FieldLabel>
                    <Select
                      value={item.parentUnitId}
                      onValueChange={(parentUnitId) => {
                        setDraft((current) =>
                          current.map((currentItem, itemIndex) =>
                            itemIndex === index
                              ? { ...currentItem, parentUnitId: parentUnitId ?? "" }
                              : currentItem
                          )
                        )
                      }}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="No parent (base unit)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectItem value="">No parent (base unit)</SelectItem>
                          {availableParents.map((parent) => (
                            <SelectItem key={parent.unitId} value={parent.unitId}>
                              {unitNameById.get(parent.unitId) ?? parent.unitId}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </Field>

                  <Field>
                    <FieldLabel>Factor to Parent</FieldLabel>
                    <Input
                      type="number"
                      min={1}
                      value={item.factorToParent || 1}
                      onChange={(event) => {
                        const factorToParent = Number(event.target.value || 1)
                        setDraft((current) =>
                          current.map((currentItem, itemIndex) =>
                            itemIndex === index
                              ? { ...currentItem, factorToParent }
                              : currentItem
                          )
                        )
                      }}
                    />
                  </Field>

                  <Field className="md:col-span-2">
                    <FieldLabel>Default Unit</FieldLabel>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        variant={item.isDefault ? "default" : "outline"}
                        onClick={() => {
                          setDraft((current) =>
                            current.map((currentItem, itemIndex) => ({
                              ...currentItem,
                              isDefault: itemIndex === index,
                            }))
                          )
                        }}
                      >
                        {item.isDefault ? "Default Unit" : "Make Default"}
                      </Button>
                    </div>
                  </Field>
                </FieldGroup>
              </div>
            )
          })}
        </div>

        {error && <div className="text-sm text-destructive">{error}</div>}

        <DialogFooter className="justify-between sm:justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={() => setDraft((current) => [...current, createEmptyUnit()])}
          >
            <PlusIcon data-icon="inline-start" />
            Add Unit
          </Button>

          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              onClick={() => {
                const filtered = draft.filter((item) => item.unitId)
                const validationError = validateVariantUnits(filtered)
                if (validationError) {
                  setError(validationError)
                  return
                }

                onSave(filtered)
                onOpenChange(false)
              }}
            >
              Save Units
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
