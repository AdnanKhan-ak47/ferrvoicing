"use client"

import { useState } from "react"
import { Plus, Search, Filter, MoreHorizontal, Eye, Edit, Trash2 } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { CreateDocumentDialog } from "@/components/create-document-dialog"

const invoiceData = [
  { id: "INV-001", client: "Acme Corp", amount: "$2,500.00", status: "paid", date: "2024-01-15" },
  { id: "INV-002", client: "Tech Solutions", amount: "$1,800.00", status: "sent", date: "2024-01-20" },
  { id: "INV-003", client: "Design Studio", amount: "$3,200.00", status: "draft", date: "2024-01-22" },
]

const debitNoteData = [
  { id: "DN-001", client: "Acme Corp", amount: "$150.00", status: "sent", date: "2024-01-18" },
  { id: "DN-002", client: "Tech Solutions", amount: "$75.00", status: "paid", date: "2024-01-25" },
]

const creditNoteData = [
  { id: "CN-001", client: "Design Studio", amount: "$200.00", status: "sent", date: "2024-01-20" },
]

function DocumentTable({ data, type }: { data: any[]; type: string }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Document ID</TableHead>
          <TableHead>Client</TableHead>
          <TableHead>Amount</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Date</TableHead>
          <TableHead className="w-[50px]"></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((item) => (
          <TableRow key={item.id}>
            <TableCell className="font-medium">{item.id}</TableCell>
            <TableCell>{item.client}</TableCell>
            <TableCell>{item.amount}</TableCell>
            <TableCell>
              <Badge variant={item.status === "paid" ? "default" : item.status === "sent" ? "secondary" : "outline"}>
                {item.status}
              </Badge>
            </TableCell>
            <TableCell>{item.date}</TableCell>
            <TableCell>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>
                    <Eye className="mr-2 h-4 w-4" />
                    View
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
      </TableBody>
    </Table>
  )
}

export function InvoiceTabs() {
  const [activeTab, setActiveTab] = useState("invoices")

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Documents</h1>
          <p className="text-muted-foreground">Manage your invoices, debit notes, and credit notes</p>
        </div>
        <CreateDocumentDialog>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Create Document
          </Button>
        </CreateDocumentDialog>
      </div>

      <div className="flex items-center space-x-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search documents..." className="pl-8" />
        </div>
        <Button variant="outline" size="sm">
          <Filter className="mr-2 h-4 w-4" />
          Filter
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
              <DocumentTable data={invoiceData} type="invoice" />
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
              <DocumentTable data={debitNoteData} type="debit-note" />
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
              <DocumentTable data={creditNoteData} type="credit-note" />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
