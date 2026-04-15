import { createFileRoute } from "@tanstack/react-router"
import { ProductForm } from "#/features/product"

export const Route = createFileRoute("/products_/$id/edit")({
  component: EditProductPage,
})

function EditProductPage() {
  const { id } = Route.useParams()
  return <ProductForm productId={id} />
}
