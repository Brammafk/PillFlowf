"use client"

import * as React from "react"
import {
  IconCamera,
  IconChartBar,
  IconDashboard,
  IconDatabase,
  IconFileAi,
  IconFileDescription,
  IconFileWord,
  IconFolder,
  IconHelp,
  IconInnerShadowTop,
  IconListDetails,
  IconReport,
  IconSearch,
  IconSettings,
  IconUsers,
} from "@tabler/icons-react"
import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"

import { NavDocuments } from "@/components/nav-documents"
import { NavMain } from "@/components/nav-main"
import { NavSecondary } from "@/components/nav-secondary"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

const data = {
  navMain: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: IconDashboard,
    },
    {
      title: "Customers",
      url: "/customers",
      icon: IconUsers,
    },
    {
      title: "Checking Packs",
      url: "/checking-packs",
      icon: IconListDetails,
    },
    {
      title: "Scan Out",
      url: "/scan-out",
      icon: IconCamera,
    },
    {
      title: "Settings",
      url: "/settings",
      icon: IconSettings,
    },
  ],
  navSecondary: [
    {
      title: "Settings",
      url: "/settings",
      icon: IconSettings,
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const currentUser = useQuery(api.myFunctions.getCurrentUser)

  // Create user object for NavUser component
  const user = React.useMemo(() => {
    if (currentUser === undefined) {
      // Still loading
      return {
        name: "Loading...",
        email: "Loading...",
        avatar: "/avatars/default.jpg",
      }
    }

    if (!currentUser) {
      // No user found (not authenticated or error)
      return {
        name: "Guest User",
        email: "guest@example.com",
        avatar: "/avatars/default.jpg",
      }
    }

    // Extract first name from full name
    const firstName = currentUser.name 
      ? currentUser.name.split(' ')[0] 
      : "User"

    return {
      name: firstName,
      email: currentUser.email || "user@example.com",
      avatar: currentUser.image || "/avatars/default.jpg",
    }
  }, [currentUser])

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <a href="/dashboard">
                <IconInnerShadowTop className="!size-5" />
                <span className="text-base font-semibold">PillFlow</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
    </Sidebar>
  )
}
