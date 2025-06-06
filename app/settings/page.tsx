"use client"

import React, { useState } from "react"
import { useQuery, useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { BackgroundGlow } from "@/components/background-glow"
import { TeamManagement } from "@/components/team-management"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { useRouter } from "next/navigation"
import { useAuthActions } from "@convex-dev/auth/react"

export default function SettingsPage() {
  const currentUser = useQuery(api.myFunctions.getCurrentUser)
  const updateUser = useMutation(api.myFunctions.updateUser)
  const { signOut } = useAuthActions()
  const router = useRouter()
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
  })
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error", text: string } | null>(null)

  // Update form data when user data loads
  React.useEffect(() => {
    if (currentUser) {
      setFormData({
        name: currentUser.name || "",
        email: currentUser.email || "",
      })
    }
  }, [currentUser])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setMessage(null)

    try {
      await updateUser({
        name: formData.name,
        email: formData.email,
      })
      setMessage({ type: "success", text: "Profile updated successfully!" })
    } catch (error) {
      setMessage({ type: "error", text: "Failed to update profile. Please try again." })
      console.error("Update error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      await signOut()
      router.push("/login")
    } catch (error) {
      console.error("Logout failed:", error)
    }
  }

  if (currentUser === undefined) {
    return (
      <SidebarProvider>
        <BackgroundGlow />
        <AppSidebar variant="inset" />
        <SidebarInset>
          <SiteHeader title="Settings" />
          <div className="flex flex-1 items-center justify-center">
            <p>Loading...</p>
          </div>
        </SidebarInset>
      </SidebarProvider>
    )
  }

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <BackgroundGlow />
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader title="Settings" />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              <div className="max-w-2xl mx-auto w-full space-y-6 px-4 lg:px-6">
                <div className="mb-6">
                  <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
                  <p className="text-muted-foreground">
                    Manage your account settings and preferences
                  </p>
                </div>

                {/* Profile Section */}
                <Card>
                  <CardHeader>
                    <CardTitle>Profile</CardTitle>
                    <CardDescription>
                      Update your personal information and profile details.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Avatar Section */}
                    <div className="flex items-center gap-4">
                      <Avatar className="h-20 w-20">
                        <AvatarImage src={currentUser?.image || "/avatars/default.jpg"} />
                        <AvatarFallback className="text-lg">
                          {formData.name ? formData.name.charAt(0).toUpperCase() : "U"}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-medium">Profile Picture</h3>
                        <p className="text-sm text-muted-foreground">
                          Your profile picture is currently managed through your authentication provider.
                        </p>
                      </div>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div className="grid gap-2">
                        <Label htmlFor="name">Full Name</Label>
                        <Input
                          id="name"
                          type="text"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          placeholder="Enter your full name"
                          disabled={isLoading}
                        />
                      </div>

                      <div className="grid gap-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          placeholder="Enter your email"
                          disabled={isLoading}
                        />
                      </div>

                      {message && (
                        <div className={`p-3 rounded-md text-sm ${
                          message.type === "success" 
                            ? "bg-green-50 text-green-800 border border-green-200" 
                            : "bg-red-50 text-red-800 border border-red-200"
                        }`}>
                          {message.text}
                        </div>
                      )}

                      <Button type="submit" disabled={isLoading}>
                        {isLoading ? "Updating..." : "Update Profile"}
                      </Button>
                    </form>
                  </CardContent>
                </Card>

                {/* Account Actions */}
                <TeamManagement />
                
                {/* Account Actions */}
                <Card>
                  <CardHeader>
                    <CardTitle>Account Actions</CardTitle>
                    <CardDescription>
                      Manage your account and session.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button variant="destructive" onClick={handleLogout}>
                      Sign Out
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
} 