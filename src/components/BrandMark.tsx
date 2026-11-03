import { cn } from "@/lib/utils";

export function BrandMark({ className }: { className?: string }) {
  return (
    <span className={cn("brand-symbol", className)} aria-hidden="true">
      <svg viewBox="0 0 32 32" role="presentation">
        <circle className="brand-ring" cx="16" cy="16" r="10.5" />
        <path className="brand-slash" d="M9.5 21V11L16 17L22.5 11V21" />
      </svg>
    </span>
  );
}
