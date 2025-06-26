"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { CalendarIcon, Plus, Minus, Check, ChevronsUpDown } from "lucide-react"
import { format } from "date-fns"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { cn } from "@/lib/utils"
import { Separator } from "@/components/ui/separator"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { invoke } from "@tauri-apps/api/core"

interface LineItem {
  description: string
  hsnCode: string
  quantity: number
  rate: number
  amount: number
}

interface Client {
  id: string
  name: string
  owner_name: string
  gst_number: string
  address: string
  phone: string
  email: string
}


export function CreateDocumentDialog({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  const [documentType, setDocumentType] = useState("invoice")
  const [date, setDate] = useState<Date>()
  const [lineItems, setLineItems] = useState<LineItem[]>([
    { description: "", hsnCode: "", quantity: 1, rate: 0, amount: 0 },
  ])
  // Additional charges state
  const [additionalCharges, setAdditionalCharges] = useState<{ description: string; amount: number }[]>([])

  const [documentNumber, setDocumentNumber] = useState<string>("")

  // Client search state
  const [clientSearch, setClientSearch] = useState("")
  const [clients, setClients] = useState<Client[]>([])
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [clientOpen, setClientOpen] = useState(false)
  const [isSearching, setIsSearching] = useState(false)

  // Tax state
  const [taxType, setTaxType] = useState<"interstate" | "intrastate">("intrastate")
  const [cgstRate, setCgstRate] = useState(9)
  const [sgstRate, setSgstRate] = useState(9)
  const [igstRate, setIgstRate] = useState(18)

  const searchClients = async (query: string) => {
    try {
      const searchFilter: string = "name";

      // let searchFilter: string = searchBy.toString();
      // if (searchBy === "name") {
      //   searchFilter = "name";
      // } else if (searchBy === "owner") {
      //   searchFilter = "ownerName";
      // } else if (searchBy === "gst") {
      //   searchFilter = "gstNumber";
      // }

      const res = await invoke<Client[]>("search_company", {
        filter: {
          [searchFilter]: query.trim()
        }
      })
      console.log("these are the clients", res)
      return res;
    } catch (error) {
      console.error("Failed to fetch clients:", error)
    }
  }

  const handleDocumentCreate = async () => {

    const items = lineItems.map(item => ({
      description: item.description,
      hsn_code: item.hsnCode,
      quantity: item.quantity,
      rate: item.rate,
      amount: item.amount
    }));

    if (documentType === "invoice") {
      const createInvoice = await invoke("create_invoice", {
        invoice: {
          issuer_name: "Qasmi Traders",
          issuer_address: "",
          issuer_gst_number: "",
          issuer_phone: "9969393260",
          issuer_email: "qasmitraders@gmail.com",
          recipient_name: selectedClient?.name,
          recipient_address: selectedClient?.address,
          recipient_gst_number: selectedClient?.gst_number,
          recipient_phone: selectedClient?.phone,
          recipient_email: selectedClient?.email || "",
          items, // This is the serialized JSON string of items
          invoice_date: date ? format(date, "yyyy-MM-dd") : new Date().toISOString().split("T")[0],
          invoice_number: documentNumber,
          amount: lineItems.reduce((sum, item) => sum + item.amount, 0),
          cgst_percentage: cgstRate,
          sgst_percentage: sgstRate,
          igst_percentage: igstRate,
          // additional_charges_json,
          total: total
        }
      })
      console.log("Invoice created:", createInvoice)
      setOpen(false)
    }
  }

  // Search clients when search term changes
  useEffect(() => {
    const searchTimeout = setTimeout(async () => {
      if (clientSearch.trim()) {
        setIsSearching(true)
        try {
          const result = await searchClients(clientSearch)
          setClients(result || [])
        } catch (error) {
          console.error("Error searching clients:", error)
        } finally {
          setIsSearching(false)
        }
      } else {
        // setClients([])
      }
    }, 300)

    return () => clearTimeout(searchTimeout)
  }, [clientSearch])

  const addLineItem = () => {
    setLineItems([...lineItems, { description: "", hsnCode: "", quantity: 1, rate: 0, amount: 0 }])
  }

  const removeLineItem = (index: number) => {
    if (lineItems.length > 1) {
      setLineItems(lineItems.filter((_, i) => i !== index))
    }
  }

  const updateLineItem = (index: number, field: keyof LineItem, value: string | number) => {
    const updated = [...lineItems]
    updated[index] = { ...updated[index], [field]: value }

    if (field === "quantity" || field === "rate") {
      updated[index].amount = updated[index].quantity * updated[index].rate
    }

    setLineItems(updated)
  }

  const addAdditionalCharge = () => {
    setAdditionalCharges([...additionalCharges, { description: "", amount: 0 }])
  }

  const removeAdditionalCharge = (index: number) => {
    setAdditionalCharges(additionalCharges.filter((_, i) => i !== index))
  }

  const updateAdditionalCharge = (index: number, field: "description" | "amount", value: string | number) => {
    const updated = [...additionalCharges]
    updated[index] = { ...updated[index], [field]: value }
    setAdditionalCharges(updated)
  }

  const subtotal = lineItems.reduce((sum, item) => sum + item.amount, 0)
  const additionalChargesTotal = additionalCharges.reduce((sum, charge) => sum + charge.amount, 0)
  const subtotalWithCharges = subtotal + additionalChargesTotal

  // Calculate taxes based on type
  const cgst = taxType === "intrastate" ? (subtotalWithCharges * cgstRate) / 100 : 0
  const sgst = taxType === "intrastate" ? (subtotalWithCharges * sgstRate) / 100 : 0
  const igst = taxType === "interstate" ? (subtotalWithCharges * igstRate) / 100 : 0

  const totalTax = cgst + sgst + igst
  const totalBeforeRounding = subtotalWithCharges + totalTax
  const total = Math.round(totalBeforeRounding) // Round to nearest integer

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="w-full max-w-[50vw] sm:max-w-[50vw] p-6 rounded-xl shadow-xl">
        <DialogHeader>
          <DialogTitle>Create New Document</DialogTitle>
          <DialogDescription>Create a new invoice, debit note, or credit note</DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="document-type">Document Type</Label>
              <Select value={documentType} onValueChange={setDocumentType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select document type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="invoice">Invoice</SelectItem>
                  <SelectItem value="debit-note">Debit Note</SelectItem>
                  <SelectItem value="credit-note">Credit Note</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="document-number">{documentType === "invoice" ? "Invoice" : documentType === "debit-note" ? "Debit Note" : "Credit Note"} Number</Label>
              <Input
                id="document-number"
                value={documentNumber}
                onChange={(e) => setDocumentNumber(e.target.value)}
                placeholder={`Enter ${documentType === "invoice" ? "Invoice" : documentType === "debit-note" ? "Debit Note" : "Credit Note"} Number`} />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn("w-full justify-start text-left font-normal", !date && "text-muted-foreground")}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar mode="single" selected={date} onSelect={setDate} initialFocus />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label>Client</Label>
            <Popover open={clientOpen} onOpenChange={setClientOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" role="combobox" aria-expanded={clientOpen} className="w-full justify-between">
                  {selectedClient ? (
                    <div className="flex flex-col items-start">
                      <span className="font-medium">{selectedClient.name}</span>
                      <span className="text-xs text-muted-foreground">{selectedClient.owner_name}</span>
                    </div>
                  ) : (
                    "Search and select client..."
                  )}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0">
                <Command>
                  <CommandInput placeholder="Search clients..." value={clientSearch}
                    onValueChange={(val) => {
                      setClientSearch(val)
                      setClientOpen(true)
                    }}
                    disabled={!!selectedClient}
                  />
                  <CommandList>
                    <CommandEmpty>No clients found.</CommandEmpty>
                    <CommandGroup>
                      {clients.map((client) => (
                        <CommandItem
                          key={client.id}
                          value={client.name.toLowerCase()} // important for fuzzy match
                          onSelect={() => {
                            setSelectedClient(client)
                            setClientOpen(false)
                            setClientSearch("")
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              selectedClient?.id === client.id ? "opacity-100" : "opacity-0",
                            )}
                          />
                          <div className="flex flex-col">
                            <span className="font-medium">{client.name}</span>
                            <span className="text-sm text-muted-foreground">{client.owner_name}</span>
                            <span className="text-xs text-muted-foreground">GST: {client.gst_number}</span>
                            <span className="text-xs text-muted-foreground">{client.address}</span>
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Line Items</Label>
              <Button type="button" variant="outline" size="sm" onClick={addLineItem}>
                <Plus className="mr-2 h-4 w-4" />
                Add Item
              </Button>
            </div>

            {/* Column Headers */}
            <div className="grid grid-cols-12 gap-2 text-sm font-medium text-muted-foreground">
              <div className="col-span-4">Description</div>
              <div className="col-span-2">HSN Code</div>
              <div className="col-span-1">Quantity</div>
              <div className="col-span-2">Rate</div>
              <div className="col-span-2">Amount</div>
              <div className="col-span-1">Action</div>
            </div>

            <div className="space-y-3">
              {lineItems.map((item, index) => (
                <div key={index} className="grid grid-cols-12 gap-2 items-center">
                  <div className="col-span-4">
                    <Input
                      placeholder="Item description"
                      value={item.description}
                      onChange={(e) => updateLineItem(index, "description", e.target.value)}
                    />
                  </div>
                  <div className="col-span-2">
                    <Input
                      placeholder="HSN Code"
                      value={item.hsnCode}
                      onChange={(e) => updateLineItem(index, "hsnCode", e.target.value)}
                    />
                  </div>
                  <div className="col-span-1">
                    <Input
                      type="number"
                      placeholder="Qty"
                      value={item.quantity}
                      onChange={(e) => updateLineItem(index, "quantity", Number.parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div className="col-span-2">
                    <Input
                      type="number"
                      placeholder="Rate"
                      value={item.rate}
                      onChange={(e) => updateLineItem(index, "rate", Number.parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div className="col-span-2">
                    <Input placeholder="Amount" value={item.amount.toFixed(2)} disabled />
                  </div>
                  <div className="col-span-1">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeLineItem(index)}
                      disabled={lineItems.length === 1}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {additionalCharges.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Additional Charges</Label>
                <Button type="button" variant="outline" size="sm" onClick={addAdditionalCharge}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Charge
                </Button>
              </div>

              {/* Column Headers */}
              <div className="grid grid-cols-12 gap-2 text-sm font-medium text-muted-foreground">
                <div className="col-span-8">Description</div>
                <div className="col-span-3">Amount</div>
                <div className="col-span-1">Action</div>
              </div>

              <div className="space-y-3">
                {additionalCharges.map((charge, index) => (
                  <div key={index} className="grid grid-cols-12 gap-2 items-center">
                    <div className="col-span-8">
                      <Input
                        placeholder="Additional charge description"
                        value={charge.description}
                        onChange={(e) => updateAdditionalCharge(index, "description", e.target.value)}
                      />
                    </div>
                    <div className="col-span-3">
                      <Input
                        type="number"
                        placeholder="Amount"
                        value={charge.amount}
                        onChange={(e) =>
                          updateAdditionalCharge(index, "amount", Number.parseFloat(e.target.value) || 0)
                        }
                      />
                    </div>
                    <div className="col-span-1">
                      <Button type="button" variant="outline" size="sm" onClick={() => removeAdditionalCharge(index)}>
                        <Minus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-start">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={addAdditionalCharge}
              className="text-muted-foreground hover:text-foreground"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Additional Charge
            </Button>
          </div>

          <Separator />

          {/* Tax Configuration */}
          <div className="space-y-4">
            <Label>Tax Configuration</Label>
            <RadioGroup value={taxType} onValueChange={(value: "interstate" | "intrastate") => setTaxType(value)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="intrastate" id="intrastate" />
                <Label htmlFor="intrastate">Intrastate (CGST + SGST)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="interstate" id="interstate" />
                <Label htmlFor="interstate">Interstate (IGST)</Label>
              </div>
            </RadioGroup>

            {taxType === "intrastate" ? (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="cgst">CGST Rate (%)</Label>
                  <Input
                    id="cgst"
                    type="number"
                    value={cgstRate}
                    onChange={(e) => setCgstRate(Number.parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sgst">SGST Rate (%)</Label>
                  <Input
                    id="sgst"
                    type="number"
                    value={sgstRate}
                    onChange={(e) => setSgstRate(Number.parseFloat(e.target.value) || 0)}
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="igst">IGST Rate (%)</Label>
                <Input
                  id="igst"
                  type="number"
                  value={igstRate}
                  onChange={(e) => setIgstRate(Number.parseFloat(e.target.value) || 0)}
                />
              </div>
            )}
          </div>

          <Separator />

          {/* Tax Calculation */}
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span>₹{subtotal.toFixed(2)}</span>
            </div>
            {taxType === "intrastate" ? (
              <>
                <div className="flex justify-between">
                  <span>CGST ({cgstRate}%):</span>
                  <span>₹{cgst.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>SGST ({sgstRate}%):</span>
                  <span>₹{sgst.toFixed(2)}</span>
                </div>
              </>
            ) : (
              <div className="flex justify-between">
                <span>IGST ({igstRate}%):</span>
                <span>₹{igst.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>Total Tax:</span>
              <span>₹{totalTax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Total before rounding:</span>
              <span>₹{totalBeforeRounding.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-semibold text-lg">
              <span>Total (Rounded):</span>
              <span>₹{total}</span>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" placeholder="Additional notes..." />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleDocumentCreate}>
            Create{" "}
            {documentType === "invoice" ? "Invoice" : documentType === "debit-note" ? "Debit Note" : "Credit Note"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
