import * as React from "react"
import * as TabsPrimitive from "@radix-ui/react-tabs"
import { motion } from "framer-motion"

import { cn } from "@/lib/utils"

const Tabs = TabsPrimitive.Root

const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(
      "inline-flex h-9 items-center justify-center rounded-lg bg-muted p-1 text-muted-foreground",
      className
    )}
    {...props}
  />
))
TabsList.displayName = TabsPrimitive.List.displayName

// Ya no envolvemos con motion aquí
// const MotionTabsTrigger = motion(TabsPrimitive.Trigger);

const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger> & { onAnimationStart?: React.AnimationEventHandler<HTMLButtonElement> }
>(({ className, children, onDrag, onDragStart, onDragEnd, onAnimationStart, ...props }, ref) => {
  const [isActive, setIsActive] = React.useState(false);

  // Definir variantes completas para Framer Motion
  const triggerVariants = {
    inactive: {
      color: 'rgb(100, 116, 139)',        // slate-500 (muted-foreground)
      backgroundColor: 'rgba(0, 0, 0, 0)', // transparente
      boxShadow: 'none'
    },
    active: {
      color: 'rgb(15, 23, 42)',          // slate-900 (foreground)
      backgroundColor: 'rgb(255, 255, 255)', // blanco (background)
      boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)' // sombra activa
    }
  };

  const transition = { duration: 0.2, ease: "easeInOut" };

  // Hook para manejar el estado activo basado en el atributo data-state
  React.useEffect(() => {
    let observer: MutationObserver | null = null;
    const checkState = (element: HTMLElement) => {
      setIsActive(element.getAttribute('data-state') === 'active');
    };

    if (ref && typeof ref !== 'function' && ref.current) {
      const element = ref.current;
      checkState(element);

      observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.attributeName === 'data-state') {
            checkState(element);
          }
        });
      });
      observer.observe(element, { attributes: true });
    }
    return () => observer?.disconnect();
  }, [ref]);

  // Convertir TabsPrimitive.Trigger en un componente motion
  const MotionTabsTrigger = motion(TabsPrimitive.Trigger);

  return (
    <MotionTabsTrigger
      initial="inactive"
      variants={triggerVariants}
      animate={isActive ? "active" : "inactive"}
      transition={transition}
      whileTap={{ scale: 0.97 }}
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
        className
      )}
      ref={ref}
      {...props}
    >
      {children}
    </MotionTabsTrigger>
  );
});
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName

const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      "mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
      className
    )}
    {...props}
  />
))
TabsContent.displayName = TabsPrimitive.Content.displayName

export { Tabs, TabsList, TabsTrigger, TabsContent }
