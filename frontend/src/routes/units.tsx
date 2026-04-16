import { createFileRoute } from "@tanstack/react-router"
import { UnitList } from "#/features/unit"

export const Route = createFileRoute("/units")({
  component: UnitsPage,
})

function UnitsPage() {
  return <UnitList />
}
