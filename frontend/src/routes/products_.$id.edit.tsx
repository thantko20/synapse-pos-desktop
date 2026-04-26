import { createFileRoute } from "@tanstack/react-router";
import { ProductForm } from "#/features/product";

export const Route = createFileRoute("/products_/$id/edit")({
  component: EditProductPage,
});

function EditProductPage() {
  const { id } = Route.useParams();
  // Key forces remount when productId changes, ensuring form gets fresh defaultValues
  return <ProductForm key={id} productId={id} />;
}
