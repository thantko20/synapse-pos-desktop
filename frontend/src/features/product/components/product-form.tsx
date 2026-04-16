import { useEffect } from "react";
import { useForm } from "@tanstack/react-form";
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
import { Textarea } from "#/components/ui/textarea";
import { categoryQueries } from "#/features/category";
import { productApi } from "../api";
import { productQueries } from "../queries";
import { ProductFormSchema } from "../schemas";
import {
  CreateProductInput,
  UpdateProductInput,
  type CreateProductVariantInput,
  type Product,
  type UpdateProductVariantInput,
} from "../types";

function createEmptyVariant() {
  return {
    id: "",
    name: "",
    sku: "",
    barcode: "",
    unitName: "",
    reorderPoint: 0,
    alertThreshold: 0,
  };
}

function createDefaults(product?: Product) {
  return {
    name: product?.name ?? "",
    description: product?.description ?? "",
    categoryId: product?.categoryId ?? "",
    brand: product?.brand ?? "",
    notes: product?.notes ?? "",
    variants: product?.variants?.length
      ? product.variants.map((v) => ({
          id: v.id,
          name: v.name,
          sku: v.sku,
          barcode: v.barcode,
          unitName: v.unitName,
          reorderPoint: v.reorderPoint,
          alertThreshold: v.alertThreshold,
        }))
      : [createEmptyVariant()],
  };
}

interface ProductFormProps {
  productId?: string;
}

export function ProductForm({ productId }: ProductFormProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEditing = !!productId;

  const { data: categoriesResult } = useQuery(
    categoryQueries.all({ pageSize: 100, includeArchived: false })
  );
  const { data: product, isLoading } = useQuery({
    ...productQueries.detail(productId ?? ""),
    enabled: isEditing,
  });

  const form = useForm({
    defaultValues: createDefaults(),
    validators: {
      onSubmit: ProductFormSchema,
    },
    onSubmit: ({ value }) => {
      if (isEditing && productId) {
        updateMutation.mutate(
          new UpdateProductInput({
            id: productId,
            name: value.name,
            description: value.description,
            categoryId: value.categoryId,
            brand: value.brand,
            notes: value.notes,
            variants: value.variants.map<UpdateProductVariantInput>((v) => ({
              id: v.id,
              name: v.name,
              sku: v.sku,
              barcode: v.barcode,
              unitName: v.unitName,
              reorderPoint: v.reorderPoint,
              alertThreshold: v.alertThreshold,
            })),
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
          variants: value.variants.map<CreateProductVariantInput>((v) => ({
            name: v.name,
            sku: v.sku,
            barcode: v.barcode,
            unitName: v.unitName,
            reorderPoint: v.reorderPoint,
            alertThreshold: v.alertThreshold,
          })),
        })
      );
    },
  });

  useEffect(() => {
    if (product) {
      form.reset(createDefaults(product));
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
        onSubmit={(e) => {
          e.preventDefault();
          form.handleSubmit();
        }}
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

          <FieldGroup>
            <form.Field
              name="name"
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
                    <FieldLabel htmlFor="product-category">Category</FieldLabel>
                    <Select
                      name={field.name}
                      value={field.state.value}
                      onValueChange={(value) => field.handleChange(value ?? "")}
                    >
                      <SelectTrigger
                        id="product-category"
                        className="w-full"
                        aria-invalid={isInvalid}
                      >
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
                      className="min-h-28"
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
                      className="min-h-28"
                    />
                    {isInvalid && (
                      <FieldError errors={field.state.meta.errors} />
                    )}
                  </Field>
                );
              }}
            />
          </FieldGroup>
        </section>

        <section className="rounded-2xl border bg-card p-6 shadow-sm">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
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
              <div className="grid gap-4 xl:grid-cols-2">
                {variantsField.state.value.map((_, index) => (
                  <div
                    key={index}
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
                        onClick={() => variantsField.removeValue(index)}
                        disabled={variantsField.state.value.length === 1}
                      >
                        <Trash2Icon />
                        <span className="sr-only">Remove variant</span>
                      </Button>
                    </div>

                    <FieldGroup>
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
                              <FieldLabel htmlFor={`variant-name-${index}`}>
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
                                <FieldError errors={field.state.meta.errors} />
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
                              <FieldLabel htmlFor={`variant-sku-${index}`}>
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
                                <FieldError errors={field.state.meta.errors} />
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
                              <FieldLabel htmlFor={`variant-barcode-${index}`}>
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
                                <FieldError errors={field.state.meta.errors} />
                              )}
                            </Field>
                          );
                        }}
                      />
                      <form.Field
                        name={`variants[${index}].unitName`}
                        children={(field) => {
                          const isInvalid =
                            field.state.meta.isTouched &&
                            !field.state.meta.isValid;
                          return (
                            <Field data-invalid={isInvalid}>
                              <FieldLabel htmlFor={`variant-unit-${index}`}>
                                Unit Name
                              </FieldLabel>
                              <Input
                                id={`variant-unit-${index}`}
                                name={field.name}
                                value={field.state.value}
                                onBlur={field.handleBlur}
                                onChange={(e) =>
                                  field.handleChange(e.target.value)
                                }
                                aria-invalid={isInvalid}
                                placeholder="piece, box, bottle"
                              />
                              {isInvalid && (
                                <FieldError errors={field.state.meta.errors} />
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
                                <FieldError errors={field.state.meta.errors} />
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
                            <Field
                              data-invalid={isInvalid}
                              className="md:col-span-2"
                            >
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
                                <FieldError errors={field.state.meta.errors} />
                              )}
                            </Field>
                          );
                        }}
                      />
                    </FieldGroup>
                  </div>
                ))}
              </div>
            )}
          />
        </section>
      </form>
    </div>
  );
}
