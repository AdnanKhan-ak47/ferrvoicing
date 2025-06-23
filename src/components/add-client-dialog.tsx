"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import type { Client } from "@/components/client-management.tsx"
import { invoke } from "@tauri-apps/api/core"

interface AddClientDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAddClient: (client: Omit<Client, "id" | "createdAt">) => void
}

export function AddClientDialog({ open, onOpenChange, onAddClient }: AddClientDialogProps) {
  const [formData, setFormData] = useState({
    companyName: "",
    ownerName: "",
    gstNumber: "",
    address: "",
    pincode: "",
    phone: "",
    email: "",
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleInputChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value })
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors({ ...errors, [field]: "" })
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.companyName.trim()) newErrors.companyName = "Company name is required"
    if (!formData.ownerName.trim()) newErrors.ownerName = "Owner name is required"
    if (!formData.gstNumber.trim()) newErrors.gstNumber = "GST number is required"
    if (!formData.address.trim()) newErrors.address = "Address is required"
    if (!formData.pincode.trim()) newErrors.pincode = "Pincode is required"
    if (!formData.phone.trim()) newErrors.phone = "Phone number is required"

    // GST number format validation (basic)
    if (formData.gstNumber && !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(formData.gstNumber)) {
      newErrors.gstNumber = "Invalid GST number format"
    }

    // Pincode validation
    if (formData.pincode && !/^[1-9][0-9]{5}$/.test(formData.pincode)) {
      newErrors.pincode = "Invalid pincode format"
    }

    // Phone validation
    if (formData.phone && !/^[+]?[1-9][\d]{0,15}$/.test(formData.phone.replace(/\s/g, ""))) {
      newErrors.phone = "Invalid phone number format"
    }

    // Email validation (optional)
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Invalid email format"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (validateForm()) {

      const result = await invoke<string>('add_company', {
        company: {
          name: formData.companyName,
          owner_name: formData.ownerName,
          gst_number: formData.gstNumber,
          address: formData.address,
          pincode: formData.pincode,
          phone: formData.phone,
          email: formData.email,
        }
      });
      console.log(result);

      onAddClient(formData)
      // Reset form
      setFormData({
        companyName: "",
        ownerName: "",
        gstNumber: "",
        address: "",
        pincode: "",
        phone: "",
        email: "",
      })
      setErrors({})
    }
  }

  const handleCancel = () => {
    setFormData({
      companyName: "",
      ownerName: "",
      gstNumber: "",
      address: "",
      pincode: "",
      phone: "",
      email: "",
    })
    setErrors({})
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add New Client</DialogTitle>
          <DialogDescription>Add a new client to your database</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="companyName">
                Company Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="companyName"
                value={formData.companyName}
                onChange={(e) => handleInputChange("companyName", e.target.value)}
                placeholder="Enter company name"
              />
              {errors.companyName && <p className="text-sm text-destructive">{errors.companyName}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="ownerName">
                Owner Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="ownerName"
                value={formData.ownerName}
                onChange={(e) => handleInputChange("ownerName", e.target.value)}
                placeholder="Enter owner name"
              />
              {errors.ownerName && <p className="text-sm text-destructive">{errors.ownerName}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="gstNumber">
              GST Number <span className="text-destructive">*</span>
            </Label>
            <Input
              id="gstNumber"
              value={formData.gstNumber}
              onChange={(e) => handleInputChange("gstNumber", e.target.value.toUpperCase())}
              placeholder="27AABCU9603R1ZX"
              className="font-mono"
            />
            {errors.gstNumber && <p className="text-sm text-destructive">{errors.gstNumber}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">
              Address <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="address"
              value={formData.address}
              onChange={(e) => handleInputChange("address", e.target.value)}
              placeholder="Enter complete address"
              rows={3}
            />
            {errors.address && <p className="text-sm text-destructive">{errors.address}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="pincode">
                Pincode <span className="text-destructive">*</span>
              </Label>
              <Input
                id="pincode"
                value={formData.pincode}
                onChange={(e) => handleInputChange("pincode", e.target.value)}
                placeholder="400001"
                maxLength={6}
              />
              {errors.pincode && <p className="text-sm text-destructive">{errors.pincode}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">
                Phone Number <span className="text-destructive">*</span>
              </Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => handleInputChange("phone", e.target.value)}
                placeholder="+91 98765 43210"
              />
              {errors.phone && <p className="text-sm text-destructive">{errors.phone}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email (Optional)</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange("email", e.target.value)}
              placeholder="client@company.com"
            />
            {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button type="submit">Add Client</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
