import * as React from "react";
import * as SwitchPrimitives from "@radix-ui/react-switch";
import { Heart } from "lucide-react";

import { cn } from "@/lib/utils";

const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root>
>(({ className, ...props }, ref) => (
  <SwitchPrimitives.Root
    className={cn(
      "group peer inline-flex h-8 w-14 shrink-0 cursor-pointer items-center rounded-full border-2 p-0.5 transition-colors duration-300 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/40 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:border-primary-deep data-[state=checked]:bg-primary data-[state=unchecked]:border-border-strong data-[state=unchecked]:bg-muted",
      className,
    )}
    {...props}
    ref={ref}
  >
    <SwitchPrimitives.Thumb
      className={cn(
        "pointer-events-none flex h-6 w-6 items-center justify-center rounded-full bg-card shadow-squish-sm ring-0 transition-transform duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] data-[state=checked]:translate-x-6 data-[state=unchecked]:translate-x-0",
      )}
    >
      <Heart className="h-3.5 w-3.5 fill-ribbon text-ribbon opacity-0 transition-all duration-300 group-data-[state=checked]:scale-100 group-data-[state=checked]:opacity-100 group-data-[state=unchecked]:scale-50" />
    </SwitchPrimitives.Thumb>
  </SwitchPrimitives.Root>
));
Switch.displayName = SwitchPrimitives.Root.displayName;

export { Switch };
