"use client"

import { Button } from "@/components/ui/button"
import { Download, Printer } from 'lucide-react'

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
  invoiceNumber: string
  date: string
  issuer: {
    name: string
    address: string
    phone: string
    gstNumber: string
    email: string
  }
  recipient: {
    name: string
    ownerName: string
    address: string
    phone: string
    gstNumber: string
    email: string
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
    const html2pdf = (await import("html2pdf.js")).default

    const element = document.getElementById("invoice-print-outer")
    if (!element) return

    const opt = {
      margin: 0,
      filename: `invoice-${Date.now()}.pdf`,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: {
        scale: 2,
        backgroundColor: "#ffffff"
      },
      jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
    }

    html2pdf().set(opt).from(element).save()
  }

  const handlePrintInNewWindow = () => {
    const invoiceElement = document.getElementById("invoice-print-outer");
    if (!invoiceElement) {
      console.error("Print Error: Could not find element #invoice-print-outer");
      return;
    }

    const iframe = document.createElement("iframe");
    iframe.style.display = "none";
    document.body.appendChild(iframe);

    const iframeDoc = iframe.contentWindow.document;

    const headElements = document.querySelectorAll(
      'head > style, head > link[rel="stylesheet"]'
    );
    const iframeHead = iframeDoc.head;
    headElements.forEach((el) => {
      iframeHead.appendChild(el.cloneNode(true));
    });

    const printStyle = iframeDoc.createElement("style");
    printStyle.textContent = `
      @media print {
        body { margin: 0; padding: 0; }
        @page { size: A4; margin: 0; }
        #invoice-print-outer {
          width: 210mm;
          height: 297mm;
          display: block;
        }
      }
    `;
    // iframeHead.appendChild(printStyle);

    const iframeBody = iframeDoc.body;
    iframeBody.innerHTML = invoiceElement.innerHTML;

    let loadedStyles = 0;
    const stylesheets = iframeHead.querySelectorAll('link[rel="stylesheet"]');
    const totalStyles = stylesheets.length;

    const triggerPrint = () => {
      try {
        iframe.contentWindow.focus();
        iframe.contentWindow.print();
      } catch (e) {
        console.error("Print failed:", e);
      } finally {
        setTimeout(() => {
          document.body.removeChild(iframe);
        }, 500);
      }
    };

    if (totalStyles === 0) {
      triggerPrint();
      return;
    }

    stylesheets.forEach(link => {
      const onEvent = () => {
        loadedStyles++;
        if (loadedStyles === totalStyles) {
          triggerPrint();
        }
      };
      link.onload = onEvent;
      link.onerror = onEvent;
    });

    setTimeout(() => {
      if (loadedStyles < totalStyles) {
        console.warn("Print timed out waiting for styles. Printing anyway.");
        triggerPrint();
      }
    }, 3000);
  };

  const itemsSubtotal = invoiceData.items.reduce((sum, item) => sum + item.amount, 0)
  const additionalChargesTotal = invoiceData.additionalCharges?.reduce((sum, charge) => sum + charge.amount, 0) || 0
  const subtotal = itemsSubtotal + additionalChargesTotal

  const cgst = invoiceData.taxType === "intrastate" ? (subtotal * invoiceData.cgstRate) / 100 : 0
  const sgst = invoiceData.taxType === "intrastate" ? (subtotal * invoiceData.sgstRate) / 100 : 0
  const igst = invoiceData.taxType === "interstate" ? (subtotal * invoiceData.igstRate) / 100 : 0

  const totalTax = cgst + sgst + igst
  const total = Math.round(subtotal + totalTax)

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

  const numberToWords = (num: number): string => {
    const numToString = (n: number): string => {
      if (n === 0) return "";
      return " " + numberToWords(n);
    }

    if (num === 0) return "Zero";

    if (num < 0) return "Negative" + numToString(Math.abs(num));

    if (num >= 10000000) {
      return numberToWords(Math.floor(num / 10000000)) + " Crore" + numToString(num % 10000000);
    }

    if (num >= 100000) {
      return numberToWords(Math.floor(num / 100000)) + " Lakh" + numToString(num % 100000);
    }

    if (num >= 1000) {
      return numberToWords(Math.floor(num / 1000)) + " Thousand" + numToString(num % 1000);
    }

    if (num >= 100) {
      return numberToWords(Math.floor(num / 100)) + " Hundred" + numToString(num % 100);
    }

    if (num >= 20) {
      return tens[Math.floor(num / 10)] + numToString(num % 10);
    }

    return ones[num];
  }

  const totalInWords = numberToWords(total) + " Only"

  const MAX_ITEMS_DISPLAY = 15
  const displayItems = Array(MAX_ITEMS_DISPLAY)
    .fill(null)
    .map((_, index) => invoiceData.items[index] || null)

  return (
    <div className="min-h-screen bg-gray-50 print:bg-white print:min-h-0">
      {/* Action Buttons - Hidden when printing */}
      <div className="flex justify-end gap-2 mb-6 print:hidden p-4">
        <Button onClick={handlePrintInNewWindow}>
          <Printer className="mr-2 h-4 w-4" />
          Print Invoice
        </Button>
        <Button onClick={handleDownloadPDF}>
          <Download className="mr-2 h-4 w-4" />
          Download PDF
        </Button>
      </div>

      <div 
        id="invoice-print-outer"
        className="w-[210mm] h-[297mm] p-[8mm] mx-auto bg-white border-2 border-black print:border-2 print:border-black print:w-[210mm] print:h-[297mm]"
      >
        <div 
          id="invoice-print"
          className="w-full h-full flex flex-col text-xs font-serif border-2 border-black print:border-2 print:border-black text-black overflow-hidden box-border"
        >
          {/* Header Section */}
          <div className="text-center border-b border-black pb-2 px-2 flex-shrink-0">
            <div className="text-base font-bold mb-1">TAX INVOICE</div>
            <div className="text-sm font-bold mb-1">{invoiceData.issuer.name}</div>
            <div className="text-xs mb-0.5">{invoiceData.issuer.address}</div>
            <div className="text-xs mb-0.5">
              Email-{invoiceData.issuer.email}, mobile-{invoiceData.issuer.phone}
            </div>
            <div className="text-xs font-bold">GSTIN : {invoiceData.issuer.gstNumber}</div>
          </div>

          {/* Invoice Details Grid */}
          <div className="grid grid-cols-2 border-b border-black text-xs flex-shrink-0">
            <div className="border-r border-black p-1.5">
              <div className="flex mb-0.5">
                <span className="w-20">Invoice No.</span>
                <span className="mr-1">:</span>
                <span className="font-bold">{invoiceData.invoiceNumber}</span>
              </div>
              <div className="flex mb-0.5">
                <span className="w-20">Dated</span>
                <span className="mr-1">:</span>
                <span>{new Date(invoiceData.date).toLocaleDateString("en-GB")}</span>
              </div>
              <div className="flex mb-0.5">
                <span className="w-20">Place of Supply</span>
                <span className="mr-1">:</span>
                <span>{invoiceData.placeOfSupply}</span>
              </div>
              <div className="flex">
                <span className="w-20">Reverse Charge</span>
                <span className="mr-1">:</span>
                <span>{invoiceData.reverseCharge}</span>
              </div>
            </div>

            <div className="p-1.5">
              <div className="flex mb-0.5">
                <span className="w-20">Transport</span>
                <span className="mr-1">:</span>
                <span>{invoiceData.transport?.name || ""}</span>
              </div>
              <div className="flex mb-0.5">
                <span className="w-20">Vehicle No.</span>
                <span className="mr-1">:</span>
                <span>{invoiceData.transport?.vehicleNo || ""}</span>
              </div>
              <div className="flex mb-0.5">
                <span className="w-20">Station</span>
                <span className="mr-1">:</span>
                <span>{invoiceData.transport?.station || ""}</span>
              </div>
              <div className="flex">
                <span className="w-20">E-Way Bill No.</span>
                <span className="mr-1">:</span>
                <span>{invoiceData.transport?.eWayBillNo || ""}</span>
              </div>
            </div>
          </div>

          {/* Billing and Shipping */}
          <div className="grid grid-cols-2 border-b border-black text-xs flex-shrink-0">
            <div className="border-r border-black p-1.5">
              <div className="font-bold mb-0.5">Billed to :</div>
              <div className="font-bold text-xs">{invoiceData.recipient.name}</div>
              <div className="whitespace-pre-line text-xs mb-0.5">{invoiceData.recipient.address}</div>
              <div className="text-xs">GSTIN / UIN : {invoiceData.recipient.gstNumber}</div>
            </div>

            <div className="p-1.5">
              <div className="font-bold mb-0.5">Shipped to :</div>
              <div className="font-bold text-xs">{invoiceData.recipient.name}</div>
              <div className="whitespace-pre-line text-xs mb-0.5">{invoiceData.recipient.address}</div>
              <div className="text-xs">GSTIN / UIN : {invoiceData.recipient.gstNumber}</div>
            </div>
          </div>

          {/* IRN Details */}
          {invoiceData.irn && (
            <div className="text-xs border-b border-black p-1 flex-shrink-0">
              <span>IRN : {invoiceData.irn}</span>
              <span className="ml-2.5">Ack.No.: {invoiceData.ackNo}</span>
              <span className="ml-2.5">Ack. Date : {invoiceData.ackDate}</span>
            </div>
          )}

          {/* Items Table */}
          <div className="flex flex-col border-b border-black overflow-hidden flex-1 min-h-0">
            <table className="w-full border-collapse text-xs table-fixed">
              <thead>
                <tr className="border-b border-black">
                  <th className="w-[5%] p-1 text-center font-bold bg-gray-100 text-xs">S.N.</th>
                  <th className="w-[38%] p-1 text-left font-bold bg-gray-100 text-xs">Description of Goods</th>
                  <th className="w-[12%] p-1 text-center font-bold bg-gray-100 text-xs">HSN/SAC Code</th>
                  <th className="w-[12%] p-1 text-center font-bold bg-gray-100 text-xs">Qty. Unit</th>
                  <th className="w-[13%] p-1 text-right font-bold bg-gray-100 text-xs">Price</th>
                  <th className="w-[14%] p-1 text-right font-bold bg-gray-100 text-xs">Amount(Rs.)</th>
                </tr>
              </thead>
              <tbody>
                {displayItems.map((item, index) => (
                  <tr key={index} className="">
                    <td className="p-1 text-center text-xs align-top border-r border-black">
                      {item ? index + 1 + "." : ""}
                    </td>
                    <td className="p-1 text-left text-xs align-top border-r border-black break-words">
                      {item?.description}
                    </td>
                    <td className="p-1 text-center text-xs align-top border-r border-black">
                      {item?.hsnCode}
                    </td>
                    <td className="p-1 text-center text-xs align-top border-r border-black">
                      {item ? `${item.quantity.toFixed(3)}${item.unit || "PAIR"}` : ""}
                    </td>
                    <td className="p-1 text-right text-xs align-top border-r border-black">
                      {item?.rate.toFixed(2)}
                    </td>
                    <td className="p-1 text-right text-xs align-top">
                      {item ? item.amount.toLocaleString("en-IN", { minimumFractionDigits: 2 }) : ""}
                    </td>
                  </tr>
                ))}

                {/* Subtotal Row */}
                <tr className="border-t border-black">
                  <td colSpan={4} className="p-1"></td>
                  <td className="p-1 text-left font-bold text-xs border-r border-black">
                    Net Amount:
                  </td>
                  <td className="p-1 text-right font-bold text-xs">
                    {subtotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </td>
                </tr>

                {/* Tax Rows */}
                {invoiceData.taxType === "interstate" && igst > 0 && (
                  <tr>
                    <td colSpan={4} className="p-1"></td>
                    <td className="p-1 text-left text-xs border-r border-black">
                      Add : IGST @ {invoiceData.igstRate}.00 %
                    </td>
                    <td className="p-1 text-right text-xs">
                      {igst.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                )}

                {invoiceData.taxType === "intrastate" && (
                  <>
                    {cgst > 0 && (
                      <tr>
                        <td colSpan={4} className="p-1"></td>
                        <td className="p-1 text-left text-xs border-r border-black">
                          Add : CGST @ {invoiceData.cgstRate}.00 %
                        </td>
                        <td className="p-1 text-right text-xs">
                          {cgst.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    )}
                    {sgst > 0 && (
                      <tr>
                        <td colSpan={4} className="p-1"></td>
                        <td className="p-1 text-left text-xs border-r border-black">
                          Add : SGST @ {invoiceData.sgstRate}.00 %
                        </td>
                        <td className="p-1 text-right text-xs">
                          {sgst.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    )}
                  </>
                )}

                {/* Grand Total Row */}
                <tr className="border-t border-black">
                  <td colSpan={4} className="p-1"></td>
                  <td className="p-1 text-left font-bold text-xs border-r border-black">
                    Total Amount
                  </td>
                  <td className="p-1 text-right font-bold text-xs">
                    {total.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Amount in Words */}
          <div className="text-xs border-b border-black p-1.5 flex-shrink-0">
            <span>Amount in Rupees: </span>
            <span className="font-bold">Rupees {totalInWords}</span>
          </div>

          {/* Bank Details and Terms */}
          <div className="grid grid-cols-2 border-b border-black text-xs flex-shrink-0">
            <div className="border-r border-black p-1.5">
              {invoiceData.bankDetails && (
                <div>
                  <div className="font-bold mb-0.5">Bank Details:</div>
                  <div className="text-xs leading-tight">
                    BANK-{invoiceData.bankDetails.bankName} . BRANCH- {invoiceData.bankDetails.branch}
                  </div>
                  <div className="text-xs">
                    A/C NO- {invoiceData.bankDetails.accountNo} . IFSC CODE- {invoiceData.bankDetails.ifscCode}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="grid grid-cols-2 gap-0 flex-shrink-0 text-xs">
            <div className="border-r border-black p-1.5">
              <div className="font-bold mb-0.5">Terms & Conditions</div>
              <div className="text-xs leading-tight">
                <div>1. Goods once sold will not be taken back.</div>
                <div>2. Payment is respectfully requested within 15 days from the date of invoice.</div>
                <div>3. Goods are dispatched at the buyer's risk. The seller is not responsible for any damage during transit unless agreed in writing.</div>
                <div>4. All disputes, if any, shall be subject to the jurisdiction of Mumbai, Maharashtra.</div>
                <div>5. Claims for shortages or damages must be reported within 3 days of delivery. Returns are accepted only with prior approval and intact packaging.</div>
                <div>6. Goods remain the property of the seller until full payment is received.</div>
                <div>E.& O.E.</div>
              </div>
            </div>

            <div className="grid grid-rows-2 gap-0">
              <div className="border-b border-black p-1.5">
                <div className="font-bold text-xs">Receiver's Signature :</div>
                <div className="h-4"></div>
              </div>

              <div className="p-1.5 text-right flex flex-col justify-end">
                <div className="font-bold text-xs">For {invoiceData.issuer.name}</div>
                <div className="h-3"></div>
                <div className="font-bold text-xs">Authorised Signatory</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
