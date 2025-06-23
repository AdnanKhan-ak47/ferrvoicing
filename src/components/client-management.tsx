"use client"

import { useState, useEffect } from "react"
import { Search, Plus, Edit, Trash2, MoreHorizontal, Building2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { AddClientDialog } from "@/components/add-client-dialog"
import { EditClientDialog } from "@/components/edit-client-dialog"
import { DeleteClientDialog } from "@/components/delete-client-dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { invoke } from "@tauri-apps/api/core"

export interface Client {
  id: string
  name: string
  owner_name: string
  gst_number: string
  address: string
  pincode: string
  phone: string
  email?: string
  createdAt: string
}


export function ClientManagement() {
  const [clients, setClients] = useState<Client[]>([])
  const [filteredClients, setFilteredClients] = useState<Client[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [searchBy, setSearchBy] = useState<"name" | "owner" | "gst">("name")

  
  // Filter clients based on search term
  useEffect(() => {
    const getClients = async () => {
      try {
        let searchFilter: string = searchBy.toString();
      if(searchBy === "name") {
        searchFilter = "name";
      } else if(searchBy === "owner") {
        searchFilter = "ownerName";
      } else if(searchBy === "gst") {
        searchFilter = "gstNumber";
      }
  
      const res = await invoke<Client[]>("search_company", {
        filter: {
          [searchFilter]: searchTerm.trim()
        }
      })
        setClients(res)
        setFilteredClients(res)
      } catch (error) {
        console.error("Failed to fetch clients:", error)
      }
    }

    getClients();
    
  }, [searchTerm, searchBy, clients])

  const handleAddClient = (newClient: Omit<Client, "id" | "createdAt">) => {
    const client: Client = {
      ...newClient,
      id: Date.now().toString(),
      createdAt: new Date().toISOString().split("T")[0],
    }
    setClients([...clients, client])
    setIsAddDialogOpen(false)
  }

  const handleEditClient = (updatedClient: Client) => {
    setClients(clients.map((client) => (client.id === updatedClient.id ? updatedClient : client)))
    setIsEditDialogOpen(false)
    setSelectedClient(null)
  }

  const handleDeleteClient = (clientId: string) => {
    setClients(clients.filter((client) => client.id !== clientId))
    setIsDeleteDialogOpen(false)
    setSelectedClient(null)
  }

  const openEditDialog = (client: Client) => {
    setSelectedClient(client)
    setIsEditDialogOpen(true)
  }

  const openDeleteDialog = (client: Client) => {
    setSelectedClient(client)
    setIsDeleteDialogOpen(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Client Management</h1>
          <p className="text-muted-foreground">Manage your clients and company information</p>
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Client
        </Button>
      </div>

      <div className="flex items-center space-x-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={`Search by ${searchBy === "name" ? "company name" : searchBy === "owner" ? "owner name" : "GST number"}...`}
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Select value={searchBy} onValueChange={(value: "name" | "owner" | "gst") => setSearchBy(value)}>
          <SelectTrigger className="w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="name">Name</SelectItem>
            <SelectItem value="owner">Owner Name</SelectItem>
            <SelectItem value="gst">GST Number</SelectItem>
          </SelectContent>
        </Select>
        <div className="text-sm text-muted-foreground">
          {filteredClients.length} of {clients.length} clients
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Clients
          </CardTitle>
          <CardDescription>View and manage all your clients</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Company Name</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead>GST Number</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Pincode</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredClients.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    {searchTerm ? "No clients found matching your search." : "No clients added yet."}
                  </TableCell>
                </TableRow>
              ) : (
                filteredClients.map((client) => (
                  <TableRow key={client.id}>
                    <TableCell className="font-medium">{client.name}</TableCell>
                    <TableCell>{client.owner_name}</TableCell>
                    <TableCell className="font-mono text-sm">{client.gst_number}</TableCell>
                    <TableCell>{client.phone}</TableCell>
                    <TableCell>{client.email || "—"}</TableCell>
                    <TableCell>{client.pincode}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEditDialog(client)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openDeleteDialog(client)} className="text-destructive">
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Dialogs */}
      <AddClientDialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen} onAddClient={handleAddClient} />

      {selectedClient && (
        <EditClientDialog
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          client={selectedClient}
          onEditClient={handleEditClient}
        />
      )}

      {selectedClient && (
        <DeleteClientDialog
          open={isDeleteDialogOpen}
          onOpenChange={setIsDeleteDialogOpen}
          client={selectedClient}
          onDeleteClient={handleDeleteClient}
        />
      )}
    </div>
  )
}
