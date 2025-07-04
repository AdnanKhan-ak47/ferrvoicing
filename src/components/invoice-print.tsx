"use client"

import { Button } from "@/components/ui/button"
import { Download, Printer } from "lucide-react"

interface InvoiceItem {
  description: string
  hsnCode: string
  quantity: number
  rate: number
  amount: number
  unit?: string
}

interface AdditionalCharge {
  description: string
  amount: number
}

interface InvoiceData {
  id: string
  date: string
  issuer: {
    name: string
    address: string
    phone: string
    gstNumber: string
    email: string
    pan: string
  }
  recipient: {
    name: string
    ownerName: string
    address: string
    phone: string
    gstNumber: string
    email: string
    pan: string
  }
  items: InvoiceItem[]
  additionalCharges?: AdditionalCharge[]
  taxType: "interstate" | "intrastate"
  cgstRate: number
  sgstRate: number
  igstRate: number
  notes?: string
  transport?: {
    name: string
    vehicleNo: string
    station: string
    eWayBillNo: string
  }
  placeOfSupply: string
  reverseCharge: string
  irn?: string
  ackNo?: string
  ackDate?: string
  bankDetails?: {
    bankName: string
    branch: string
    accountNo: string
    ifscCode: string
  }
}

interface InvoicePrintProps {
  invoiceData: InvoiceData
}

export function InvoicePrint({ invoiceData }: InvoicePrintProps) {

  const handleDownloadPDF = async () => {
    const html2pdf = (await import("html2pdf.js")).default;

    const element = document.getElementById("invoice-print")
    if (!element) return

    const opt = {
      margin: 0,
      filename: `invoice-${Date.now()}.pdf`,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
    }

    html2pdf().set(opt).from(element).save()
  }

  const handlePrintInNewWindow = () => {
    const invoice = document.getElementById("invoice-print");
    if (!invoice) return;

    const printWindow = window.open("", "PRINT", "width=800,height=1000");
    if (!printWindow) return;

    const styleSheets = [...document.styleSheets]
      .map((styleSheet) => {
        try {
          if (styleSheet.href) {
            return `<link rel="stylesheet" href="${styleSheet.href}">`;
          }
          return "";
        } catch (e) {
          return "";
        }
      })
      .join("");

    printWindow.document.write(`
    <html>
      <head>
        <title>Invoice</title>
        ${styleSheets}
        <style>
          @media print {
            body {
              margin: 0;
              padding: 0;
              color: black;
              background: white;
            }
          }
        </style>
      </head>
      <body>
        <div>${invoice.innerHTML}</div>
      </body>
    </html>
  `);

    printWindow.document.close();
    printWindow.focus();

    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 500);
  };



  // Calculate totals
  const itemsSubtotal = invoiceData.items.reduce((sum, item) => sum + item.amount, 0)
  const additionalChargesTotal = invoiceData.additionalCharges?.reduce((sum, charge) => sum + charge.amount, 0) || 0
  const subtotal = itemsSubtotal + additionalChargesTotal

  const cgst = invoiceData.taxType === "intrastate" ? (subtotal * invoiceData.cgstRate) / 100 : 0
  const sgst = invoiceData.taxType === "intrastate" ? (subtotal * invoiceData.sgstRate) / 100 : 0
  const igst = invoiceData.taxType === "interstate" ? (subtotal * invoiceData.igstRate) / 100 : 0

  const totalTax = cgst + sgst + igst
  const total = Math.round(subtotal + totalTax)

  // Convert number to words (simplified version)
  const numberToWords = (num: number): string => {
    const ones = [
      "",
      "One",
      "Two",
      "Three",
      "Four",
      "Five",
      "Six",
      "Seven",
      "Eight",
      "Nine",
      "Ten",
      "Eleven",
      "Twelve",
      "Thirteen",
      "Fourteen",
      "Fifteen",
      "Sixteen",
      "Seventeen",
      "Eighteen",
      "Nineteen",
    ]
    const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"]

    if (num === 0) return "Zero"
    if (num < 20) return ones[num]
    if (num < 100) return tens[Math.floor(num / 10)] + (num % 10 !== 0 ? " " + ones[num % 10] : "")
    if (num < 1000)
      return ones[Math.floor(num / 100)] + " Hundred" + (num % 100 !== 0 ? " " + numberToWords(num % 100) : "")
    if (num < 100000)
      return (
        numberToWords(Math.floor(num / 1000)) + " Thousand" + (num % 1000 !== 0 ? " " + numberToWords(num % 1000) : "")
      )

    return "Amount Too Large"
  }

  const totalInWords = numberToWords(total) + " Only"

  return (
    <div className="min-h-screen bg-gray-50 print:bg-white print:min-h-0">
      {/* Action Buttons - Hidden when printing */}
      <div className="flex justify-end gap-2 mb-6 print:hidden">
        <Button onClick={handlePrintInNewWindow}>
          <Printer className="mr-2 h-4 w-4" />
          Print Invoice
        </Button>
        <Button onClick={handleDownloadPDF}>
          <Download className="mr-2 h-4 w-4" />
          Download PDF
        </Button>
      </div>

      {/* Invoice Container */}
      <div id="invoice-print" className="max-w-4xl mx-auto bg-white print:shadow-none print:max-w-none">
        <div className="border box-border border-black text-xs leading-tight text-black">

          <div className="text-center border box-border p-2 border-black">
            <div className="font-bold text-lg mb-1 text-black">TAX INVOICE</div>
            <div className="font-bold text-base text-black">{invoiceData.issuer.name}</div>
            <div className="text-xs text-black">{invoiceData.issuer.address}</div>
            <div className="text-xs text-black">
              Email-{invoiceData.issuer.email}, mobile-{invoiceData.issuer.phone}
            </div>
            <div className="text-xs font-semibold text-black">PAN : {invoiceData.issuer.pan}</div>
            <div className="text-xs font-semibold text-black">GSTIN : {invoiceData.issuer.gstNumber}</div>
          </div>

          {/* Invoice Details Grid */}
          <div className="grid grid-cols-2 gap-0 text-xs border-box">
            <div className="border box-border border-black p-1">
              <div className="flex text-black">
                <span className="w-20">Invoice No.</span>
                <span className="mr-2">:</span>
                <span className="font-semibold">{invoiceData.id}</span>
              </div>
              <div className="flex text-black">
                <span className="w-20">Dated</span>
                <span className="mr-2">:</span>
                <span>{new Date(invoiceData.date).toLocaleDateString("en-GB")}</span>
              </div>
              <div className="flex text-black">
                <span className="w-20">Place of Supply</span>
                <span className="mr-2">:</span>
                <span>{invoiceData.placeOfSupply}</span>
              </div>
              <div className="flex text-black">
                <span className="w-20">Reverse Charge</span>
                <span className="mr-2">:</span>
                <span>{invoiceData.reverseCharge}</span>
              </div>
            </div>

            <div className=" border box-border border-black p-1">
              <div className="flex text-black">
                <span className="w-20">Transport</span>
                <span className="mr-2">:</span>
                <span>{invoiceData.transport?.name || ""}</span>
              </div>
              <div className="flex text-black">
                <span className="w-20">Vehicle No.</span>
                <span className="mr-2">:</span>
                <span>{invoiceData.transport?.vehicleNo || ""}</span>
              </div>
              <div className="flex text-black">
                <span className="w-20">Station</span>
                <span className="mr-2">:</span>
                <span>{invoiceData.transport?.station || ""}</span>
              </div>
              <div className="flex text-black">
                <span className="w-20">E-Way Bill No.</span>
                <span className="mr-2">:</span>
                <span>{invoiceData.transport?.eWayBillNo || ""}</span>
              </div>
            </div>
          </div>

          {/* Billing and Shipping */}
          <div className="grid grid-cols-2 gap-0 text-xs">
            <div className="box-border border border-black p-1">
              <div className="font-semibold mb-1 text-black">Billed to :</div>
              <div className="font-bold text-black">{invoiceData.recipient.name}</div>
              <div className="text-black whitespace-pre-line">{invoiceData.recipient.address}</div>
              <div className="mt-2">
                <div className="text-black">Party PAN : {invoiceData.recipient.pan}</div>
                <div className="text-black">GSTIN / UIN : {invoiceData.recipient.gstNumber}</div>
              </div>
            </div>

            <div className="box-border border border-black p-1">
              <div className="font-semibold mb-1 text-black">Shipped to :</div>
              <div className="font-bold text-black">{invoiceData.recipient.name}</div>
              <div className="text-black whitespace-pre-line">{invoiceData.recipient.address}</div>
              <div className="mt-2">
                <div className="text-black">Party PAN : {invoiceData.recipient.pan}</div>
                <div className="text-black">GSTIN / UIN : {invoiceData.recipient.gstNumber}</div>
              </div>
            </div>
          </div>

          {/* IRN Details */}
          {invoiceData.irn && (
            <div className="text-xs border border-black box-border text-black p-1">
              <span>IRN : {invoiceData.irn}</span>
              <span className="ml-4">Ack.No.: {invoiceData.ackNo}</span>
              <span className="ml-4">Ack. Date : {invoiceData.ackDate}</span>
            </div>
          )}

          {/* Items Table */}
          <table className="w-full border-collapse border border-black text-xs mb-2">
            <thead>
              <tr>
                <th className="border border-black p-1 text-left w-8 bg-white text-black">S.N.</th>
                <th className="border border-black p-1 text-left bg-white text-black">Description of Goods</th>
                <th className="border border-black p-1 text-center w-16 bg-white text-black">HSN/SAC Code</th>
                <th className="border border-black p-1 text-center w-20 bg-white text-black">Qty. Unit</th>
                <th className="border border-black p-1 text-center w-16 bg-white text-black">Price</th>
                <th className="border border-black p-1 text-center w-20 bg-white text-black">Amount(Rs.)</th>
              </tr>
            </thead>
            <tbody>
              {invoiceData.items.map((item, index) => (
                <tr key={index}>
                  <td className="border border-black p-1 text-center align-top text-black">{index + 1}.</td>
                  <td className="border border-black p-1 align-top text-black">
                    <div className="whitespace-pre-line">{item.description}</div>
                  </td>
                  <td className="border border-black p-1 text-center align-top text-black">{item.hsnCode}</td>
                  <td className="border border-black p-1 text-center align-top text-black">
                    {item.quantity.toFixed(3)}
                    {item.unit || "PAIR"}
                  </td>
                  <td className="border border-black p-1 text-right align-top text-black">{item.rate.toFixed(2)}</td>
                  <td className="border border-black p-1 text-right align-top text-black">
                    {item.amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              ))}

              {/* Subtotal Row */}
              <tr>
                <td className="p-1" colSpan={3}></td>
                <td className="border border-black p-1 text-left text-black" colSpan={2}>
                  Net Amount:
                </td>
                <td className="border border-black p-1 text-right font-semibold text-black">
                  {subtotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </td>
              </tr>

              {/* Tax Rows */}
              {invoiceData.taxType === "interstate" && igst > 0 && (
                <tr>
                  <td className="p-1" colSpan={3}></td>
                  <td className="border border-black p-1 text-left text-black" colSpan={2}>
                    Add : IGST @ {invoiceData.igstRate}.00 %
                  </td>
                  <td className="border border-black p-1 text-right text-black">
                    {igst.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              )}

              {invoiceData.taxType === "intrastate" && (
                <>
                  {cgst > 0 && (
                    <tr>
                      <td className="p-1" colSpan={3}></td>
                      <td className="border border-black p-1 text-left text-black" colSpan={2}>
                        Add : CGST @ {invoiceData.cgstRate}.00 %
                      </td>
                      <td className="border border-black p-1 text-right text-black">
                        {cgst.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  )}
                  {sgst > 0 && (
                    <tr>
                      <td className="border border-black p-1" colSpan={3}></td>
                      <td className="border border-black p-1 text-left text-black" colSpan={2}>
                        Add : SGST @ {invoiceData.sgstRate}.00 %
                      </td>
                      <td className="border border-black p-1 text-right text-black">
                        {sgst.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  )}
                </>
              )}
              <tr>
                <td colSpan={3}></td>
                <td className="border border-black" colSpan={2}>
                  Total Amount
                </td>
                <td className="border border-black text-right font-semibold text-black">
                  <span>{total.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                </td>
              </tr>

              {/* <tr>
                <td className="" colSpan={1}>Amount in Rupees:</td>
                <td colSpan={4} className="font-semibold">{totalInWords}</td>
              </tr> */}
            </tbody>
          </table>

          {/* Grand Total */}
          {/* <div className="text-center font-bold text-sm mb-2 text-black">
            <div className="flex justify-between">
              <span>Grand Total</span>
              <span>
                {invoiceData.items.reduce((sum, item) => sum + item.quantity, 0).toFixed(3)}{" "}
                {invoiceData.items[0]?.unit || "PAIR"}
              </span>
              <span>{total.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
            </div>
          </div> */}

          {/* Amount in Words */}
          <div className="text-xs mb-2 p-1 text-black">
            <span>Amount in Words: </span>
            <span className="font-semibold">Rupees {totalInWords}</span>
          </div>

          {/* Bank Details and Terms */}
          <div className="grid grid-cols-2 gap-4 text-xs border-t border-b border-black p-2">
            <div>
              {invoiceData.bankDetails && (
                <div>
                  <div className="font-semibold text-black">Bank Details:</div>
                  <div className="text-black">
                    BANK-{invoiceData.bankDetails.bankName} . BRANCH- {invoiceData.bankDetails.branch}
                  </div>
                  <div className="text-black">
                    A/C NO- {invoiceData.bankDetails.accountNo} . IFSC CODE- {invoiceData.bankDetails.ifscCode}
                  </div>
                </div>
              )}
            </div>

          </div>

          {/* Footer */}
          <div className="grid grid-cols-2 text-xs box-border">
            <div className="border-r border-black box-border p-2">
              <div className="font-semibold text-black">Terms & Conditions</div>
              <div className="text-xs leading-tight">
                <div className="text-black">1. Goods once sold will not be taken back.</div>
                <div className="text-black">2. Payment is respectfully requested within 15 days from the date of invoice.</div>
                <div className="text-black">3. Goods are dispatched at the buyer’s risk. The seller is not responsible for any damage during transit unless agreed in writing.</div>
                <div className="text-black">4. All disputes, if any, shall be subject to the jurisdiction of Mumbai, Maharashtra.</div>
                <div className="text-black">5. Claims for shortages or damages must be reported within 3 days of delivery. Returns are accepted only with prior approval and intact packaging.</div>
                <div className="text-black">6. Goods remain the property of the seller until full payment is received.</div>
                <div className="text-black">E.& O.E.</div>
              </div>
            </div>

            <div className="grid grid-cols-1 box-border">
              <div className="border-b border-black box-border p-2">
                <div className="font-semibold text-black">Receiver's Signature :</div>
                <div className="h-16"></div>
              </div>

              <div className="text-right box-border p-2">
                <div className="font-semibold text-black">For {invoiceData.issuer.name}</div>
                <div className="h-16"></div>
                <div className="font-semibold text-black">Authorised Signatory</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
