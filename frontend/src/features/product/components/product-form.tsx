import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { ArrowLeftIcon, PlusIcon, Trash2Icon } from "lucide-react";
import { toast } from "sonner";

import { Button } from "#/components/ui/button";
import { Input } from "#/components/ui/input";
import { Label } from "#/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "#/components/ui/select";
import { Textarea } from "#/components/ui/textarea";
import { categoryQueries } from "#/features/category";
import { productApi } from "../api";
import { productQueries } from "../queries";
import type {
  CreateProductInput,
  CreateProductVariantInput,
  Product,
  UpdateProductInput,
  UpdateProductVariantInput,
} from "../types";

type VariantDraft = {
  id?: string;
  name: string;
  sku: string;
  barcode: string;
  unitName: string;
  reorderPoint: number;
  alertThreshold: number;
};

type ProductDraft = {
  name: string;
  description: string;
  categoryId: string;
  brand: string;
  notes: string;
  variants: VariantDraft[];
};

function createEmptyVariant(): VariantDraft {
  return {
    name: "",
    sku: "",
    barcode: "",
    unitName: "",
    reorderPoint: 0,
    alertThreshold: 0,
  };
}

function createEmptyDraft(): ProductDraft {
  return {
    name: "",
    description: "",
    categoryId: "",
    brand: "",
    notes: "",
    variants: [createEmptyVariant()],
  };
}

function mapProductToDraft(product: Product): ProductDraft {
  return {
    name: product.name,
    description: product.description,
    categoryId: product.categoryId,
    brand: product.brand,
    notes: product.notes,
    variants: product.variants?.length
      ? product.variants.map((variant) => ({
          id: variant.id,
          name: variant.name,
          sku: variant.sku,
          barcode: variant.barcode,
          unitName: variant.unitName,
          reorderPoint: variant.reorderPoint,
          alertThreshold: variant.alertThreshold,
        }))
      : [createEmptyVariant()],
  };
}

function toCreatePayload(draft: ProductDraft): CreateProductInput {
  return {
    name: draft.name,
    description: draft.description,
    categoryId: draft.categoryId,
    brand: draft.brand,
    notes: draft.notes,
    variants: draft.variants.map<CreateProductVariantInput>((variant) => ({
      name: variant.name,
      sku: variant.sku,
      barcode: variant.barcode,
      unitName: variant.unitName,
      reorderPoint: variant.reorderPoint,
      alertThreshold: variant.alertThreshold,
    })),
  };
}

function toUpdatePayload(
  productId: string,
  draft: ProductDraft
): UpdateProductInput {
  return {
    id: productId,
    name: draft.name,
    description: draft.description,
    categoryId: draft.categoryId,
    brand: draft.brand,
    notes: draft.notes,
    variants: draft.variants.map<UpdateProductVariantInput>((variant) => ({
      id: variant.id ?? "",
      name: variant.name,
      sku: variant.sku,
      barcode: variant.barcode,
      unitName: variant.unitName,
      reorderPoint: variant.reorderPoint,
      alertThreshold: variant.alertThreshold,
    })),
  };
}

interface ProductFormProps {
  productId?: string;
}

export function ProductForm({ productId }: ProductFormProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEditing = !!productId;
  const [draft, setDraft] = useState<ProductDraft>(createEmptyDraft);

  const { data: categoriesResult } = useQuery(
    categoryQueries.all({ pageSize: 100, includeArchived: false })
  );
  const { data: product, isLoading } = useQuery({
    ...productQueries.detail(productId ?? ""),
    enabled: isEditing,
  });

  useEffect(() => {
    if (product) {
      setDraft(mapProductToDraft(product));
    }
  }, [product]);

  const createMutation = useMutation({
    mutationFn: productApi.createProduct,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success("Product created");
      navigate({ to: "/products" });
    },
    onError: (error) => {
      console.log(error);
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

  function updateVariant(index: number, patch: Partial<VariantDraft>) {
    setDraft((current) => ({
      ...current,
      variants: current.variants.map((variant, variantIndex) =>
        variantIndex === index ? { ...variant, ...patch } : variant
      ),
    }));
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    if (isEditing && productId) {
      updateMutation.mutate(toUpdatePayload(productId, draft));
      return;
    }

    createMutation.mutate(toCreatePayload(draft));
  }

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
              Keep product details tidy up top and manage variants below.
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

      <form
        id="product-form"
        onSubmit={handleSubmit}
        className="flex flex-col gap-6"
      >
        <section className="rounded-2xl border bg-card p-6 shadow-sm">
          <div className="mb-6 flex flex-col gap-1">
            <h2 className="font-heading text-lg font-semibold">
              Product Details
            </h2>
            <p className="text-sm text-muted-foreground">
              Capture the core identity of the product before defining sellable
              variants.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex flex-col gap-2 md:col-span-2">
              <Label htmlFor="product-name">Name</Label>
              <Input
                id="product-name"
                value={draft.name}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    name: event.target.value,
                  }))
                }
                placeholder="Cold brew concentrate"
                required
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="product-category">Category</Label>
              <Select
                value={draft.categoryId}
                onValueChange={(value) =>
                  setDraft((current) => ({
                    ...current,
                    categoryId: value,
                  }))
                }
              >
                <SelectTrigger id="product-category" className="w-full">
                  <SelectValue placeholder="Uncategorized" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="">Uncategorized</SelectItem>
                    {(categoriesResult?.items ?? []).map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="product-brand">Brand</Label>
              <Input
                id="product-brand"
                value={draft.brand}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    brand: event.target.value,
                  }))
                }
                placeholder="Optional brand"
              />
            </div>

            <div className="flex flex-col gap-2 md:col-span-2">
              <Label htmlFor="product-description">Description</Label>
              <Textarea
                id="product-description"
                value={draft.description}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    description: event.target.value,
                  }))
                }
                placeholder="Customer-facing description"
                className="min-h-28"
              />
            </div>

            <div className="flex flex-col gap-2 md:col-span-2">
              <Label htmlFor="product-notes">Notes</Label>
              <Textarea
                id="product-notes"
                value={draft.notes}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    notes: event.target.value,
                  }))
                }
                placeholder="Internal notes for staff"
                className="min-h-28"
              />
            </div>
          </div>
        </section>

        <section className="rounded-2xl border bg-card p-6 shadow-sm">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-1">
              <h2 className="font-heading text-lg font-semibold">Variants</h2>
              <p className="text-sm text-muted-foreground">
                Every product needs at least one sellable variant. Use cards to
                keep complex entries readable.
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                setDraft((current) => ({
                  ...current,
                  variants: [...current.variants, createEmptyVariant()],
                }))
              }
            >
              <PlusIcon data-icon="inline-start" />
              Add Variant
            </Button>
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            {draft.variants.map((variant, index) => (
              <div
                key={variant.id ?? `new-${index}`}
                className="rounded-xl border bg-background p-4"
              >
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <h3 className="font-medium">Variant {index + 1}</h3>
                    <p className="text-xs text-muted-foreground">
                      Identifiers and thresholds for one sellable option.
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    onClick={() =>
                      setDraft((current) => ({
                        ...current,
                        variants:
                          current.variants.length === 1
                            ? current.variants
                            : current.variants.filter(
                                (_, currentIndex) => currentIndex !== index
                              ),
                      }))
                    }
                    disabled={draft.variants.length === 1}
                  >
                    <Trash2Icon />
                    <span className="sr-only">Remove variant</span>
                  </Button>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="flex flex-col gap-2 md:col-span-2">
                    <Label htmlFor={`variant-name-${index}`}>
                      Variant Name
                    </Label>
                    <Input
                      id={`variant-name-${index}`}
                      value={variant.name}
                      onChange={(event) =>
                        updateVariant(index, { name: event.target.value })
                      }
                      placeholder="Default, Large, Bottle, Box of 12"
                      required
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <Label htmlFor={`variant-sku-${index}`}>SKU</Label>
                    <Input
                      id={`variant-sku-${index}`}
                      value={variant.sku}
                      onChange={(event) =>
                        updateVariant(index, { sku: event.target.value })
                      }
                      placeholder="Optional unique SKU"
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <Label htmlFor={`variant-barcode-${index}`}>Barcode</Label>
                    <Input
                      id={`variant-barcode-${index}`}
                      value={variant.barcode}
                      onChange={(event) =>
                        updateVariant(index, { barcode: event.target.value })
                      }
                      placeholder="Optional unique barcode"
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <Label htmlFor={`variant-unit-${index}`}>Unit Name</Label>
                    <Input
                      id={`variant-unit-${index}`}
                      value={variant.unitName}
                      onChange={(event) =>
                        updateVariant(index, { unitName: event.target.value })
                      }
                      placeholder="piece, box, bottle"
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <Label htmlFor={`variant-reorder-${index}`}>
                      Reorder Point
                    </Label>
                    <Input
                      id={`variant-reorder-${index}`}
                      type="number"
                      min={0}
                      value={variant.reorderPoint || ""}
                      onChange={(event) =>
                        updateVariant(index, {
                          reorderPoint: Number(event.target.value || 0),
                        })
                      }
                      placeholder="Optional"
                    />
                  </div>

                  <div className="flex flex-col gap-2 md:col-span-2">
                    <Label htmlFor={`variant-alert-${index}`}>
                      Alert Threshold
                    </Label>
                    <Input
                      id={`variant-alert-${index}`}
                      type="number"
                      min={0}
                      value={variant.alertThreshold || ""}
                      onChange={(event) =>
                        updateVariant(index, {
                          alertThreshold: Number(event.target.value || 0),
                        })
                      }
                      placeholder="Optional"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </form>
    </div>
  );
}
