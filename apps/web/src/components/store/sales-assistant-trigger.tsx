import Link from "next/link";

export function SalesAssistantTrigger({
  variant = "dark",
}: {
  variant?: "dark" | "light";
}) {
  return (
    <Link className={`button button--${variant}`} href="/contact">
      Talk to a specialist
    </Link>
  );
}
