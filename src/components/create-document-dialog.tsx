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
  uqc: string // Unit Quantity Code
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

const indianStates = [
  { code: "01", label: "Jammu and Kashmir (01)" },
  { code: "02", label: "Himachal Pradesh (02)" },
  { code: "03", label: "Punjab (03)" },
  { code: "04", label: "Chandigarh (04)" },
  { code: "05", label: "Uttarakhand (05)" },
  { code: "06", label: "Haryana (06)" },
  { code: "07", label: "Delhi (07)" },
  { code: "08", label: "Rajasthan (08)" },
  { code: "09", label: "Uttar Pradesh (09)" },
  { code: "10", label: "Bihar (10)" },
  { code: "11", label: "Sikkim (11)" },
  { code: "12", label: "Arunachal Pradesh (12)" },
  { code: "13", label: "Nagaland (13)" },
  { code: "14", label: "Manipur (14)" },
  { code: "15", label: "Mizoram (15)" },
  { code: "16", label: "Tripura (16)" },
  { code: "17", label: "Meghalaya (17)" },
  { code: "18", label: "Assam (18)" },
  { code: "19", label: "West Bengal (19)" },
  { code: "20", label: "Jharkhand (20)" },
  { code: "21", label: "Odisha (21)" },
  { code: "22", label: "Chhattisgarh (22)" },
  { code: "23", label: "Madhya Pradesh (23)" },
  { code: "24", label: "Gujarat (24)" },
  { code: "25", label: "Daman and Diu (25)" },
  { code: "26", label: "Dadra and Nagar Haveli (26)" },
  { code: "27", label: "Maharashtra (27)" },
  { code: "28", label: "Andhra Pradesh (28)" },
  { code: "29", label: "Karnataka (29)" },
  { code: "30", label: "Goa (30)" },
  { code: "31", label: "Lakshadweep (31)" },
  { code: "32", label: "Kerala (32)" },
  { code: "33", label: "Tamil Nadu (33)" },
  { code: "34", label: "Puducherry (34)" },
  { code: "35", label: "Andaman and Nicobar Islands (35)" },
  { code: "36", label: "Telangana (36)" },
  { code: "37", label: "Andhra Pradesh (New) (37)" },
]

// Common UQC (Unit Quantity Code) options
const UQC_OPTIONS = [
  "PRS", // Pairs
  "NOS", // Numbers
  "PCS", // Pieces
  "KGS", // Kilograms
  "MTR", // Meters
  "LTR", // Liters
  "BAG",
  "BOX",
  "SET",
  "SQF", // Square feet
  "SQM", // Square meters
  "CBM", // Cubic meters
]


export function CreateInvoiceDialog({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  const [date, setDate] = useState<Date>()

  // Transport details
  const [transporterName, setTransporterName] = useState("SELF") // Mandatory, default SELF
  const [vehicleNo, setVehicleNo] = useState("")
  const [station, setStation] = useState("")
  const [eWayBillNo, setEWayBillNo] = useState("")

  // Supply and reverse charge
  const [placeOfSupply, setPlaceOfSupply] = useState("27") // default Maharashtra (27)
  const [reverseCharge, setReverseCharge] = useState<"Y" | "N">("N")

  // Items and charges
  const [lineItems, setLineItems] = useState<LineItem[]>([
    { description: "", hsnCode: "", quantity: 1, uqc: "NOS", rate: 0, amount: 0 },
  ])
  const [additionalCharges, setAdditionalCharges] = useState<{ description: string; amount: number }[]>([])
  const [invoiceNumber, setInvoiceNumber] = useState<string>("")

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

  const [profileDetails, setProfileDetails] = useState<object>({});

  const setUpDocumentFromProfile = async () => {
    const profile_data = await invoke<object>("get_profile_details");
    setProfileDetails(profile_data);
    const invNumber = profile_data.invoice_prefix + `-${profile_data.next_invoice_number}`;
    setInvoiceNumber(invNumber);
  }

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

  const handleInvoiceCreate = async () => {

    const items = lineItems.map(item => ({
      description: item.description,
      hsn_code: item.hsnCode,
      quantity: item.quantity,
      unit: item.uqc,
      rate: item.rate,
      amount: item.amount
    }));

    const transport_details = {
      transporter_name: transporterName,
      place_of_supply: placeOfSupply, 
      vehicle_no: vehicleNo,
      station: station,
      eway_bill_no: eWayBillNo
    }

    const bank_details = {
      bank_name: profileDetails.bank_name,
      branch: profileDetails.bank_branch,
      account_name: profileDetails.bank_account_name,
      account_no: profileDetails.bank_account_number,
      ifsc_code: profileDetails.bank_ifsc
    }

    const createInvoice = await invoke("create_invoice", {
      invoice: {
        issuer_name: profileDetails.company_name,
        issuer_address: profileDetails.address,
        issuer_gst_number: profileDetails.gst_number,
        issuer_phone: profileDetails.phone,
        issuer_email: profileDetails.email,
        recipient_name: selectedClient?.name,
        recipient_address: selectedClient?.address,
        recipient_gst_number: selectedClient?.gst_number,
        recipient_phone: selectedClient?.phone,
        recipient_email: selectedClient?.email || "",
        items, // This is the serialized JSON string of items
        invoice_date: date ? format(date, "yyyy-MM-dd") : new Date().toISOString().split("T")[0],
        invoice_number: invoiceNumber,
        amount: lineItems.reduce((sum, item) => sum + item.amount, 0),
        cgst_percentage: cgstRate,
        sgst_percentage: sgstRate,
        igst_percentage: igstRate,
        // additional_charges_json,
        total: total,
        reverse_charge: reverseCharge === "N" ? false : true, 
        transport_details,
        bank_details
      }
    })
    console.log("Invoice created:", createInvoice)
    setOpen(false)
  }

  useEffect(() => {
    setUpDocumentFromProfile();
  }, [])

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
    setLineItems([...lineItems, { description: "", hsnCode: "", quantity: 1, uqc: "NOS", rate: 0, amount: 0 }])
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
      <DialogContent className="w-full max-w-[50vw] sm:max-w-[50vw] p-6 rounded-xl shadow-xl max-h-[70vh] overflow-y-scroll">
        <DialogHeader>
          <DialogTitle>Create New Invoice</DialogTitle>
          <DialogDescription>Create a new invoice</DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="invoice-number">Invoice Number</Label>
              <Input
                id="invoice-number"
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                placeholder={`Enter Invoice Number`} />
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

          {/* Transport Details */}
          <div className="space-y-3">
            <Label>Transport Details</Label>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="transporterName">
                  Transporter Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="transporterName"
                  value={transporterName}
                  onChange={(e) => setTransporterName(e.target.value)}
                  placeholder="SELF"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="vehicleNo">Vehicle No.</Label>
                <Input
                  id="vehicleNo"
                  value={vehicleNo}
                  onChange={(e) => setVehicleNo(e.target.value)}
                  placeholder="MH12AB1234"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="station">Station</Label>
                <Input id="station" value={station} onChange={(e) => setStation(e.target.value)} placeholder="KURLA" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="eway">E-Way Bill No.</Label>
                <Input
                  id="eway"
                  value={eWayBillNo}
                  onChange={(e) => setEWayBillNo(e.target.value)}
                  placeholder="781371653898"
                />
              </div>
            </div>
          </div>

          {/* Place of Supply + Reverse Charge */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Place of Supply</Label>
              <Select value={placeOfSupply} onValueChange={setPlaceOfSupply}>
                <SelectTrigger>
                  <SelectValue placeholder="Select place of supply" />
                </SelectTrigger>
                <SelectContent>
                  {indianStates.map((s) => (
                    <SelectItem key={s.code} value={s.code}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Reverse Charge</Label>
              <RadioGroup value={reverseCharge} onValueChange={(v: "Y" | "N") => setReverseCharge(v)} className="mt-1">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem id="rc-n" value="N" />
                    <Label htmlFor="rc-n">N</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem id="rc-y" value="Y" />
                    <Label htmlFor="rc-y">Y</Label>
                  </div>
                </div>
              </RadioGroup>
            </div>
          </div>

          {/* Line Items */}
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
              <div className="col-span-1">Qty</div>
              <div className="col-span-1">UQC</div>
              <div className="col-span-1">Rate</div>
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
                  <div className="col-span-1">
                    <Select value={item.uqc} onValueChange={(val) => updateLineItem(index, "uqc", val)}>
                      <SelectTrigger>
                        <SelectValue placeholder="UQC" />
                      </SelectTrigger>
                      <SelectContent>
                        {UQC_OPTIONS.map((opt) => (
                          <SelectItem key={opt} value={opt}>
                            {opt}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-1">
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
          <Button onClick={handleInvoiceCreate}>
            Create Invoice
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
