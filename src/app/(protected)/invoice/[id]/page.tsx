"use client"

import { InvoicePrint } from "@/components/invoice-print"
import { AppSidebar } from "@/components/app-sidebar"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbLink,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { invoke } from "@tauri-apps/api/core"
import { useEffect, useState } from "react"
// A more standard way to get params in a client component
import { useParams } from "next/navigation"

// 1. Define a TypeScript type for your invoice data for type safety
// type Invoice = typeof mockInvoiceData

// Mock invoice data - can be used for development or as a fallback
const mockInvoiceData = {
  id: "GST/2232/2023-24",
  date: "2023-10-04",
  issuer: {
    name: "Qasmi Traders",
    address: " Room No. 1, Sultan Mukadam Chawl, New Hall Road, Kurla (W)\nMumbai, Maharashtra, 400070",
    phone: "1231231230",
    gstNumber: "27SFGPK3092R1ZD",
    email: "test@gmail.com",
  },
  recipient: {
    name: "R J Footwear",
    ownerName: "Owner Name",
    address: "Yusuf Manzil, pattharwala building no. 11, Shop no. 11, Baban Gali, Sankli Street, Cross Lane No. 5\nMumbai, Maharashtra, 400003",
    phone: "+91 12312312310",
    gstNumber: "27lsdjfSDF23tD",
    email: "qasmi@traders.com",
  },
  items: [
    {
      description: "F/W SOLE\n816 SOLE",
      hsnCode: "64062000",
      quantity: 470,
      rate: 85.0,
      amount: 39950.0,
      unit: "PAIR",
    },
    {
      description: "F/W SOLE\n816 PAD\n6 BAG",
      hsnCode: "64062000",
      quantity: 470,
      rate: 25.0,
      amount: 11750.0,
      unit: "PAIR",
    },
  ],
  additionalCharges: [],
  taxType: "interstate" as const,
  cgstRate: 0,
  sgstRate: 0,
  igstRate: 18,
  notes: "Payment due within 30 days. Thank you for your business!",
  transport: {
    name: "SATKARTAR ROADLINES",
    vehicleNo: "",
    station: "KURLA",
    eWayBillNo: "781371653898",
  },
  placeOfSupply: "Maharashtra (27)",
  reverseCharge: "N",
  irn: "735418686de5871a1b483d6881f91d4c789fa54169529da2bdc3b6130c2ea",
  ackNo: "1723135814095",
  ackDate: "04-10-2023",
  bankDetails: {
    bankName: "PUNJAB MAHINDRA BANK",
    branch: "PUNJABI BAGH",
    accountNo: "012453443535404976",
    ifscCode: "KBIN3242854",
  },
}

export default function InvoicePage() {
  // 2. Use the `useParams` hook to get the route parameters like the ID
  const params = useParams()
  const invoiceId = params.id as string

  // 3. Set up states for loading, error, and the actual invoice data
  const [invoiceData, setInvoiceData] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // 4. Use `useEffect` to fetch data when the component mounts or invoiceId changes
  useEffect(() => {
    if (!invoiceId) {
      setIsLoading(false)
      setError("No invoice ID found in the URL.")
      return // Exit if there's no ID
    }

    const fetchInvoiceData = async () => {
      try {
        // The result from invoke is 'unknown', so we cast it to the expected type
        const result = await invoke<Invoice[]>("search_invoices", {
          filter: { id: invoiceId },
        })

        console.log(result);
        // Your backend might return an array, even when searching by ID
        // if (result && result.length > 0) {
        //   setInvoiceData(result[0]) // Update the state with the fetched data

        setInvoiceData({
          id: result[0].id,
          invoiceNumber: result[0].invoice_number,
          date: result[0].invoice_date,
          issuer: {
            name: result[0].issuer_name,
            address: result[0].issuer_address,
            phone: result[0].issuer_phone,
            gstNumber: result[0].issuer_gst_number,
            email: result[0].issuer_email,
          },
          recipient: {
            name: result[0].recipient_name,
            // ownerName: result[0].recipient_,
            address: result[0].recipient_address,
            phone: result[0].recipient_phone,
            gstNumber: result[0].recipient_gst_number,
            email: result[0].recipient_email,
          },
          items: result[0].items,
          additionalCharges: result[0].additional_charges,
          taxType: result[0].cgst_percentage === 0 ? "interstate" : "intrastate",
          cgstRate: result[0].cgst_percentage,
          sgstRate: result[0].sgst_percentage,
          igstRate: result[0].igst_percentage,
          notes: result[0]?.notes,
          transport: {
            name: result[0].transport_details.transporter_name,
            vehicleNo: result[0].transport_details.vehicle_no,
            station: result[0].transport_details.station,
            eWayBillNo: result[0].transport_details.eway_bill_no,
          },
          placeOfSupply: result[0].transport_details.place_of_supply,
          reverseCharge: result[0].reverse_charge ? "Y" : "N",
          irn: result[0]?.irn,
          ackNo: result[0]?.ack_no,
          ackDate: result[0]?.ack_date,
          bankDetails: {
            bankName: result[0].bank_details.bank_name,
            branch: result[0].bank_details.branch,
            accountNo: result[0].bank_details.account_no,
            ifscCode: result[0].bank_details.ifsc_code,
          },
        })
        // } else {
        //   setError(`Invoice with ID "${invoiceId}" not found.`)
        // }
      } catch (err) {
        console.error("Failed to fetch invoice:", err)
        setError("An error occurred while fetching the invoice data.")
      } finally {
        setIsLoading(false) // Stop loading, whether it succeeded or failed
      }
    }

    fetchInvoiceData()
  }, [invoiceId]) // The hook re-runs if `invoiceId` ever changes

  // 5. Conditionally render content based on the state
  const renderContent = () => {
    if (isLoading) {
      return <div className="p-4">Loading invoice...</div>
    }

    if (error) {
      return <div className="p-4 text-red-500">Error: {error}</div>
    }

    if (invoiceData) {
      return <InvoicePrint invoiceData={invoiceData} />
    }

    return <div className="p-4">Invoice data is not available.</div> // Fallback
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12 print:hidden">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink href="/invoices">Invoices</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage>Invoice {invoiceId}</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>
        <div className="flex flex-1 flex-col p-4 pt-0 print:p-0">
          {renderContent()}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}