import { useMemo, useState } from "react";
import { useStore } from "@tanstack/react-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { ArrowLeftIcon } from "lucide-react";
import { toast } from "sonner";

import { Button } from "#/components/ui/button";
import { Switch } from "#/components/ui/switch";
import { categoryQueries } from "#/features/category";
import { unitQueries } from "#/features/unit";
import { useAppForm } from "#/hooks/form";
import { productApi } from "../api";
import { VariantUnitsDialog } from "./variant-units-dialog";
import { productQueries } from "../queries";
import { ProductFormSchema, type ProductFormValues } from "../schemas";
import {
  CreateProductInput,
  UpdateProductInput,
  UpdateProductVariantInput,
  type Product,
} from "../types";
import { ProductDetailsSection } from "./product-details-section";
import { SimpleVariantSection } from "./simple-variant-section";
import { AdvancedVariantsSection } from "./advanced-variants-section";

type FormVariantValue = ProductFormValues["variants"][number];

function createEmptyVariant(): FormVariantValue {
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

function normalizeToSingleUnit(
  units: ProductFormValues["variants"][number]["units"]
): typeof units {
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
    hasMultipleUnits:
      product?.variants?.some((v) => (v.units?.length ?? 0) > 1) ?? false,
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

  const form = useAppForm({
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

  const handleToggleVariants = (checked: boolean) => {
    form.setFieldValue("hasVariants", checked);
    if (checked) {
      const currentName = values.variants[0]?.name || values.name || "Default";
      form.setFieldValue("variants[0].name", currentName);
    } else {
      const currentVariants = values.variants;
      if (currentVariants.length > 1) {
        form.setFieldValue("variants", [currentVariants[0]]);
      }
      form.setFieldValue("variants[0].name", values.name);
    }
  };

  const handleToggleMultipleUnits = (checked: boolean) => {
    form.setFieldValue("hasMultipleUnits", checked);
    if (!checked) {
      values.variants.forEach((_, index) => {
        const currentUnits = values.variants[index].units;
        form.setFieldValue(
          `variants[${index}].units`,
          normalizeToSingleUnit(currentUnits)
        );
      });
    }
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

  if (isEditing && isLoading) {
    return (
      <div className="text-sm text-muted-foreground">Loading product...</div>
    );
  }

  const categoryOptions = (categoriesResult?.items ?? []).map((c) => ({
    value: c.id,
    label: c.name,
  }));

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
            <ProductDetailsSection
              form={form}
              categories={categoryOptions}
            />

            <form.Subscribe
              selector={(state) => state.values.hasVariants}
              children={(hasVariants) =>
                hasVariants ? (
                  <AdvancedVariantsSection
                    form={form}
                    availableUnits={availableUnits}
                    onOpenUnitsDialog={setUnitsDialogIndex}
                  />
                ) : (
                  <SimpleVariantSection
                    form={form}
                    availableUnits={availableUnits}
                    onOpenUnitsDialog={() => setUnitsDialogIndex(0)}
                  />
                )
              }
            />
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
            if (unitsDialogIndex === null) return;
            form.setFieldValue(`variants[${unitsDialogIndex}].units`, value);
          }}
        />
      )}
    </div>
  );
}
