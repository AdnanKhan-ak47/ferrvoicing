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

// Mock invoice data - replace with actual data fetching
const mockInvoiceData = {
  id: "GST/2232/2023-24",
  date: "2023-10-04",
  issuer: {
    name: "V K ENTERPRISES",
    address: " NEW DELHI-110063",
    phone: "324217307",
    gstNumber: "07AASPY3922D1ZC",
    email: "test@gmail.com",
    pan: "A23958yrsdfj",
  },
  recipient: {
    name: "QASMI TRADERS",
    ownerName: "Owner Name",
    address: "KURLA\nMaharashtra, 400070",
    phone: "+91 98765 43210",
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
  irn: "735418686de5871a1b483d6881d64f91d4c789fa54169529da2bdc3b6130c2ea",
  ackNo: "172313581494095",
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

export async function generateStaticParams() {
  return [
    { id: "GST/2232/2023-24" },
    { id: "1c25f2bd-1437-476d-a20e-ca8546531cf5" }, // ← explicitly add this
    // Add any more as needed
  ]
}
