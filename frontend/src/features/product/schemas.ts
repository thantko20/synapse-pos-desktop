import * as v from "valibot"

export const ProductVariantUnitFormSchema = v.object({
  unitId: v.pipe(v.string(), v.minLength(1, "Unit is required.")),
  parentUnitId: v.string(),
  factorToParent: v.pipe(
    v.number(),
    v.minValue(1, "Factor must be greater than zero.")
  ),
  isDefault: v.boolean(),
})

export const ProductVariantFormSchema = v.object({
  id: v.string(),
  name: v.pipe(v.string(), v.minLength(1, "Variant name is required.")),
  sku: v.string(),
  barcode: v.string(),
  units: v.pipe(
    v.array(ProductVariantUnitFormSchema),
    v.minLength(1, "At least one unit is required.")
  ),
  reorderPoint: v.number(),
  alertThreshold: v.number(),
})

export const ProductFormSchema = v.object({
  name: v.pipe(v.string(), v.minLength(1, "Product name is required.")),
  description: v.string(),
  categoryId: v.string(),
  brand: v.string(),
  notes: v.string(),
  variants: v.pipe(
    v.array(ProductVariantFormSchema),
    v.minLength(1, "At least one variant is required.")
  ),
})

export type ProductFormValues = v.InferInput<typeof ProductFormSchema>
