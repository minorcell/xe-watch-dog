import * as React from "react";

import { cn } from "@/lib/utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "flex h-8 w-full min-w-0 rounded-md border bg-transparent px-2.5 py-1 text-xs outline-none transition-colors placeholder:text-muted-foreground/60 focus-visible:border-foreground/15 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-40",
        className,
      )}
      {...props}
    />
  );
}

export { Input };
