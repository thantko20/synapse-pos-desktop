import { createFileRoute } from "@tanstack/react-router";
import { InventoryList } from "#/features/inventory";

export const Route = createFileRoute("/inventory")({
  component: InventoryPage,
});

function InventoryPage() {
  return <InventoryList />;
}
