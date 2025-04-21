"use client"

import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { createClient } from "@/lib/supabase/client"

type Medicine = {
  id: string
  medicine_name: string
  unit: string
}

interface MedicineAutocompleteProps {
  onSelect: (medicine: Medicine) => void
}

export function MedicineAutocomplete({ onSelect }: MedicineAutocompleteProps) {
  const [open, setOpen] = React.useState(false)
  const [medicines, setMedicines] = React.useState<Medicine[]>([])
  const [filteredMedicines, setFilteredMedicines] = React.useState<Medicine[]>([])
  const [value, setValue] = React.useState("")
  const supabase = createClient()

  React.useEffect(() => {
    const fetchAllMedicines = async () => {
      const { data } = await supabase
        .from("master_inventory")
        .select("id, medicine_name, unit")
        .order("medicine_name")
      
      setMedicines(data || [])
      setFilteredMedicines(data || [])
    }

    fetchAllMedicines()
  }, [])

  const filterMedicines = (searchTerm: string) => {
    const filtered = medicines.filter(medicine => 
      medicine.medicine_name.toLowerCase().includes(searchTerm.toLowerCase())
    )
    setFilteredMedicines(filtered)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {value || "Select medicine..."}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command>
          <CommandInput 
            placeholder="Search medicines..." 
            onValueChange={filterMedicines}
          />
          <CommandEmpty>No medicine found.</CommandEmpty>
          <CommandGroup className="max-h-[200px] overflow-y-auto">
            {filteredMedicines.map((medicine) => (
              <CommandItem
                key={medicine.id}
                value={medicine.medicine_name}
                onSelect={() => {
                  setValue(medicine.medicine_name)
                  onSelect(medicine)
                  setOpen(false)
                }}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    value === medicine.medicine_name ? "opacity-100" : "opacity-0"
                  )}
                />
                {medicine.medicine_name}
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
