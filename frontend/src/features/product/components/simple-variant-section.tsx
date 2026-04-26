import { withForm } from "#/hooks/form";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "#/components/ui/field";
import { Input } from "#/components/ui/input";
import { Button } from "#/components/ui/button";
import type { ProductFormValues } from "../schemas";
import { summarizeVariantUnits } from "../unit-summary";

type FormUnitValue = {
  unitId: string;
  parentUnitId: string;
  factorToParent: number;
  isDefault: boolean;
};

function extractSingleUnitId(units: FormUnitValue[]): string {
  return units[0]?.unitId ?? "";
}

function createSingleUnitArray(unitId: string): FormUnitValue[] {
  if (!unitId) return [];
  return [
    {
      unitId,
      parentUnitId: "",
      factorToParent: 1,
      isDefault: true,
    },
  ];
}

interface UnitOption {
  id: string;
  name: string;
  symbol: string;
}

export const SimpleVariantSection = withForm({
  defaultValues: {} as ProductFormValues,
  props: {
    availableUnits: [] as UnitOption[],
    onOpenUnitsDialog: () => {},
  },
  render: function Render({ form, availableUnits, onOpenUnitsDialog }) {
    return (
      <div className="flex flex-col gap-6 lg:pl-8">
        <div className="flex flex-col gap-1">
          <h2 className="font-heading text-lg font-semibold">
            Variant Details
          </h2>
          <p className="text-sm text-muted-foreground">
            Stock identifiers and thresholds for this product.
          </p>
        </div>

        <FieldGroup>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <form.AppField
              name="variants[0].sku"
              children={(field) => (
                <field.TextField
                  label="SKU"
                  placeholder="Optional unique SKU"
                />
              )}
            />
            <form.AppField
              name="variants[0].barcode"
              children={(field) => (
                <field.TextField
                  label="Barcode"
                  placeholder="Optional unique barcode"
                />
              )}
            />
            <form.Field
              name="variants[0].reorderPoint"
              children={(field) => {
                const isInvalid =
                  field.state.meta.isTouched && !field.state.meta.isValid;
                return (
                  <Field data-invalid={isInvalid}>
                    <FieldLabel htmlFor="simple-reorder">
                      Reorder Point
                    </FieldLabel>
                    <Input
                      id="simple-reorder"
                      type="number"
                      min={0}
                      name={field.name}
                      value={field.state.value || ""}
                      onBlur={field.handleBlur}
                      onChange={(e) =>
                        field.handleChange(Number(e.target.value || 0))
                      }
                      aria-invalid={isInvalid}
                      placeholder="Optional"
                    />
                    {isInvalid && (
                      <FieldError errors={field.state.meta.errors} />
                    )}
                  </Field>
                );
              }}
            />
            <form.Field
              name="variants[0].alertThreshold"
              children={(field) => {
                const isInvalid =
                  field.state.meta.isTouched && !field.state.meta.isValid;
                return (
                  <Field data-invalid={isInvalid}>
                    <FieldLabel htmlFor="simple-alert">
                      Alert Threshold
                    </FieldLabel>
                    <Input
                      id="simple-alert"
                      type="number"
                      min={0}
                      name={field.name}
                      value={field.state.value || ""}
                      onBlur={field.handleBlur}
                      onChange={(e) =>
                        field.handleChange(Number(e.target.value || 0))
                      }
                      aria-invalid={isInvalid}
                      placeholder="Optional"
                    />
                    {isInvalid && (
                      <FieldError errors={field.state.meta.errors} />
                    )}
                  </Field>
                );
              }}
            />
          </div>

          <form.Subscribe
            selector={(state) => state.values.hasMultipleUnits}
            children={(hasMultipleUnits) =>
              hasMultipleUnits ? (
                <form.Field
                  name="variants[0].units"
                  children={(field) => {
                    const isInvalid =
                      field.state.meta.isTouched && !field.state.meta.isValid;
                    const summary = summarizeVariantUnits(
                      field.state.value.map((unit) => ({
                        ...unit,
                        unitName:
                          availableUnits.find(
                            (candidate) => candidate.id === unit.unitId
                          )?.name ?? unit.unitId,
                      }))
                    );

                    return (
                      <Field
                        data-invalid={isInvalid}
                        className="md:col-span-2"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="space-y-1">
                            <FieldLabel>Units</FieldLabel>
                            <div className="text-sm text-muted-foreground">
                              {summary}
                            </div>
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={onOpenUnitsDialog}
                            disabled={!availableUnits.length}
                          >
                            Manage Units
                          </Button>
                        </div>
                        {!availableUnits.length && (
                          <div className="text-sm text-muted-foreground">
                            Create shared units first from the Units page.
                          </div>
                        )}
                        {isInvalid && (
                          <FieldError errors={field.state.meta.errors} />
                        )}
                      </Field>
                    );
                  }}
                />
              ) : (
                <form.AppField
                  name="variants[0].units"
                  children={(field) => (
                    <field.SelectField
                      label="Unit"
                      placeholder="Select unit"
                      getValue={(value) =>
                        extractSingleUnitId(value as FormUnitValue[])
                      }
                      setValue={(value) => createSingleUnitArray(value)}
                      options={availableUnits.map((u) => ({
                        value: u.id,
                        label: u.symbol
                          ? `${u.name} (${u.symbol})`
                          : u.name,
                      }))}
                    />
                  )}
                />
              )
            }
          />
        </FieldGroup>
      </div>
    );
  },
});
