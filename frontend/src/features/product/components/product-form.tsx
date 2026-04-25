import { useEffect, useMemo, useState } from "react";
import { useForm, useStore } from "@tanstack/react-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { ArrowLeftIcon, PlusIcon, Trash2Icon } from "lucide-react";
import { toast } from "sonner";

import { Button } from "#/components/ui/button";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "#/components/ui/field";
import { Input } from "#/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "#/components/ui/select";
import { Switch } from "#/components/ui/switch";
import { Textarea } from "#/components/ui/textarea";
import { categoryQueries } from "#/features/category";
import { unitQueries } from "#/features/unit";
import { productApi } from "../api";
import { VariantUnitsDialog } from "./variant-units-dialog";
import { productQueries } from "../queries";
import { ProductFormSchema, type ProductFormValues } from "../schemas";
import { summarizeVariantUnits } from "../unit-summary";
import {
  CreateProductInput,
  UpdateProductInput,
  UpdateProductVariantInput,
  type Product,
} from "../types";

type FormUnitValue = {
  unitId: string;
  parentUnitId: string;
  factorToParent: number;
  isDefault: boolean;
};

type FormVariantValue = ProductFormValues["variants"][number];

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

function extractSingleUnitId(units: FormUnitValue[]): string {
  return units[0]?.unitId ?? "";
}

function normalizeToSingleUnit(units: FormUnitValue[]): FormUnitValue[] {
  const defaultUnit = units.find((u) => u.isDefault) ?? units[0];
  if (!defaultUnit) return [];
  return [
    {
      unitId: defaultUnit.unitId,
      parentUnitId: "",
      factorToParent: 1,
      isDefault: true,
    },
  ];
}

function createDefaults(product?: Product): ProductFormValues {
  const hasVariants = (product?.variants?.length ?? 0) > 1;
  const hasMultipleUnits =
    product?.variants?.some((v) => (v.units?.length ?? 0) > 1) ?? false;

  const variants: FormVariantValue[] = product?.variants?.length
    ? product.variants.map((v) => ({
        id: v.id,
        name: v.name,
        sku: v.sku,
        barcode: v.barcode,
        units: (v.units ?? []).map((unit) => ({
          unitId: unit.unitId,
          parentUnitId: unit.parentUnitId,
          factorToParent: unit.factorToParent,
          isDefault: unit.isDefault,
        })),
        reorderPoint: v.reorderPoint,
        alertThreshold: v.alertThreshold,
      }))
    : [createEmptyVariant()];

  // In simple mode, ensure the single variant name stays in sync
  if (!hasVariants && variants[0]) {
    variants[0].name = product?.name ?? "";
  }

  return {
    name: product?.name ?? "",
    description: product?.description ?? "",
    categoryId: product?.categoryId ?? "",
    brand: product?.brand ?? "",
    notes: product?.notes ?? "",
    hasVariants,
    hasMultipleUnits,
    variants,
  };
}

interface ProductFormProps {
  productId?: string;
}

export function ProductForm({ productId }: ProductFormProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEditing = !!productId;
  const [unitsDialogIndex, setUnitsDialogIndex] = useState<number | null>(null);

  const { data: categoriesResult } = useQuery(
    categoryQueries.all({ pageSize: 100, includeArchived: false })
  );
  const { data: unitsResult } = useQuery(unitQueries.all());
  const { data: product, isLoading } = useQuery({
    ...productQueries.detail(productId ?? ""),
    enabled: isEditing,
  });

  const initialValues = useMemo(() => createDefaults(product), [product]);

  const form = useForm({
    defaultValues: initialValues,
    validators: {
      onSubmit: ProductFormSchema,
    },
    onSubmit: ({ value }) => {
      const payloadVariants = value.hasVariants
        ? value.variants
        : value.variants.slice(0, 1);

      if (isEditing && productId) {
        updateMutation.mutate(
          new UpdateProductInput({
            id: productId,
            name: value.name,
            description: value.description,
            categoryId: value.categoryId,
            brand: value.brand,
            notes: value.notes,
            variants: payloadVariants.map(
              (v) =>
                new UpdateProductVariantInput({
                  id: v.id,
                  name: v.name,
                  sku: v.sku,
                  barcode: v.barcode,
                  units: v.units.map((unit) => ({
                    unitId: unit.unitId,
                    parentUnitId: unit.parentUnitId,
                    factorToParent: unit.factorToParent,
                    isDefault: unit.isDefault,
                  })),
                  reorderPoint: v.reorderPoint,
                  alertThreshold: v.alertThreshold,
                })
            ),
          })
        );
        return;
      }

      createMutation.mutate(
        new CreateProductInput({
          name: value.name,
          description: value.description,
          categoryId: value.categoryId,
          brand: value.brand,
          notes: value.notes,
          variants: payloadVariants.map((v) => ({
            name: v.name,
            sku: v.sku,
            barcode: v.barcode,
            units: v.units.map((unit) => ({
              unitId: unit.unitId,
              parentUnitId: unit.parentUnitId,
              factorToParent: unit.factorToParent,
              isDefault: unit.isDefault,
            })),
            reorderPoint: v.reorderPoint,
            alertThreshold: v.alertThreshold,
          })),
        })
      );
    },
  });

  const values = useStore(form.store, (state) => state.values);
  const availableUnits = unitsResult?.items ?? [];

  const onProductNameChange = (name: string) => {
    const values = form.state.values;
    if (!values.hasVariants && values.variants[0]) {
      form.setFieldValue("variants[0].name", name);
    }
  };

  // Handle hasVariants toggle
  const handleToggleVariants = (checked: boolean) => {
    form.setFieldValue("hasVariants", checked);
    if (checked) {
      // Simple -> Advanced: ensure variant 0 has a name
      const currentName = values.variants[0]?.name || values.name || "Default";
      form.setFieldValue("variants[0].name", currentName);
    } else {
      // Advanced -> Simple: keep only variant 0, sync name
      const currentVariants = values.variants;
      if (currentVariants.length > 1) {
        form.setFieldValue("variants", [currentVariants[0]]);
      }
      form.setFieldValue("variants[0].name", values.name);
    }
  };

  // Handle hasMultipleUnits toggle
  const handleToggleMultipleUnits = (checked: boolean) => {
    form.setFieldValue("hasMultipleUnits", checked);
    if (!checked) {
      // Multiple -> Single: normalize all variants to single unit
      values.variants.forEach((_, index) => {
        const currentUnits = values.variants[index].units;
        form.setFieldValue(
          `variants[${index}].units`,
          normalizeToSingleUnit(currentUnits)
        );
      });
    }
    // Single -> Multiple: units are already in correct format
  };

  const createMutation = useMutation({
    mutationFn: productApi.createProduct,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success("Product created");
      navigate({ to: "/products" });
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: productApi.updateProduct,
    onSuccess: async (savedProduct) => {
      await queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.setQueryData(["products", savedProduct.id], savedProduct);
      toast.success("Product updated");
      navigate({ to: "/products" });
    },
    onError: () => {
      toast.error("Failed to update product");
    },
  });

  const isPending = createMutation.isPending || updateMutation.isPending;
  const activeDialogVariant =
    unitsDialogIndex === null ? null : values.variants[unitsDialogIndex];

  // Wait for product data to load before rendering form (to ensure correct defaultValues)
  if (isEditing && isLoading) {
    return (
      <div className="text-sm text-muted-foreground">Loading product...</div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => navigate({ to: "/products" })}
          >
            <ArrowLeftIcon data-icon="inline-start" />
            Back to Products
          </Button>
          <div>
            <h1 className="font-heading text-2xl font-bold">
              {isEditing ? "Edit Product" : "New Product"}
            </h1>
            <p className="text-sm text-muted-foreground">
              {values.hasVariants
                ? "Configure multiple variants and unit relations."
                : "A quick way to create a simple product with one variant."}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate({ to: "/products" })}
          >
            Cancel
          </Button>
          <Button type="submit" form="product-form" disabled={isPending}>
            {isPending
              ? "Saving..."
              : isEditing
                ? "Update Product"
                : "Create Product"}
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-6 rounded-xl border bg-card px-4 py-3">
        <div className="flex items-center gap-3">
          <Switch
            id="has-variants"
            checked={values.hasVariants}
            onCheckedChange={handleToggleVariants}
          />
          <label
            htmlFor="has-variants"
            className="cursor-pointer text-sm font-medium"
          >
            Multiple Variants
          </label>
        </div>
        <div className="flex items-center gap-3">
          <Switch
            id="has-multiple-units"
            checked={values.hasMultipleUnits}
            onCheckedChange={handleToggleMultipleUnits}
          />
          <label
            htmlFor="has-multiple-units"
            className="cursor-pointer text-sm font-medium"
          >
            Multiple Units
          </label>
        </div>
      </div>

      <form
        id="product-form"
        onSubmit={(e) => {
          e.preventDefault();
          form.handleSubmit();
        }}
        className="flex flex-col gap-6"
      >
        <div className="rounded-2xl border bg-card p-6 shadow-sm">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
            {/* Product Details */}
            <div className="flex flex-col gap-6 lg:border-r lg:pr-8">
              <div className="flex flex-col gap-1">
                <h2 className="font-heading text-lg font-semibold">
                  Product Details
                </h2>
                <p className="text-sm text-muted-foreground">
                  Core identity and categorization.
                </p>
              </div>

              <FieldGroup>
                <form.Field
                  name="name"
                  listeners={{
                    onChange: ({ value }) => {
                      onProductNameChange(value);
                    },
                  }}
                  children={(field) => {
                    const isInvalid =
                      field.state.meta.isTouched && !field.state.meta.isValid;
                    return (
                      <Field data-invalid={isInvalid} className="md:col-span-2">
                        <FieldLabel htmlFor="product-name">Name</FieldLabel>
                        <Input
                          id="product-name"
                          name={field.name}
                          value={field.state.value}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value)}
                          aria-invalid={isInvalid}
                          placeholder="Cold brew concentrate"
                        />
                        {isInvalid && (
                          <FieldError errors={field.state.meta.errors} />
                        )}
                      </Field>
                    );
                  }}
                />
                <form.Field
                  name="categoryId"
                  children={(field) => {
                    const isInvalid =
                      field.state.meta.isTouched && !field.state.meta.isValid;
                    return (
                      <Field data-invalid={isInvalid}>
                        <FieldLabel htmlFor="product-category">
                          Category
                        </FieldLabel>
                        <Select
                          name={field.name}
                          value={field.state.value}
                          onValueChange={(value) =>
                            field.handleChange(value ?? "")
                          }
                        >
                          <SelectTrigger
                            id="product-category"
                            className="w-full"
                            aria-invalid={isInvalid}
                          >
                            <SelectValue placeholder="Uncategorized">
                              {categoriesResult?.items.find(
                                (c) => c.id === field.state.value
                              )?.name ?? "Uncategorized"}
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            <SelectGroup>
                              <SelectItem value="">Uncategorized</SelectItem>
                              {(categoriesResult?.items ?? []).map(
                                (category) => (
                                  <SelectItem
                                    key={category.id}
                                    value={category.id}
                                  >
                                    {category.name}
                                  </SelectItem>
                                )
                              )}
                            </SelectGroup>
                          </SelectContent>
                        </Select>
                        {isInvalid && (
                          <FieldError errors={field.state.meta.errors} />
                        )}
                      </Field>
                    );
                  }}
                />
                <form.Field
                  name="brand"
                  children={(field) => {
                    const isInvalid =
                      field.state.meta.isTouched && !field.state.meta.isValid;
                    return (
                      <Field data-invalid={isInvalid}>
                        <FieldLabel htmlFor="product-brand">Brand</FieldLabel>
                        <Input
                          id="product-brand"
                          name={field.name}
                          value={field.state.value}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value)}
                          aria-invalid={isInvalid}
                          placeholder="Optional brand"
                        />
                        {isInvalid && (
                          <FieldError errors={field.state.meta.errors} />
                        )}
                      </Field>
                    );
                  }}
                />
                <form.Field
                  name="description"
                  children={(field) => {
                    const isInvalid =
                      field.state.meta.isTouched && !field.state.meta.isValid;
                    return (
                      <Field data-invalid={isInvalid} className="md:col-span-2">
                        <FieldLabel htmlFor="product-description">
                          Description
                        </FieldLabel>
                        <Textarea
                          id="product-description"
                          name={field.name}
                          value={field.state.value}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value)}
                          aria-invalid={isInvalid}
                          placeholder="Customer-facing description"
                          className="min-h-20"
                        />
                        {isInvalid && (
                          <FieldError errors={field.state.meta.errors} />
                        )}
                      </Field>
                    );
                  }}
                />
                <form.Field
                  name="notes"
                  children={(field) => {
                    const isInvalid =
                      field.state.meta.isTouched && !field.state.meta.isValid;
                    return (
                      <Field data-invalid={isInvalid} className="md:col-span-2">
                        <FieldLabel htmlFor="product-notes">Notes</FieldLabel>
                        <Textarea
                          id="product-notes"
                          name={field.name}
                          value={field.state.value}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value)}
                          aria-invalid={isInvalid}
                          placeholder="Internal notes for staff"
                          className="min-h-20"
                        />
                        {isInvalid && (
                          <FieldError errors={field.state.meta.errors} />
                        )}
                      </Field>
                    );
                  }}
                />
              </FieldGroup>
            </div>

            {/* Variants Column */}
            <div className="flex flex-col gap-6 lg:pl-8">
              {!values.hasVariants ? (
                /* Simple Mode */
                <>
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
                      <form.Field
                        name="variants[0].sku"
                        children={(field) => {
                          const isInvalid =
                            field.state.meta.isTouched &&
                            !field.state.meta.isValid;
                          return (
                            <Field data-invalid={isInvalid}>
                              <FieldLabel htmlFor="simple-sku">SKU</FieldLabel>
                              <Input
                                id="simple-sku"
                                name={field.name}
                                value={field.state.value}
                                onBlur={field.handleBlur}
                                onChange={(e) =>
                                  field.handleChange(e.target.value)
                                }
                                aria-invalid={isInvalid}
                                placeholder="Optional unique SKU"
                              />
                              {isInvalid && (
                                <FieldError errors={field.state.meta.errors} />
                              )}
                            </Field>
                          );
                        }}
                      />
                      <form.Field
                        name="variants[0].barcode"
                        children={(field) => {
                          const isInvalid =
                            field.state.meta.isTouched &&
                            !field.state.meta.isValid;
                          return (
                            <Field data-invalid={isInvalid}>
                              <FieldLabel htmlFor="simple-barcode">
                                Barcode
                              </FieldLabel>
                              <Input
                                id="simple-barcode"
                                name={field.name}
                                value={field.state.value}
                                onBlur={field.handleBlur}
                                onChange={(e) =>
                                  field.handleChange(e.target.value)
                                }
                                aria-invalid={isInvalid}
                                placeholder="Optional unique barcode"
                              />
                              {isInvalid && (
                                <FieldError errors={field.state.meta.errors} />
                              )}
                            </Field>
                          );
                        }}
                      />
                      <form.Field
                        name="variants[0].reorderPoint"
                        children={(field) => {
                          const isInvalid =
                            field.state.meta.isTouched &&
                            !field.state.meta.isValid;
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
                                  field.handleChange(
                                    Number(e.target.value || 0)
                                  )
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
                            field.state.meta.isTouched &&
                            !field.state.meta.isValid;
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
                                  field.handleChange(
                                    Number(e.target.value || 0)
                                  )
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

                    {/* Simple Unit Field */}
                    {values.hasMultipleUnits ? (
                      <form.Field
                        name="variants[0].units"
                        children={(field) => {
                          const isInvalid =
                            field.state.meta.isTouched &&
                            !field.state.meta.isValid;
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
                                  onClick={() => setUnitsDialogIndex(0)}
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
                      <form.Field
                        name="variants[0].units"
                        children={(field) => {
                          const isInvalid =
                            field.state.meta.isTouched &&
                            !field.state.meta.isValid;
                          const unitId = extractSingleUnitId(field.state.value);

                          return (
                            <Field data-invalid={isInvalid}>
                              <FieldLabel htmlFor="simple-unit">
                                Unit
                              </FieldLabel>
                              <Select
                                name={field.name}
                                value={unitId}
                                onValueChange={(value) =>
                                  field.handleChange(
                                    createSingleUnitArray(value ?? "")
                                  )
                                }
                              >
                                <SelectTrigger
                                  id="simple-unit"
                                  className="w-full"
                                  aria-invalid={isInvalid}
                                >
                                  <SelectValue placeholder="Select unit">
                                    {availableUnits.find((u) => u.id === unitId)
                                      ?.name ?? "Select unit"}
                                  </SelectValue>
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectGroup>
                                    {(availableUnits ?? []).map((unit) => (
                                      <SelectItem key={unit.id} value={unit.id}>
                                        {unit.name}
                                        {unit.symbol ? ` (${unit.symbol})` : ""}
                                      </SelectItem>
                                    ))}
                                  </SelectGroup>
                                </SelectContent>
                              </Select>
                              {isInvalid && (
                                <FieldError errors={field.state.meta.errors} />
                              )}
                            </Field>
                          );
                        }}
                      />
                    )}
                  </FieldGroup>
                </>
              ) : (
                /* Advanced Mode */
                <>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="space-y-1">
                      <h2 className="font-heading text-lg font-semibold">
                        Variants
                      </h2>
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
                                disabled={
                                  variantsField.state.value.length === 1
                                }
                              >
                                <Trash2Icon />
                                <span className="sr-only">Remove variant</span>
                              </Button>
                            </div>

                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                              <form.Field
                                name={`variants[${index}].name`}
                                children={(field) => {
                                  const isInvalid =
                                    field.state.meta.isTouched &&
                                    !field.state.meta.isValid;
                                  return (
                                    <Field
                                      data-invalid={isInvalid}
                                      className="md:col-span-2"
                                    >
                                      <FieldLabel
                                        htmlFor={`variant-name-${index}`}
                                      >
                                        Variant Name
                                      </FieldLabel>
                                      <Input
                                        id={`variant-name-${index}`}
                                        name={field.name}
                                        value={field.state.value}
                                        onBlur={field.handleBlur}
                                        onChange={(e) =>
                                          field.handleChange(e.target.value)
                                        }
                                        aria-invalid={isInvalid}
                                        placeholder="Default, Large, Bottle, Box of 12"
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
                                name={`variants[${index}].sku`}
                                children={(field) => {
                                  const isInvalid =
                                    field.state.meta.isTouched &&
                                    !field.state.meta.isValid;
                                  return (
                                    <Field data-invalid={isInvalid}>
                                      <FieldLabel
                                        htmlFor={`variant-sku-${index}`}
                                      >
                                        SKU
                                      </FieldLabel>
                                      <Input
                                        id={`variant-sku-${index}`}
                                        name={field.name}
                                        value={field.state.value}
                                        onBlur={field.handleBlur}
                                        onChange={(e) =>
                                          field.handleChange(e.target.value)
                                        }
                                        aria-invalid={isInvalid}
                                        placeholder="Optional unique SKU"
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
                                name={`variants[${index}].barcode`}
                                children={(field) => {
                                  const isInvalid =
                                    field.state.meta.isTouched &&
                                    !field.state.meta.isValid;
                                  return (
                                    <Field data-invalid={isInvalid}>
                                      <FieldLabel
                                        htmlFor={`variant-barcode-${index}`}
                                      >
                                        Barcode
                                      </FieldLabel>
                                      <Input
                                        id={`variant-barcode-${index}`}
                                        name={field.name}
                                        value={field.state.value}
                                        onBlur={field.handleBlur}
                                        onChange={(e) =>
                                          field.handleChange(e.target.value)
                                        }
                                        aria-invalid={isInvalid}
                                        placeholder="Optional unique barcode"
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
                                name={`variants[${index}].reorderPoint`}
                                children={(field) => {
                                  const isInvalid =
                                    field.state.meta.isTouched &&
                                    !field.state.meta.isValid;
                                  return (
                                    <Field data-invalid={isInvalid}>
                                      <FieldLabel
                                        htmlFor={`variant-reorder-${index}`}
                                      >
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
                                      <FieldLabel
                                        htmlFor={`variant-alert-${index}`}
                                      >
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
                              {values.hasMultipleUnits ? (
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
                                              setUnitsDialogIndex(index)
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
                                <form.Field
                                  name={`variants[${index}].units`}
                                  children={(field) => {
                                    const isInvalid =
                                      field.state.meta.isTouched &&
                                      !field.state.meta.isValid;
                                    const unitId = extractSingleUnitId(
                                      field.state.value
                                    );

                                    return (
                                      <Field data-invalid={isInvalid}>
                                        <FieldLabel
                                          htmlFor={`variant-unit-${index}`}
                                        >
                                          Unit
                                        </FieldLabel>
                                        <Select
                                          name={field.name}
                                          value={unitId}
                                          onValueChange={(value) =>
                                            field.handleChange(
                                              createSingleUnitArray(value ?? "")
                                            )
                                          }
                                        >
                                          <SelectTrigger
                                            id={`variant-unit-${index}`}
                                            className="w-full"
                                            aria-invalid={isInvalid}
                                          >
                                            <SelectValue placeholder="Select unit">
                                              {availableUnits.find(
                                                (u) => u.id === unitId
                                              )?.name ?? "Select unit"}
                                            </SelectValue>
                                          </SelectTrigger>
                                          <SelectContent>
                                            <SelectGroup>
                                              {(availableUnits ?? []).map(
                                                (unit) => (
                                                  <SelectItem
                                                    key={unit.id}
                                                    value={unit.id}
                                                  >
                                                    {unit.name}
                                                    {unit.symbol
                                                      ? ` (${unit.symbol})`
                                                      : ""}
                                                  </SelectItem>
                                                )
                                              )}
                                            </SelectGroup>
                                          </SelectContent>
                                        </Select>
                                        {isInvalid && (
                                          <FieldError
                                            errors={field.state.meta.errors}
                                          />
                                        )}
                                      </Field>
                                    );
                                  }}
                                />
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  />
                </>
              )}
            </div>
          </div>
        </div>
      </form>

      {activeDialogVariant && (
        <VariantUnitsDialog
          open={unitsDialogIndex !== null}
          onOpenChange={(open) => !open && setUnitsDialogIndex(null)}
          variantName={activeDialogVariant.name}
          units={availableUnits}
          value={activeDialogVariant.units}
          onSave={(value) => {
            if (unitsDialogIndex === null) {
              return;
            }
            form.setFieldValue(`variants[${unitsDialogIndex}].units`, value);
          }}
        />
      )}
    </div>
  );
}
