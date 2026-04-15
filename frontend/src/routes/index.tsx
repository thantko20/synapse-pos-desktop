import { Button } from "#/components/ui/button";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({ component: App });

function App() {
  return <Button>This is a shadcn ui button</Button>;
}
