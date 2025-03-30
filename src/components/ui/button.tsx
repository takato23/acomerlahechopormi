import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
// Eliminar importación de cva, VariantProps se importa desde el nuevo archivo
import { cn } from "@/lib/utils"
import { buttonVariants, type ButtonVariantProps } from "./button-variants" // Importar desde el nuevo archivo
// Eliminar la definición de buttonVariants (movida a button-variants.ts)

// Envolver con React.forwardRef
const Button = React.forwardRef<
  HTMLButtonElement, // Tipo del elemento DOM
  React.ComponentProps<"button"> & // Props del botón HTML
    ButtonVariantProps & { // Usar el tipo importado
      asChild?: boolean; // Prop asChild
    }
>(({ className, variant, size, asChild = false, ...props }, ref) => { // Añadir ref como segundo argumento
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      data-slot="button"
      ref={ref} // Pasar la ref al componente subyacente
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
});
Button.displayName = "Button"; // Añadir displayName

export { Button } // Exportar solo el componente Button
// Exportar buttonVariants y ButtonVariantProps desde button-variants.ts
