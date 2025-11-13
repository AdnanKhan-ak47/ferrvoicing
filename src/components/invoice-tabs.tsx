"use client"

import { useEffect, useState } from "react"
import { Plus, Search, Filter, MoreHorizontal, Eye, Edit, Trash2 } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { CreateInvoiceDialog } from "@/components/create-document-dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { invoke } from "@tauri-apps/api/core"

const invoiceData = [
  {
    id: "INV-001",
    client: "Acme Corp",
    owner: "John Smith",
    gst: "27AABCU9603R1ZX",
    amount: "$2,500.00",
    status: "paid",
    date: "2024-01-15",
  },
  {
    id: "INV-002",
    client: "Tech Solutions",
    owner: "Priya Sharma",
    gst: "29AABCT1332L1ZZ",
    amount: "$1,800.00",
    status: "sent",
    date: "2024-01-20",
  },
  {
    id: "INV-003",
    client: "Design Studio",
    owner: "Rahul Gupta",
    gst: "07AABCD2345E1ZY",
    amount: "$3,200.00",
    status: "draft",
    date: "2024-01-22",
  },
]

const debitNoteData = [
  {
    id: "DN-001",
    client: "Acme Corp",
    owner: "John Smith",
    gst: "27AABCU9603R1ZX",
    amount: "$150.00",
    status: "sent",
    date: "2024-01-18",
  },
  {
    id: "DN-002",
    client: "Tech Solutions",
    owner: "Priya Sharma",
    gst: "29AABCT1332L1ZZ",
    amount: "$75.00",
    status: "paid",
    date: "2024-01-25",
  },
]

const creditNoteData = [
  {
    id: "CN-001",
    client: "Design Studio",
    owner: "Rahul Gupta",
    gst: "07AABCD2345E1ZY",
    amount: "$200.00",
    status: "sent",
    date: "2024-01-20",
  },
]

function DocumentTable({
  data,
  type,
  searchTerm,
  searchBy,
}: { data: any[]; type: string; searchTerm: string; searchBy: string }) {
  const filteredData = data.filter((item) => {
    if (!searchTerm) return true

    const term = searchTerm.toLowerCase()
    switch (searchBy) {
      case "name":
        return item.client.toLowerCase().includes(term)
      case "owner":
        return item.owner.toLowerCase().includes(term)
      case "gst":
        return item.gst.toLowerCase().includes(term)
      default:
        return true
    }
  })

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Date</TableHead>
          <TableHead>Client</TableHead>
          <TableHead>GST Number</TableHead>
          <TableHead>Invoice No.</TableHead>
          <TableHead>Amount</TableHead>
          <TableHead className="w-[50px]"></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {filteredData.map((item) => (
          <TableRow key={item.id}>
            <TableCell>{item.invoice_date}</TableCell>
            <TableCell>{item.recipient_name}</TableCell>
            <TableCell className="font-mono text-sm">{item.recipient_gst_number}</TableCell>
            <TableCell>{item.document_number}</TableCell>
            <TableCell>{item.total}</TableCell>
            <TableCell>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>
                    <a href={`/invoice/${item.id}`} className="flex items-center w-full">
                      <Eye className="mr-2 h-4 w-4" />
                      View
                    </a>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-destructive">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </TableCell>
          </TableRow>
        ))}
        {filteredData.length === 0 && (
          <TableRow>
            <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
              {searchTerm ? `No ${type}s found matching your search.` : `No ${type}s found.`}
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  )
}

export function InvoiceTabs() {
  const [activeTab, setActiveTab] = useState("invoices")
  const [searchTerm, setSearchTerm] = useState("")
  const [searchBy, setSearchBy] = useState<"recipient_name" | "document_number" | "recipient_gst_number">("recipient_name")
  const [documentData, setDocumentData] = useState([])


  useEffect(() => {
    const handleSearch = async () => {
      const invoiceData = await invoke("search_invoices", {
        filter: {
          [searchBy]: searchTerm
        }
      }
      )
      console.log("This is the data", invoiceData);
      setDocumentData(invoiceData);
    }

    const searchTimeout = setTimeout(async () => {
      handleSearch()
    }, 300)


    return () => clearTimeout(searchTimeout)
  }, [searchBy, searchTerm])

  const getCurrentDocumentType = () => {
    switch (activeTab) {
      case "invoices":
        return "invoice"
      case "debit-notes":
        return "debit-note"
      case "credit-notes":
        return "credit-note"
      default:
        return "invoice"
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Documents</h1>
          <p className="text-muted-foreground">Manage your invoices, debit notes, and credit notes</p>
        </div>
        <CreateInvoiceDialog>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Create Document
          </Button>
        </CreateInvoiceDialog>
      </div>

      <div className="flex items-center space-x-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={`Search ${activeTab} by ${searchBy === "recipient_name" ? "company name" : searchBy === "document_number" ? "Invoice Number" : "GST number"}...`}
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Select value={searchBy} onValueChange={(value: "recipient_name" | "recipient_gst_number" | "document_number") => setSearchBy(value)}>
          <SelectTrigger className="w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="recipient_name">Name</SelectItem>
            <SelectItem value="recipient_gst_number">GST Number</SelectItem>
            <SelectItem value="document_number">Invoice No.</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm">
          <Filter className="mr-2 h-4 w-4" />
          Advanced
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="invoices">Invoices</TabsTrigger>
          <TabsTrigger value="debit-notes">Debit Notes</TabsTrigger>
          <TabsTrigger value="credit-notes">Credit Notes</TabsTrigger>
        </TabsList>

        <TabsContent value="invoices" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Invoices</CardTitle>
              <CardDescription>Manage and track your invoices</CardDescription>
            </CardHeader>
            <CardContent>
              <DocumentTable data={documentData} type="invoice" searchTerm={searchTerm} searchBy={searchBy} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="debit-notes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Debit Notes</CardTitle>
              <CardDescription>Track additional charges and adjustments</CardDescription>
            </CardHeader>
            <CardContent>
              <DocumentTable data={debitNoteData} type="debit-note" searchTerm={searchTerm} searchBy={searchBy} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="credit-notes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Credit Notes</CardTitle>
              <CardDescription>Manage refunds and credit adjustments</CardDescription>
            </CardHeader>
            <CardContent>
              <DocumentTable data={creditNoteData} type="credit-note" searchTerm={searchTerm} searchBy={searchBy} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
