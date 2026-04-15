import { createFileRoute } from "@tanstack/react-router"
import { ProductList } from "#/features/product"

export const Route = createFileRoute("/products")({
  component: ProductsPage,
})

function ProductsPage() {
  return <ProductList />
}
