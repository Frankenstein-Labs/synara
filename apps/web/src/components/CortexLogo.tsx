// FILE: CortexLogo.tsx
// Purpose: Render the official Cortex Studio logo asset.
// Layer: Shared app branding primitive

import type { SVGProps } from "react";
import { cn } from "~/lib/utils";

export function CortexLogo({ className, ...props }: SVGProps<SVGSVGElement>) {
  const ariaLabel = props["aria-label"];

  return (
    <img
      src="/cortex-studio-logo.png"
      alt={typeof ariaLabel === "string" ? ariaLabel : ""}
      aria-hidden={ariaLabel ? undefined : true}
      className={cn("shrink-0 object-contain", className)}
    />
  );
}
