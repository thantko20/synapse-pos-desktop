import { DropdownMenuGroup, DropdownMenuLabel } from "#/components/ui/dropdown-menu"
import { Input } from "#/components/ui/input"
import { Label } from "#/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "#/components/ui/dialog"
import { Button } from "#/components/ui/button"
import { useState, useEffect } from "react"
import type { Category } from "../types"

interface CategoryFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  category?: Category | null
  onSubmit: (data: { name: string; description: string }) => void
  isPending: boolean
}

export function CategoryFormDialog({
  open,
  onOpenChange,
  category,
  onSubmit,
  isPending,
}: CategoryFormDialogProps) {
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")

  useEffect(() => {
    if (open) {
      setName(category?.name ?? "")
      setDescription(category?.description ?? "")
    }
  }, [open, category])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({ name, description })
  }

  const isEditing = !!category

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Category" : "New Category"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update the category details."
              : "Create a new category."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="category-name">Name</Label>
            <Input
              id="category-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Category name"
              required
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="category-description">Description</Label>
            <Input
              id="category-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description"
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving..." : isEditing ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}