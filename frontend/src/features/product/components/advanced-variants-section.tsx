import { PlusIcon, Trash2Icon } from "lucide-react";

import { withForm } from "#/hooks/form";
import { Button } from "#/components/ui/button";
import {
  Field,
  FieldError,
  FieldLabel,
} from "#/components/ui/field";
import { Input } from "#/components/ui/input";
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

function createEmptyVariant(): ProductFormValues["variants"][number] {
  return {
    id: "",
    name: "",
    sku: "",
    barcode: "",
    units: [],
    reorderPoint: 0,
    alertThreshold: 0,
  };
}

interface UnitOption {
  id: string;
  name: string;
  symbol: string;
}

export const AdvancedVariantsSection = withForm({
  defaultValues: {} as ProductFormValues,
  props: {
    availableUnits: [] as UnitOption[],
    onOpenUnitsDialog: (_index: number) => {},
  },
  render: function Render({ form, availableUnits, onOpenUnitsDialog }) {
    return (
      <div className="flex flex-col gap-6 lg:pl-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-1">
            <h2 className="font-heading text-lg font-semibold">Variants</h2>
            <p className="text-sm text-muted-foreground">
              Every product needs at least one sellable variant.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={() =>
              form.pushFieldValue("variants", createEmptyVariant())
            }
          >
            <PlusIcon data-icon="inline-start" />
            Add Variant
          </Button>
        </div>

        <form.Field
          name="variants"
          mode="array"
          children={(variantsField) => (
            <div className="flex flex-col divide-y">
              {variantsField.state.value.map((_, index) => (
                <div
                  key={index}
                  className="py-5 first:pt-0 last:pb-0"
                >
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <h3 className="text-sm font-medium text-muted-foreground">
                      Variant {index + 1}
                    </h3>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => variantsField.removeValue(index)}
                      disabled={variantsField.state.value.length === 1}
                    >
                      <Trash2Icon />
                      <span className="sr-only">Remove variant</span>
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="md:col-span-2">
                      <form.AppField
                        name={`variants[${index}].name`}
                        children={(field) => (
                          <field.TextField
                            label="Variant Name"
                            placeholder="Default, Large, Bottle, Box of 12"
                          />
                        )}
                      />
                    </div>
                    <form.AppField
                      name={`variants[${index}].sku`}
                      children={(field) => (
                        <field.TextField
                          label="SKU"
                          placeholder="Optional unique SKU"
                        />
                      )}
                    />
                    <form.AppField
                      name={`variants[${index}].barcode`}
                      children={(field) => (
                        <field.TextField
                          label="Barcode"
                          placeholder="Optional unique barcode"
                        />
                      )}
                    />
                    <form.Field
                      name={`variants[${index}].reorderPoint`}
                      children={(field) => {
                        const isInvalid =
                          field.state.meta.isTouched &&
                          !field.state.meta.isValid;
                        return (
                          <Field data-invalid={isInvalid}>
                            <FieldLabel htmlFor={`variant-reorder-${index}`}>
                              Reorder Point
                            </FieldLabel>
                            <Input
                              id={`variant-reorder-${index}`}
                              type="number"
                              min={0}
                              name={field.name}
                              value={field.state.value || ""}
                              onBlur={field.handleBlur}
                              onChange={(e) =>
                                field.handleChange(
                                  Number(e.target.value || 0)
                                )
                              }
                              aria-invalid={isInvalid}
                              placeholder="Optional"
                            />
                            {isInvalid && (
                              <FieldError
                                errors={field.state.meta.errors}
                              />
                            )}
                          </Field>
                        );
                      }}
                    />
                    <form.Field
                      name={`variants[${index}].alertThreshold`}
                      children={(field) => {
                        const isInvalid =
                          field.state.meta.isTouched &&
                          !field.state.meta.isValid;
                        return (
                          <Field data-invalid={isInvalid}>
                            <FieldLabel htmlFor={`variant-alert-${index}`}>
                              Alert Threshold
                            </FieldLabel>
                            <Input
                              id={`variant-alert-${index}`}
                              type="number"
                              min={0}
                              name={field.name}
                              value={field.state.value || ""}
                              onBlur={field.handleBlur}
                              onChange={(e) =>
                                field.handleChange(
                                  Number(e.target.value || 0)
                                )
                              }
                              aria-invalid={isInvalid}
                              placeholder="Optional"
                            />
                            {isInvalid && (
                              <FieldError
                                errors={field.state.meta.errors}
                              />
                            )}
                          </Field>
                        );
                      }}
                    />
                    <form.Subscribe
                      selector={(state) => state.values.hasMultipleUnits}
                      children={(hasMultipleUnits) =>
                        hasMultipleUnits ? (
                          <form.Field
                            name={`variants[${index}].units`}
                            children={(field) => {
                              const isInvalid =
                                field.state.meta.isTouched &&
                                !field.state.meta.isValid;
                              const summary = summarizeVariantUnits(
                                field.state.value.map((unit) => ({
                                  ...unit,
                                  unitName:
                                    availableUnits.find(
                                      (candidate) =>
                                        candidate.id === unit.unitId
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
                                      onClick={() =>
                                        onOpenUnitsDialog(index)
                                      }
                                      disabled={!availableUnits.length}
                                    >
                                      Manage Units
                                    </Button>
                                  </div>
                                  {!availableUnits.length && (
                                    <div className="text-sm text-muted-foreground">
                                      Create shared units first from the
                                      Units page.
                                    </div>
                                  )}
                                  {isInvalid && (
                                    <FieldError
                                      errors={field.state.meta.errors}
                                    />
                                  )}
                                </Field>
                              );
                            }}
                          />
                        ) : (
                          <form.AppField
                            name={`variants[${index}].units`}
                            children={(field) => (
                              <field.SelectField
                                label="Unit"
                                placeholder="Select unit"
                                getValue={(value) =>
                                  extractSingleUnitId(
                                    value as FormUnitValue[]
                                  )
                                }
                                setValue={(value) =>
                                  createSingleUnitArray(value)
                                }
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
                  </div>
                </div>
              ))}
            </div>
          )}
        />
      </div>
    );
  },
});
