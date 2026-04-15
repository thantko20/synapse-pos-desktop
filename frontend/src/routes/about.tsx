import { Button } from "#/components/ui/button";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/about")({
  component: About,
});

function About() {
  return <Button>This is a button in the About page</Button>;
}
