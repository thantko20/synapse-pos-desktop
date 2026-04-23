import { useEffect, useMemo, useState } from "react";
import { PlusIcon, Trash2Icon } from "lucide-react";

import { Button } from "#/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "#/components/ui/dialog";
import { Input } from "#/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "#/components/ui/select";
import type { Unit } from "#/features/unit";
import { summarizeVariantUnits, validateVariantUnits } from "../unit-summary";

export interface VariantUnitFormValue {
  unitId: string;
  parentUnitId: string;
  factorToParent: number;
  isDefault: boolean;
}

interface VariantUnitsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  variantName: string;
  units: Unit[];
  value: VariantUnitFormValue[];
  onSave: (value: VariantUnitFormValue[]) => void;
}

function createEmptyUnit(): VariantUnitFormValue {
  return {
    unitId: "",
    parentUnitId: "",
    factorToParent: 1,
    isDefault: false,
  };
}

function normalizeBaseUnit(item: VariantUnitFormValue): VariantUnitFormValue {
  if (item.parentUnitId) {
    return item;
  }

  return {
    ...item,
    factorToParent: 1,
  };
}

export function VariantUnitsDialog({
  open,
  onOpenChange,
  variantName,
  units,
  value,
  onSave,
}: VariantUnitsDialogProps) {
  const [draft, setDraft] = useState<VariantUnitFormValue[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setDraft(value.length ? value : [createEmptyUnit()]);
      setError(null);
    }
  }, [open, value]);

  const unitNameById = useMemo(
    () => new Map(units.map((unit) => [unit.id, unit.name])),
    [units]
  );

  const preview = summarizeVariantUnits(
    draft
      .filter((item) => item.unitId)
      .map((item) => ({
        ...item,
        unitName: unitNameById.get(item.unitId) ?? item.unitId,
      }))
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Variant Units</DialogTitle>
          <DialogDescription>
            Configure how{" "}
            <span className="font-medium text-foreground">
              {variantName || "this variant"}
            </span>{" "}
            is sold.
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-lg border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
          {preview}
        </div>

        <div className="max-h-90 overflow-y-auto">
          <table className="w-full">
            <thead className="sticky top-0 bg-background">
              <tr className="border-b text-xs text-muted-foreground">
                <th className="pb-2 text-left font-medium">Unit</th>
                <th className="pb-2 text-left font-medium">Smaller Unit</th>
                <th className="pb-2 w-24 text-left font-medium">Factor</th>
                <th className="pb-2 w-24 text-center font-medium">Default</th>
                <th className="pb-2 w-10"></th>
              </tr>
            </thead>
            <tbody>
              {draft.map((item, index) => {
                const isBaseUnit = !item.parentUnitId;
                const availableParents = draft.filter(
                  (candidate, candidateIndex) =>
                    candidateIndex !== index && candidate.unitId
                );

                return (
                  <tr key={index} className="border-b last:border-b-0">
                    <td className="py-2 pr-3">
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
                          );
                        }}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select unit">
                            {unitNameById.get(item.unitId) ?? "Select unit"}
                          </SelectValue>
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
                    </td>
                    <td className="py-2 pr-3">
                      <Select
                        value={item.parentUnitId}
                        onValueChange={(parentUnitId) => {
                          setDraft((current) =>
                            current.map((currentItem, itemIndex) =>
                              itemIndex === index
                                ? normalizeBaseUnit({
                                    ...currentItem,
                                    parentUnitId: parentUnitId ?? "",
                                  })
                                : currentItem
                            )
                          );
                        }}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Base unit" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            <SelectItem value="">No smaller unit</SelectItem>
                            {availableParents.map((parent) => (
                              <SelectItem
                                key={parent.unitId}
                                value={parent.unitId}
                              >
                                {unitNameById.get(parent.unitId) ??
                                  parent.unitId}
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="py-2 pr-3">
                      <Input
                        type="number"
                        min={1}
                        value={isBaseUnit ? 1 : item.factorToParent || 1}
                        disabled={isBaseUnit}
                        onChange={(event) => {
                          const factorToParent = Number(
                            event.target.value || 1
                          );
                          setDraft((current) =>
                            current.map((currentItem, itemIndex) =>
                              itemIndex === index
                                ? {
                                    ...currentItem,
                                    factorToParent,
                                  }
                                : currentItem
                            )
                          );
                        }}
                        className="w-20"
                      />
                    </td>
                    <td className="py-2 text-center">
                      <Button
                        type="button"
                        variant={item.isDefault ? "default" : "outline"}
                        size="sm"
                        onClick={() => {
                          setDraft((current) =>
                            current.map((currentItem, itemIndex) => ({
                              ...currentItem,
                              isDefault: itemIndex === index,
                            }))
                          );
                        }}
                      >
                        {item.isDefault ? "Default" : "Set"}
                      </Button>
                    </td>
                    <td className="py-2 text-right">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        disabled={draft.length === 1}
                        onClick={() => {
                          setDraft((current) =>
                            current.filter(
                              (_, itemIndex) => itemIndex !== index
                            )
                          );
                        }}
                      >
                        <Trash2Icon />
                        <span className="sr-only">Remove unit</span>
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {error && <div className="text-sm text-destructive">{error}</div>}

        <DialogFooter className="justify-between sm:justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={() =>
              setDraft((current) => [...current, createEmptyUnit()])
            }
          >
            <PlusIcon data-icon="inline-start" />
            Add Unit
          </Button>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={() => {
                const filtered = draft
                  .filter((item) => item.unitId)
                  .map(normalizeBaseUnit);
                const validationError = validateVariantUnits(filtered);
                if (validationError) {
                  setError(validationError);
                  return;
                }

                onSave(filtered);
                onOpenChange(false);
              }}
            >
              Save Units
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
