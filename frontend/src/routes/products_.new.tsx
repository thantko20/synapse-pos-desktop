import { createFileRoute } from "@tanstack/react-router";
import { ProductForm } from "#/features/product";

export const Route = createFileRoute("/products_/new")({
  component: NewProductPage,
});

function NewProductPage() {
  return <ProductForm />;
}
