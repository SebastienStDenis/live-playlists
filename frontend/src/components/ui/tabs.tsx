"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { animate, motion, useDragControls, useMotionValue } from "motion/react"
import { Tabs as TabsPrimitive } from "radix-ui"

import { cn } from "@/lib/utils"

const INDICATOR_SPRING = { type: "spring", stiffness: 500, damping: 40 } as const

function Tabs({
  className,
  orientation = "horizontal",
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Root>) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      data-orientation={orientation}
      className={cn(
        "group/tabs flex gap-2 data-horizontal:flex-col",
        className
      )}
      {...props}
    />
  )
}

const tabsListVariants = cva(
  "group/tabs-list relative inline-flex w-fit items-center justify-center rounded-lg p-[3px] text-muted-foreground group-data-horizontal/tabs:h-8 group-data-vertical/tabs:h-fit group-data-vertical/tabs:flex-col data-[variant=line]:rounded-none",
  {
    variants: {
      variant: {
        default: "bg-muted dark:bg-black/25",
        line: "gap-1 bg-transparent",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function TabsList({
  className,
  variant = "default",
  children,
  onPointerDown,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.List> &
  VariantProps<typeof tabsListVariants>) {
  const listRef = React.useRef<HTMLDivElement>(null)
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const width = useMotionValue(0)
  const height = useMotionValue(0)
  const opacity = useMotionValue(0)
  const dragControls = useDragControls()
  const [draggable, setDraggable] = React.useState(false)

  const positionIndicator = React.useCallback(
    (animated: boolean) => {
      const list = listRef.current
      if (!list) return
      const active = list.querySelector<HTMLElement>(
        '[data-slot="tabs-trigger"][data-state="active"]'
      )
      if (!active) {
        opacity.set(0)
        return
      }
      const target = {
        x: active.offsetLeft,
        y: active.offsetTop,
        width: active.offsetWidth,
        height: active.offsetHeight,
      }
      if (
        !animated ||
        window.matchMedia("(prefers-reduced-motion: reduce)").matches
      ) {
        x.set(target.x)
        y.set(target.y)
        width.set(target.width)
        height.set(target.height)
      } else {
        animate(x, target.x, INDICATOR_SPRING)
        animate(y, target.y, INDICATOR_SPRING)
        animate(width, target.width, INDICATOR_SPRING)
        animate(height, target.height, INDICATOR_SPRING)
      }
      opacity.set(1)
    },
    [x, y, width, height, opacity]
  )

  React.useEffect(() => {
    const list = listRef.current
    if (!list) return
    // Take over from the server-rendered per-trigger pill (see TabsTrigger's
    // group-data-[indicator] overrides) without animating the first placement.
    positionIndicator(false)
    list.setAttribute("data-indicator", "")
    setDraggable(list.getAttribute("aria-orientation") !== "vertical")
    const mutations = new MutationObserver(() => positionIndicator(true))
    mutations.observe(list, { attributeFilter: ["data-state"], subtree: true })
    const resizes = new ResizeObserver(() => positionIndicator(false))
    resizes.observe(list)
    return () => {
      mutations.disconnect()
      resizes.disconnect()
    }
  }, [positionIndicator])

  // Released after a drag: activate the trigger nearest the lens, or spring
  // back onto the active one. Row distance dominates so a wrapped list snaps
  // within the lens's row before considering the others.
  const settleDrag = () => {
    const list = listRef.current
    if (!list) return
    const triggers = Array.from(
      list.querySelectorAll<HTMLElement>('[data-slot="tabs-trigger"]')
    )
    const centerX = x.get() + width.get() / 2
    const centerY = y.get() + height.get() / 2
    let nearest: HTMLElement | undefined
    let best = Infinity
    for (const trigger of triggers) {
      const dx = Math.abs(trigger.offsetLeft + trigger.offsetWidth / 2 - centerX)
      const dy = Math.abs(trigger.offsetTop + trigger.offsetHeight / 2 - centerY)
      const distance = dx + dy * 10
      if (distance < best) {
        best = distance
        nearest = trigger
      }
    }
    if (!nearest || nearest.dataset.state === "active") {
      positionIndicator(true)
    } else {
      // Radix activates triggers on mousedown (or focus, in automatic
      // mode), not on a synthetic click alone.
      nearest.dispatchEvent(
        new MouseEvent("mousedown", { bubbles: true, cancelable: true })
      )
      nearest.focus({ preventScroll: true })
      nearest.click()
    }
  }

  return (
    <TabsPrimitive.List
      ref={listRef}
      data-slot="tabs-list"
      data-variant={variant}
      className={cn(tabsListVariants({ variant }), className)}
      // The active label paints above the lens (see TabsTrigger's z
      // overrides), so pointer-downs land on the trigger, never the lens
      // itself; the drag gesture is picked up here and handed to the lens
      // through motion's drag controls instead.
      onPointerDown={(event) => {
        onPointerDown?.(event)
        if (event.defaultPrevented || !draggable) return
        const trigger = (event.target as HTMLElement).closest<HTMLElement>(
          '[data-slot="tabs-trigger"]'
        )
        if (trigger?.dataset.state === "active") {
          dragControls.start(event)
        }
      }}
      {...props}
    >
      {variant === "default" && (
        <motion.span
          aria-hidden="true"
          drag={draggable ? "x" : false}
          dragControls={dragControls}
          dragListener={false}
          dragConstraints={listRef}
          dragElastic={0.08}
          dragMomentum={false}
          onDragEnd={settleDrag}
          style={{ x, y, width, height, opacity }}
          className="absolute top-0 left-0 rounded-md bg-primary shadow-sm glass:z-10 glass:bg-(--glass-lens) glass:bg-(image:--glass-sheen) glass:shadow-md glass:backdrop-blur-[6px] glass:backdrop-saturate-150 glass:inset-shadow-[0_1px_0_var(--glass-edge)]"
        />
      )}
      {children}
    </TabsPrimitive.List>
  )
}

function TabsTrigger({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      className={cn(
        "relative inline-flex h-[calc(100%-1px)] flex-1 items-center justify-center gap-1.5 rounded-md border border-transparent px-1.5 py-0.5 text-sm font-medium whitespace-nowrap text-foreground/60 transition-all group-data-vertical/tabs:w-full group-data-vertical/tabs:justify-start hover:text-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-1 focus-visible:outline-ring disabled:pointer-events-none disabled:opacity-50 has-data-[icon=inline-end]:pr-1 has-data-[icon=inline-start]:pl-1 dark:text-muted-foreground dark:hover:text-foreground group-data-[variant=default]/tabs-list:data-active:shadow-sm group-data-[variant=line]/tabs-list:data-active:shadow-none [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        "group-data-[variant=line]/tabs-list:bg-transparent group-data-[variant=line]/tabs-list:data-active:bg-transparent dark:group-data-[variant=line]/tabs-list:data-active:border-transparent dark:group-data-[variant=line]/tabs-list:data-active:bg-transparent",
        "data-active:bg-primary data-active:text-primary-foreground data-active:hover:text-primary-foreground dark:data-active:border-transparent dark:data-active:bg-primary dark:data-active:text-primary-foreground dark:data-active:hover:text-primary-foreground",
        // Under glass the sliding pill is a translucent lens floating above
        // the labels; the active label rises above it and keeps the plain
        // foreground color, since primary-foreground assumes the solid pill.
        "glass:group-data-[indicator]/tabs-list:data-active:z-20 glass:group-data-[indicator]/tabs-list:data-active:text-foreground! glass:group-data-[indicator]/tabs-list:data-active:hover:text-foreground! glass:group-data-[indicator]/tabs-list:data-active:cursor-grab",
        "group-data-[indicator]/tabs-list:data-active:bg-transparent group-data-[variant=default]/tabs-list:group-data-[indicator]/tabs-list:data-active:shadow-none dark:group-data-[indicator]/tabs-list:data-active:border-transparent dark:group-data-[indicator]/tabs-list:data-active:bg-transparent",
        "after:absolute after:bg-foreground after:opacity-0 after:transition-opacity group-data-horizontal/tabs:after:inset-x-0 group-data-horizontal/tabs:after:bottom-[-5px] group-data-horizontal/tabs:after:h-0.5 group-data-vertical/tabs:after:inset-y-0 group-data-vertical/tabs:after:-right-1 group-data-vertical/tabs:after:w-0.5 group-data-[variant=line]/tabs-list:data-active:after:opacity-100",
        className
      )}
      {...props}
    />
  )
}

function TabsContent({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content
      data-slot="tabs-content"
      className={cn("flex-1 text-sm outline-none", className)}
      {...props}
    />
  )
}

export { Tabs, TabsList, TabsTrigger, TabsContent, tabsListVariants }
