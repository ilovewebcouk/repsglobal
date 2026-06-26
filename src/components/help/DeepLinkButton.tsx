import { Link } from "@tanstack/react-router";
import { ArrowRight, ExternalLink } from "lucide-react";

export function DeepLinkButton({
  to,
  label,
  external = false,
}: {
  to: string;
  label: string;
  external?: boolean;
}) {
  const Icon = external ? ExternalLink : ArrowRight;
  return (
    <Link
      to={to}
      className="my-6 inline-flex items-center gap-2 rounded-[10px] bg-reps-orange px-4 py-2.5 text-[14px] font-semibold !text-white !no-underline transition-colors hover:bg-reps-orange-hover hover:!text-white"
    >
      {label}
      <Icon className="size-4" aria-hidden />
    </Link>
  );
}
