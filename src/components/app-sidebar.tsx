"use client"

import type * as React from "react"
import { Receipt, Settings } from "lucide-react"

import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import { ThemeToggle } from "@/components/theme-toggle"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"

const data = {
  user: {
    name: "John Smith",
    email: "john@invoiceapp.com",
    avatar: "/placeholder.svg?height=32&width=32",
  },
  navMain: [
    {
      title: "Invoices",
      url: "/invoices",
      icon: Receipt,
      isActive: true,
      items: [
        {
          title: "All Invoices",
          url: "/invoices",
        },
        {
          title: "Draft",
          url: "/invoices?status=draft",
        },
        {
          title: "Sent",
          url: "/invoices?status=sent",
        },
        {
          title: "Paid",
          url: "/invoices?status=paid",
        },
        {
          title: "Overdue",
          url: "/invoices?status=overdue",
        },
      ],
    },
    {
      title: "Settings",
      url: "/settings",
      icon: Settings,
      items: [
        {
          title: "Company Info",
          url: "/settings",
        },
        {
          title: "Invoice Settings",
          url: "/settings#invoice",
        },
        {
          title: "Templates",
          url: "/settings#templates",
        },
      ],
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <a href="/invoices">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                  <Receipt className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">InvoiceApp</span>
                  <span className="truncate text-xs">Professional</span>
                </div>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
      </SidebarContent>
      <SidebarFooter>
        <div className="flex items-center justify-between p-2">
          <NavUser user={data.user} />
          <ThemeToggle />
        </div>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
