import { createFileRoute } from "@tanstack/react-router";
import { CategoryList } from "#/features/category";

export const Route = createFileRoute("/categories")({
  component: CategoriesPage,
});

function CategoriesPage() {
  return <CategoryList />;
}
