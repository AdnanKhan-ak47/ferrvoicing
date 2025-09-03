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

// Mock invoice data - replace with actual data fetching
const mockInvoiceData = {
  id: "GST/2232/2023-24",
  date: "2023-10-04",
  issuer: {
    name: "Qasmi Traders",
    address: " Room No. 1, Sultan Mukadam Chawl, New Hall Road, Kurla (W)\nMumbai, Maharashtra, 400070",
    phone: "1231231230",
    gstNumber: "27SFGPK3092R1ZD",
    email: "test@gmail.com",
    pan: "KHJPK3092R",
  },
  recipient: {
    name: "R J Footwear",
    ownerName: "Owner Name",
    address: "Yusuf Manzil, pattharwala building no. 11, Shop no. 11, Baban Gali, Sankli Street, Cross Lane No. 5\nMumbai, Maharashtra, 400003",
    phone: "+91 12312312310",
    gstNumber: "27lsdjfSDF23tD",
    email: "qasmi@traders.com",
    pan: "AHSHPK32492Q",
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

export default function InvoicePage({ params }: { params: { id: string } }) {
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
                  <BreadcrumbPage>Invoice {params.id}</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>
        <div className="flex flex-1 flex-col p-4 pt-0 print:p-0">
          <InvoicePrint invoiceData={mockInvoiceData} />
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
