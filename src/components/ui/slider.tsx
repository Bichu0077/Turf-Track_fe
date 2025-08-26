import * as React from "react"
import * as SliderPrimitive from "@radix-ui/react-slider"

import { cn } from "@/lib/utils"

const Slider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root>
>(({ className, ...props }, ref) => (
  <SliderPrimitive.Root
    ref={ref}
    className={cn(
      "relative flex w-full touch-none select-none items-center",
      className
    )}
    {...props}
  >
    <SliderPrimitive.Track className="relative h-1 w-full grow overflow-hidden rounded-full bg-muted">
      <SliderPrimitive.Range className="absolute h-2 top-[-4px] rounded-full" style={{ background: 'var(--gradient-hero)' }} />
    </SliderPrimitive.Track>
    {/* Custom thumb: dual circle, teal ring, glow, hover enlarge */}
    {Array.isArray(props.value) && props.value.length === 2
      ? [0, 1].map(i => (
          <SliderPrimitive.Thumb
            key={i}
            className={
              "group block h-5 w-5 rounded-full border-4 border-[#008296] bg-white shadow-[0_0_0_2px_rgba(0,130,150,0.15)] transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#008296] focus-visible:ring-offset-2 hover:scale-110" +
              " flex items-center justify-center"
            }
            style={{ boxShadow: '0 2px 8px 0 rgba(0,130,150,0.10)' }}
          >
            <span className="block h-2.5 w-2.5 rounded-full bg-white" />
          </SliderPrimitive.Thumb>
        ))
      : (
        <SliderPrimitive.Thumb
          className={
            "group block h-5 w-5 rounded-full border-4 border-[#008296] bg-white shadow-[0_0_0_2px_rgba(0,130,150,0.15)] transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#008296] focus-visible:ring-offset-2 hover:scale-110" +
            " flex items-center justify-center"
          }
          style={{ boxShadow: '0 2px 8px 0 rgba(0,130,150,0.10)' }}
        >
          <span className="block h-2.5 w-2.5 rounded-full bg-white" />
        </SliderPrimitive.Thumb>
      )}
  </SliderPrimitive.Root>
))
Slider.displayName = SliderPrimitive.Root.displayName

export { Slider }
