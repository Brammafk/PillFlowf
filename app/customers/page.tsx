"use client"

import React, { useState } from "react"
import { useQuery, useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { PlusIcon, SearchIcon, CalendarIcon, UserIcon, MailIcon, PhoneIcon, MapPinIcon, HashIcon, EditIcon, TrashIcon } from "lucide-react"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { BackgroundGlow } from "@/components/background-glow"
import { CustomerDetailDialog } from "@/components/customer-detail-dialog"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { toast } from "sonner"
import { Id } from "@/convex/_generated/dataModel"

interface Customer {
  _id: Id<"customers">
  customerId: string
  firstName: string
  lastName: string
  email: string
  phone?: string
  address?: string
  dateOfBirth: string
  status: "active" | "in_hospital" | "disabled"
}

export default function CustomersPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false)
  const [formData, setFormData] = useState({
    customerId: "",
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    dateOfBirth: "",
    status: "active" as "active" | "in_hospital" | "disabled"
  })
  const [isCreating, setIsCreating] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)

  const customers = useQuery(api.myFunctions.getCustomers, {
    search: searchTerm,
    status: statusFilter === "all" ? undefined : statusFilter as "active" | "in_hospital" | "disabled"
  })
  
  const createCustomer = useMutation(api.myFunctions.createCustomer)
  const updateCustomer = useMutation(api.myFunctions.updateCustomer)
  const deleteCustomer = useMutation(api.myFunctions.deleteCustomer)

  const generateCustomerId = () => {
    const timestamp = Date.now()
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
    return `CUST-${timestamp}-${random}`
  }

  const resetForm = () => {
    setFormData({
      customerId: "",
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      address: "",
      dateOfBirth: "",
      status: "active"
    })
  }

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsCreating(true)

    try {
      const customerIdToUse = formData.customerId || generateCustomerId()
      
      await createCustomer({
        customerId: customerIdToUse,
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        dateOfBirth: formData.dateOfBirth,
        status: formData.status
      })
      
      toast.success("Customer created successfully")
      setIsCreateModalOpen(false)
      resetForm()
    } catch (error) {
      toast.error("Failed to create customer")
      console.error("Create error:", error)
    } finally {
      setIsCreating(false)
    }
  }

  const handleUpdateCustomer = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedCustomer) return

    setIsUpdating(true)
    try {
      await updateCustomer({
        id: selectedCustomer._id,
        customerId: formData.customerId,
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        dateOfBirth: formData.dateOfBirth,
        status: formData.status
      })
      toast.success("Customer updated successfully")
      setIsEditModalOpen(false)
      setSelectedCustomer(null)
      resetForm()
    } catch (error) {
      toast.error("Failed to update customer")
      console.error("Update error:", error)
    } finally {
      setIsUpdating(false)
    }
  }

  const handleDeleteCustomer = async (customer: Customer) => {
    if (window.confirm(`Are you sure you want to delete ${customer.firstName} ${customer.lastName}?`)) {
      try {
        await deleteCustomer({ id: customer._id })
        toast.success("Customer deleted successfully")
      } catch (error) {
        toast.error("Failed to delete customer")
        console.error("Delete error:", error)
      }
    }
  }

  const openEditModal = (customer: Customer) => {
    setSelectedCustomer(customer)
    setFormData({
      customerId: customer.customerId,
      firstName: customer.firstName,
      lastName: customer.lastName,
      email: customer.email,
      phone: customer.phone || "",
      address: customer.address || "",
      dateOfBirth: customer.dateOfBirth,
      status: customer.status
    })
    setIsEditModalOpen(true)
  }

  const openDetailDialog = (customer: Customer) => {
    setSelectedCustomer(customer)
    setIsDetailDialogOpen(true)
  }

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "active":
        return "default"
      case "in_hospital":
        return "destructive"
      case "disabled":
        return "secondary"
      default:
        return "secondary"
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800"
      case "in_hospital":
        return "bg-red-100 text-red-800"
      case "disabled":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
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
        <SiteHeader title="Customers" />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              <div className="px-4 lg:px-6">
                {/* Header with consistent style */}
                <div className="mb-6">
                  <h1 className="text-2xl font-bold tracking-tight">Customers</h1>
                  <p className="text-muted-foreground">
                    Manage your customer database
                  </p>
                </div>

                {/* Search and Filter Controls */}
                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                  <div className="relative flex-1">
                    <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                      placeholder="Search customers..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-full sm:w-48">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="in_hospital">In Hospital</SelectItem>
                      <SelectItem value="disabled">Disabled</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
                    <DialogTrigger asChild>
                      <Button className="w-full sm:w-auto">
                        <PlusIcon className="h-4 w-4 mr-2" />
                        Add Customer
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>Add New Customer</DialogTitle>
                      </DialogHeader>
                      <form onSubmit={handleCreateCustomer} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="customerId">Customer ID</Label>
                            <div className="flex gap-2">
                              <Input
                                id="customerId"
                                value={formData.customerId}
                                onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
                                placeholder="Auto-generated if empty"
                                disabled={isCreating}
                              />
                              <Button 
                                type="button" 
                                variant="outline" 
                                onClick={() => setFormData({ ...formData, customerId: generateCustomerId() })}
                                disabled={isCreating}
                              >
                                Generate
                              </Button>
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="status">Status</Label>
                            <Select 
                              value={formData.status} 
                              onValueChange={(value: "active" | "in_hospital" | "disabled") => 
                                setFormData({ ...formData, status: value })
                              }
                              disabled={isCreating}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="active">Active</SelectItem>
                                <SelectItem value="in_hospital">In Hospital</SelectItem>
                                <SelectItem value="disabled">Disabled</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="firstName">First Name</Label>
                            <Input
                              id="firstName"
                              value={formData.firstName}
                              onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                              required
                              disabled={isCreating}
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="lastName">Last Name</Label>
                            <Input
                              id="lastName"
                              value={formData.lastName}
                              onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                              required
                              disabled={isCreating}
                            />
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="email">Email</Label>
                          <Input
                            id="email"
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            required
                            disabled={isCreating}
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="phone">Phone</Label>
                          <Input
                            id="phone"
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            required
                            disabled={isCreating}
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="address">Address</Label>
                          <Input
                            id="address"
                            value={formData.address}
                            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                            required
                            disabled={isCreating}
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="dateOfBirth">Date of Birth</Label>
                          <Input
                            id="dateOfBirth"
                            type="date"
                            value={formData.dateOfBirth}
                            onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                            required
                            disabled={isCreating}
                          />
                        </div>
                        
                        <div className="flex gap-2 pt-4">
                          <Button type="submit" disabled={isCreating}>
                            {isCreating ? "Creating..." : "Create Customer"}
                          </Button>
                          <Button type="button" variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                            Cancel
                          </Button>
                        </div>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>

                {/* Customer Grid */}
                {customers === undefined ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <Card key={i} className="animate-pulse">
                        <CardHeader>
                          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            <div className="h-3 bg-gray-200 rounded"></div>
                            <div className="h-3 bg-gray-200 rounded w-5/6"></div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : customers.length === 0 ? (
                  <div className="text-center py-12">
                    <UserIcon className="mx-auto h-12 w-12 text-muted-foreground" />
                    <h3 className="mt-2 text-sm font-semibold text-gray-900">No customers</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      {searchTerm || statusFilter !== "all" 
                        ? "No customers match your search criteria."
                        : "Get started by creating your first customer."
                      }
                    </p>
                    {!searchTerm && statusFilter === "all" && (
                      <div className="mt-6">
                        <Button onClick={() => setIsCreateModalOpen(true)}>
                          <PlusIcon className="h-4 w-4 mr-2" />
                          Add Customer
                        </Button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {customers.map((customer) => (
                      <Card 
                        key={customer._id} 
                        className="hover:shadow-md transition-shadow cursor-pointer"
                        onClick={() => openDetailDialog(customer)}
                      >
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <div>
                              <CardTitle className="text-lg font-semibold">
                                {customer.firstName} {customer.lastName}
                              </CardTitle>
                              <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                                <HashIcon className="h-3 w-3" />
                                {customer.customerId}
                              </div>
                            </div>
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  openEditModal(customer)
                                }}
                                className="h-8 w-8 p-0"
                              >
                                <EditIcon className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleDeleteCustomer(customer)
                                }}
                                className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                              >
                                <TrashIcon className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                          <Badge className={getStatusColor(customer.status)}>
                            {customer.status === "in_hospital" ? "In Hospital" : customer.status.charAt(0).toUpperCase() + customer.status.slice(1)}
                          </Badge>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          <div className="flex items-center gap-2 text-sm">
                            <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                            <span>{new Date(customer.dateOfBirth).toLocaleDateString()}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <MailIcon className="h-4 w-4 text-muted-foreground" />
                            <span className="truncate">{customer.email}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <PhoneIcon className="h-4 w-4 text-muted-foreground" />
                            <span>{customer.phone || "No phone"}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <MapPinIcon className="h-4 w-4 text-muted-foreground" />
                            <span className="truncate">{customer.address || "No address"}</span>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>

      {/* Edit Customer Dialog */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Customer</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdateCustomer} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-customerId">Customer ID</Label>
                <Input
                  id="edit-customerId"
                  value={formData.customerId}
                  onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
                  disabled={isUpdating}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-status">Status</Label>
                <Select 
                  value={formData.status} 
                  onValueChange={(value: "active" | "in_hospital" | "disabled") => 
                    setFormData({ ...formData, status: value })
                  }
                  disabled={isUpdating}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="in_hospital">In Hospital</SelectItem>
                    <SelectItem value="disabled">Disabled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-firstName">First Name</Label>
                <Input
                  id="edit-firstName"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  required
                  disabled={isUpdating}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-lastName">Last Name</Label>
                <Input
                  id="edit-lastName"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  required
                  disabled={isUpdating}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-email">Email</Label>
              <Input
                id="edit-email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                disabled={isUpdating}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-phone">Phone</Label>
              <Input
                id="edit-phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                required
                disabled={isUpdating}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-address">Address</Label>
              <Input
                id="edit-address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                required
                disabled={isUpdating}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-dateOfBirth">Date of Birth</Label>
              <Input
                id="edit-dateOfBirth"
                type="date"
                value={formData.dateOfBirth}
                onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                required
                disabled={isUpdating}
              />
            </div>
            
            <div className="flex gap-2 pt-4">
              <Button type="submit" disabled={isUpdating}>
                {isUpdating ? "Updating..." : "Update Customer"}
              </Button>
              <Button type="button" variant="outline" onClick={() => setIsEditModalOpen(false)}>
                Cancel
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Customer Detail Dialog */}
      <CustomerDetailDialog
        customer={selectedCustomer}
        open={isDetailDialogOpen}
        onOpenChange={setIsDetailDialogOpen}
        onCustomerUpdate={() => {
          // This will trigger a re-fetch of the customers list
          // since we're using useQuery, it will automatically update
        }}
      />
    </SidebarProvider>
  )
} 