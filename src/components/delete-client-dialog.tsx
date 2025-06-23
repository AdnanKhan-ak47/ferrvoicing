"use client"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { AlertTriangle } from "lucide-react"
import type { Client } from "@/components/client-management"

interface DeleteClientDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  client: Client
  onDeleteClient: (clientId: string) => void
}

export function DeleteClientDialog({ open, onOpenChange, client, onDeleteClient }: DeleteClientDialogProps) {
  const handleDelete = () => {
    onDeleteClient(client.id)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Delete Client
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to delete this client? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 py-4">
          <div className="rounded-lg border p-3 bg-muted/50">
            <p className="font-medium">{client.companyName}</p>
            <p className="text-sm text-muted-foreground">{client.ownerName}</p>
            <p className="text-sm text-muted-foreground font-mono">{client.gstNumber}</p>
          </div>
          <p className="text-sm text-muted-foreground">
            All associated invoices and documents will still be preserved, but you won&apos;t be able to select this client
            for new documents.
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleDelete}>
            Delete Client
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
