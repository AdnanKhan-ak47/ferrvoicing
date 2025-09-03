"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Receipt, Loader2, ArrowRight, Building2, MapPin, FileText, Phone, CreditCard } from "lucide-react"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { invoke } from "@tauri-apps/api/core"

const indianStates = [
  { code: "01", name: "Jammu and Kashmir" },
  { code: "02", name: "Himachal Pradesh" },
  { code: "03", name: "Punjab" },
  { code: "04", name: "Chandigarh" },
  { code: "05", name: "Uttarakhand" },
  { code: "06", name: "Haryana" },
  { code: "07", name: "Delhi" },
  { code: "08", name: "Rajasthan" },
  { code: "09", name: "Uttar Pradesh" },
  { code: "10", name: "Bihar" },
  { code: "11", name: "Sikkim" },
  { code: "12", name: "Arunachal Pradesh" },
  { code: "13", name: "Nagaland" },
  { code: "14", name: "Manipur" },
  { code: "15", name: "Mizoram" },
  { code: "16", name: "Tripura" },
  { code: "17", name: "Meghalaya" },
  { code: "18", name: "Assam" },
  { code: "19", name: "West Bengal" },
  { code: "20", name: "Jharkhand" },
  { code: "21", name: "Odisha" },
  { code: "22", name: "Chhattisgarh" },
  { code: "23", name: "Madhya Pradesh" },
  { code: "24", name: "Gujarat" },
  { code: "25", name: "Daman and Diu" },
  { code: "26", name: "Dadra and Nagar Haveli" },
  { code: "27", name: "Maharashtra" },
  { code: "28", name: "Andhra Pradesh" },
  { code: "29", name: "Karnataka" },
  { code: "30", name: "Goa" },
  { code: "31", name: "Lakshadweep" },
  { code: "32", name: "Kerala" },
  { code: "33", name: "Tamil Nadu" },
  { code: "34", name: "Puducherry" },
  { code: "35", name: "Andaman and Nicobar Islands" },
  { code: "36", name: "Telangana" },
  { code: "37", name: "Andhra Pradesh (New)" },
]

export function OnboardingForm() {
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState({
    // Company Information
    companyName: "",
    gstNumber: "",

    // Address Information
    address: "",
    city: "",
    state: "",
    pincode: "",

    // Contact Information
    phone: "",
    email: "",

    // Bank Details
    bankName: "",
    accountNumber: "",
    ifscCode: "",
    branchName: "",

    invoicePrefix: "INV",
    nextInvoiceNumber: 1,
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const totalSteps = 4

  const handleInputChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value })
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors({ ...errors, [field]: "" })
    }
  }

  const validateStep = (step: number) => {
    const newErrors: Record<string, string> = {}

    switch (step) {
      case 1: // Company Information
        if (!formData.companyName.trim()) newErrors.companyName = "Company name is required"
        if (!formData.gstNumber.trim()) {
          newErrors.gstNumber = "GST number is required"
        } else if (!/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(formData.gstNumber)) {
          newErrors.gstNumber = "Invalid GST number format"
        }
        break

      case 2: // Address Information
        if (!formData.address.trim()) newErrors.address = "Address is required"
        if (!formData.city.trim()) newErrors.city = "City is required"
        if (!formData.state.trim()) newErrors.state = "State is required"
        if (!formData.pincode.trim()) {
          newErrors.pincode = "Pincode is required"
        } else if (!/^[1-9][0-9]{5}$/.test(formData.pincode)) {
          newErrors.pincode = "Invalid pincode format"
        }
        break

      case 3: // Contact Information
        if (!formData.phone.trim()) {
          newErrors.phone = "Phone number is required"
        } else if (!/^[+]?[1-9][\d]{0,15}$/.test(formData.phone.replace(/\s/g, ""))) {
          newErrors.phone = "Invalid phone number format"
        }
        if (!formData.email.trim()) {
          newErrors.email = "Email is required"
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
          newErrors.email = "Invalid email format"
        }
        break

      case 4: // Bank Details & Additional Info
        if (!formData.bankName.trim()) newErrors.bankName = "Bank name is required"
        if (!formData.accountNumber.trim()) newErrors.accountNumber = "Account number is required"
        if (!formData.ifscCode.trim()) {
          newErrors.ifscCode = "IFSC code is required"
        } else if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(formData.ifscCode)) {
          newErrors.ifscCode = "Invalid IFSC code format"
        }
        if (!formData.branchName.trim()) newErrors.branchName = "Branch name is required"
        break
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handlePrevious = () => {
    setCurrentStep(currentStep - 1)
  }

  const handleSubmit = async () => {
    if (!validateStep(currentStep)) return

    setIsLoading(true)

    try {
      // Simulate API call - replace with actual onboarding
      // await new Promise((resolve) => setTimeout(resolve, 2000))
      const res = await invoke("complete_onboarding", {
        profileInfo: {
          company_name: formData.companyName,
          gst_number: formData.gstNumber,
          address: formData.address,
          city: formData.city,
          state: formData.state,
          pincode: formData.pincode,
          phone: formData.phone,
          email: formData.email,
          bank_name: formData.bankName,
          bank_branch: formData.branchName,
          bank_ifsc: formData.ifscCode,
          bank_account_number: formData.accountNumber,
          invoice_prefix: formData.invoicePrefix,
          next_invoice_number: formData.nextInvoiceNumber,
        }
      })

      console.log("Onboarding Completed: ", res);
      // Redirect to invoices
      router.push("/invoices")
    } catch (error) {
      console.error(error)
      setErrors({ general: "Onboarding failed. Please try again." })
    } finally {
      setIsLoading(false)
    }
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <div className="flex items-center space-x-2 text-indigo-600 dark:text-indigo-400 mb-4">
              <Building2 className="w-5 h-5" />
              <h3 className="text-lg font-semibold">Company Information</h3>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="companyName" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Company Name *
                </Label>
                <Input
                  id="companyName"
                  placeholder="Your Company Ltd."
                  value={formData.companyName}
                  onChange={(e) => handleInputChange("companyName", e.target.value)}
                  className="h-11 border-gray-200 dark:border-gray-700 focus:border-indigo-500 dark:focus:border-indigo-400 transition-colors"
                />
                {errors.companyName && <p className="text-sm text-red-600 dark:text-red-400">{errors.companyName}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="gstNumber" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  GST Number *
                </Label>
                <Input
                  id="gstNumber"
                  placeholder="27AABCU9603R1ZX"
                  value={formData.gstNumber}
                  onChange={(e) => handleInputChange("gstNumber", e.target.value.toUpperCase())}
                  className="h-11 font-mono border-gray-200 dark:border-gray-700 focus:border-indigo-500 dark:focus:border-indigo-400 transition-colors"
                  maxLength={15}
                />
                {errors.gstNumber && <p className="text-sm text-red-600 dark:text-red-400">{errors.gstNumber}</p>}
              </div>
            </div>
          </div>
        )

      case 2:
        return (
          <div className="space-y-4">
            <div className="flex items-center space-x-2 text-indigo-600 dark:text-indigo-400 mb-4">
              <MapPin className="w-5 h-5" />
              <h3 className="text-lg font-semibold">Address Information</h3>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="address" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Complete Address *
                </Label>
                <Textarea
                  id="address"
                  placeholder="Enter your complete business address"
                  value={formData.address}
                  onChange={(e) => handleInputChange("address", e.target.value)}
                  className="border-gray-200 dark:border-gray-700 focus:border-indigo-500 dark:focus:border-indigo-400 transition-colors"
                  rows={3}
                />
                {errors.address && <p className="text-sm text-red-600 dark:text-red-400">{errors.address}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    City *
                  </Label>
                  <Input
                    id="city"
                    placeholder="Mumbai"
                    value={formData.city}
                    onChange={(e) => handleInputChange("city", e.target.value)}
                    className="h-11 border-gray-200 dark:border-gray-700 focus:border-indigo-500 dark:focus:border-indigo-400 transition-colors"
                  />
                  {errors.city && <p className="text-sm text-red-600 dark:text-red-400">{errors.city}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pincode" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Pincode *
                  </Label>
                  <Input
                    id="pincode"
                    placeholder="400001"
                    value={formData.pincode}
                    onChange={(e) => handleInputChange("pincode", e.target.value)}
                    className="h-11 border-gray-200 dark:border-gray-700 focus:border-indigo-500 dark:focus:border-indigo-400 transition-colors"
                    maxLength={6}
                  />
                  {errors.pincode && <p className="text-sm text-red-600 dark:text-red-400">{errors.pincode}</p>}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="state" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  State *
                </Label>
                <Select value={formData.state} onValueChange={(value) => handleInputChange("state", value)}>
                  <SelectTrigger className="h-11 border-gray-200 dark:border-gray-700 focus:border-indigo-500 dark:focus:border-indigo-400">
                    <SelectValue placeholder="Select state" />
                  </SelectTrigger>
                  <SelectContent>
                    {indianStates.map((state) => (
                      <SelectItem key={state.code} value={state.code}>
                        {state.name} ({state.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.state && <p className="text-sm text-red-600 dark:text-red-400">{errors.state}</p>}
              </div>
            </div>
          </div>
        )

      case 3:
        return (
          <div className="space-y-4">
            <div className="flex items-center space-x-2 text-indigo-600 dark:text-indigo-400 mb-4">
              <Phone className="w-5 h-5" />
              <h3 className="text-lg font-semibold">Contact Information</h3>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Phone Number *
                </Label>
                <Input
                  id="phone"
                  placeholder="+91 98765 43210"
                  value={formData.phone}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                  className="h-11 border-gray-200 dark:border-gray-700 focus:border-indigo-500 dark:focus:border-indigo-400 transition-colors"
                />
                {errors.phone && <p className="text-sm text-red-600 dark:text-red-400">{errors.phone}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Business Email *
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="contact@company.com"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  className="h-11 border-gray-200 dark:border-gray-700 focus:border-indigo-500 dark:focus:border-indigo-400 transition-colors"
                />
                {errors.email && <p className="text-sm text-red-600 dark:text-red-400">{errors.email}</p>}
              </div>

            </div>
          </div>
        )

      case 4:
        return (
          <div className="space-y-4">
            <div className="flex items-center space-x-2 text-indigo-600 dark:text-indigo-400 mb-4">
              <CreditCard className="w-5 h-5" />
              <h3 className="text-lg font-semibold">Bank Details & Settings</h3>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="bankName" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Bank Name *
                  </Label>
                  <Input
                    id="bankName"
                    placeholder="State Bank of India"
                    value={formData.bankName}
                    onChange={(e) => handleInputChange("bankName", e.target.value)}
                    className="h-11 border-gray-200 dark:border-gray-700 focus:border-indigo-500 dark:focus:border-indigo-400 transition-colors"
                  />
                  {errors.bankName && <p className="text-sm text-red-600 dark:text-red-400">{errors.bankName}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="branchName" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Branch Name *
                  </Label>
                  <Input
                    id="branchName"
                    placeholder="Mumbai Main Branch"
                    value={formData.branchName}
                    onChange={(e) => handleInputChange("branchName", e.target.value)}
                    className="h-11 border-gray-200 dark:border-gray-700 focus:border-indigo-500 dark:focus:border-indigo-400 transition-colors"
                  />
                  {errors.branchName && <p className="text-sm text-red-600 dark:text-red-400">{errors.branchName}</p>}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="accountNumber" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Account Number *
                </Label>
                <Input
                  id="accountNumber"
                  placeholder="1234567890123456"
                  value={formData.accountNumber}
                  onChange={(e) => handleInputChange("accountNumber", e.target.value)}
                  className="h-11 font-mono border-gray-200 dark:border-gray-700 focus:border-indigo-500 dark:focus:border-indigo-400 transition-colors"
                />
                {errors.accountNumber && (
                  <p className="text-sm text-red-600 dark:text-red-400">{errors.accountNumber}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="ifscCode" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  IFSC Code *
                </Label>
                <Input
                  id="ifscCode"
                  placeholder="SBIN0000123"
                  value={formData.ifscCode}
                  onChange={(e) => handleInputChange("ifscCode", e.target.value.toUpperCase())}
                  className="h-11 font-mono border-gray-200 dark:border-gray-700 focus:border-indigo-500 dark:focus:border-indigo-400 transition-colors"
                  maxLength={11}
                />
                {errors.ifscCode && <p className="text-sm text-red-600 dark:text-red-400">{errors.ifscCode}</p>}
              </div>

              <div className="border-t pt-4 mt-6">
                <div className="flex items-center space-x-2 text-gray-700 dark:text-gray-300 mb-4">
                  <FileText className="w-5 h-5" />
                  <h4 className="font-medium">Invoice Settings</h4>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="invoicePrefix" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Invoice Prefix
                    </Label>
                    <Input
                      id="invoicePrefix"
                      placeholder="INV"
                      value={formData.invoicePrefix}
                      onChange={(e) => handleInputChange("invoicePrefix", e.target.value)}
                      className="h-11 border-gray-200 dark:border-gray-700 focus:border-indigo-500 dark:focus:border-indigo-400 transition-colors"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="nextInvoiceNumber" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Starting Invoice Number
                    </Label>
                    <Input
                      id="nextInvoiceNumber"
                      placeholder="1001"
                      value={formData.nextInvoiceNumber}
                      onChange={(e) => handleInputChange("nextInvoiceNumber", e.target.value)}
                      className="h-11 border-gray-200 dark:border-gray-700 focus:border-indigo-500 dark:focus:border-indigo-400 transition-colors"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="w-full max-w-2xl space-y-8">
      {/* Header */}
      <div className="text-center space-y-6">
        <div className="flex justify-center">
          <div className="relative">
            <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-indigo-600 to-cyan-600 rounded-2xl shadow-lg">
              <Receipt className="w-8 h-8 text-white" />
            </div>
            <div className="absolute -inset-1 bg-gradient-to-br from-indigo-600 to-cyan-600 rounded-2xl blur opacity-25"></div>
          </div>
        </div>
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
            Complete Your Setup
          </h1>
          <p className="text-gray-600 dark:text-gray-400">Let's set up your company information to get started</p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
          <span>
            Step {currentStep} of {totalSteps}
          </span>
          <span>{Math.round((currentStep / totalSteps) * 100)}% Complete</span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div
            className="bg-gradient-to-r from-indigo-600 to-cyan-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${(currentStep / totalSteps) * 100}%` }}
          ></div>
        </div>
      </div>

      {/* Form */}
      <Card className="border-0 shadow-xl bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
        <CardContent className="p-8">
          {errors.general && (
            <Alert variant="destructive" className="mb-6 border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950">
              <AlertDescription className="text-red-800 dark:text-red-200">{errors.general}</AlertDescription>
            </Alert>
          )}

          {renderStepContent()}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
            <Button
              type="button"
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 1}
              className="px-6 bg-transparent"
            >
              Previous
            </Button>

            {currentStep < totalSteps ? (
              <Button
                type="button"
                onClick={handleNext}
                className="px-6 bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-700 hover:to-cyan-700 text-white"
              >
                Next
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button
                type="button"
                onClick={handleSubmit}
                disabled={isLoading}
                className="px-6 bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-700 hover:to-cyan-700 text-white"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Setting up...
                  </>
                ) : (
                  <>
                    Complete Setup
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
