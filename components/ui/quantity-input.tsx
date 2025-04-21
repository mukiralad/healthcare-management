import { Input } from "./input"
import { cn } from "@/lib/utils"
import { forwardRef } from "react"

interface QuantityInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  onChange?: (value: number | '') => void
}

const QuantityInput = forwardRef<HTMLInputElement, QuantityInputProps>(
  ({ className, onChange, ...props }, ref) => {
    return (
      <Input
        type="text"
        pattern="[0-9]*"
        inputMode="numeric"
        ref={ref}
        className={cn("appearance-none", className)}
        onChange={(e) => {
          const value = e.target.value
          if (value === '') {
            onChange?.(value)
          } else {
            const num = parseInt(value, 10)
            if (!isNaN(num)) {
              onChange?.(num)
            }
          }
        }}
        {...props}
      />
    )
  }
)
QuantityInput.displayName = "QuantityInput"

export { QuantityInput }
