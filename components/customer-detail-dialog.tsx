"use client"

import React, { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CalendarIcon, UserIcon, MailIcon, PhoneIcon, MapPinIcon, HashIcon, BarChart3Icon, PillIcon, PackageIcon, CheckSquareIcon, EditIcon } from "lucide-react"
import { useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { toast } from "sonner"
import { Id } from "@/convex/_generated/dataModel"
import { MedicationManagement } from "@/components/medication-management"

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

interface CustomerDetailDialogProps {
  customer: Customer | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onCustomerUpdate: () => void
}

export function CustomerDetailDialog({ customer, open, onOpenChange, onCustomerUpdate }: CustomerDetailDialogProps) {
  const [editFormData, setEditFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    dateOfBirth: "",
    status: "active" as "active" | "in_hospital" | "disabled"
  })
  const [isUpdating, setIsUpdating] = useState(false)
  
  const updateCustomer = useMutation(api.myFunctions.updateCustomer)

  React.useEffect(() => {
    if (customer) {
      setEditFormData({
        firstName: customer.firstName,
        lastName: customer.lastName,
        email: customer.email,
        phone: customer.phone || "",
        address: customer.address || "",
        dateOfBirth: customer.dateOfBirth,
        status: customer.status
      })
    }
  }, [customer])

  const handleUpdateCustomer = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!customer) return

    setIsUpdating(true)
    try {
      await updateCustomer({
        id: customer._id,
        customerId: customer.customerId,
        ...editFormData
      })
      toast.success("Customer updated successfully")
      onCustomerUpdate()
      onOpenChange(false)
    } catch (error) {
      toast.error("Failed to update customer")
      console.error("Update error:", error)
    } finally {
      setIsUpdating(false)
    }
  }

  if (!customer) return null

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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl w-[90vw] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <UserIcon className="h-5 w-5" />
              {customer.firstName} {customer.lastName}
            </div>
            <Badge className={getStatusColor(customer.status)}>
              {customer.status === "in_hospital" ? "In Hospital" : customer.status.charAt(0).toUpperCase() + customer.status.slice(1)}
            </Badge>
          </DialogTitle>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <HashIcon className="h-4 w-4" />
              {customer.customerId}
            </div>
            <div className="flex items-center gap-1">
              <CalendarIcon className="h-4 w-4" />
              {new Date(customer.dateOfBirth).toLocaleDateString()}
            </div>
          </div>
        </DialogHeader>
        
        <Tabs defaultValue="analytics" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="analytics" className="flex items-center gap-1">
              <BarChart3Icon className="h-4 w-4" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="medications" className="flex items-center gap-1">
              <PillIcon className="h-4 w-4" />
              Medications
            </TabsTrigger>
            <TabsTrigger value="collections" className="flex items-center gap-1">
              <PackageIcon className="h-4 w-4" />
              Collections
            </TabsTrigger>
            <TabsTrigger value="packs" className="flex items-center gap-1">
              <CheckSquareIcon className="h-4 w-4" />
              Packs Checked
            </TabsTrigger>
            <TabsTrigger value="edit" className="flex items-center gap-1">
              <EditIcon className="h-4 w-4" />
              Edit
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="analytics" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Total Medications</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">12</div>
                  <p className="text-xs text-muted-foreground">+2 from last month</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Adherence Rate</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">94%</div>
                  <p className="text-xs text-muted-foreground">+5% from last month</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Last Check-in</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">2 days</div>
                  <p className="text-xs text-muted-foreground">ago</p>
                </CardContent>
              </Card>
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Latest medication activities and events</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">Medication taken</p>
                      <p className="text-xs text-muted-foreground">Metformin 500mg - 2 hours ago</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">Pack delivered</p>
                      <p className="text-xs text-muted-foreground">Weekly pack #47 - Yesterday</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">Reminder sent</p>
                      <p className="text-xs text-muted-foreground">Evening medications - 3 days ago</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="medications" className="space-y-4">
            <MedicationManagement customerId={customer._id} />
          </TabsContent>
          
          <TabsContent value="collections" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Collection History</CardTitle>
                <CardDescription>Medication pack collection records</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { date: "2024-06-01", pack: "Weekly Pack #47", status: "Collected", time: "10:30 AM" },
                    { date: "2024-05-25", pack: "Weekly Pack #46", status: "Collected", time: "2:15 PM" },
                    { date: "2024-05-18", pack: "Weekly Pack #45", status: "Missed", time: "-" }
                  ].map((collection, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{collection.pack}</p>
                        <p className="text-sm text-muted-foreground">{collection.date}</p>
                      </div>
                      <div className="text-right">
                        <Badge variant={collection.status === "Collected" ? "default" : "destructive"}>
                          {collection.status}
                        </Badge>
                        {collection.time !== "-" && (
                          <p className="text-xs text-muted-foreground mt-1">{collection.time}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="packs" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Pack Check Status</CardTitle>
                <CardDescription>Weekly medication pack verification</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { week: "Week 47", date: "Jun 1-7, 2024", checked: true, checkedBy: "Pharmacist Jane", time: "09:45 AM" },
                    { week: "Week 46", date: "May 25-31, 2024", checked: true, checkedBy: "Pharmacist Mike", time: "11:20 AM" },
                    { week: "Week 45", date: "May 18-24, 2024", checked: false, checkedBy: "-", time: "-" }
                  ].map((pack, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{pack.week}</p>
                        <p className="text-sm text-muted-foreground">{pack.date}</p>
                      </div>
                      <div className="text-right">
                        <Badge variant={pack.checked ? "default" : "secondary"}>
                          {pack.checked ? "Checked" : "Pending"}
                        </Badge>
                        {pack.checkedBy !== "-" && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {pack.checkedBy} - {pack.time}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="edit" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Edit Customer Details</CardTitle>
                <CardDescription>Update customer information and contact details</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleUpdateCustomer} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name</Label>
                      <Input
                        id="firstName"
                        value={editFormData.firstName}
                        onChange={(e) => setEditFormData({ ...editFormData, firstName: e.target.value })}
                        disabled={isUpdating}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input
                        id="lastName"
                        value={editFormData.lastName}
                        onChange={(e) => setEditFormData({ ...editFormData, lastName: e.target.value })}
                        disabled={isUpdating}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={editFormData.email}
                      onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                      disabled={isUpdating}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      value={editFormData.phone}
                      onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                      disabled={isUpdating}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="address">Address</Label>
                    <Input
                      id="address"
                      value={editFormData.address}
                      onChange={(e) => setEditFormData({ ...editFormData, address: e.target.value })}
                      disabled={isUpdating}
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="dateOfBirth">Date of Birth</Label>
                      <Input
                        id="dateOfBirth"
                        type="date"
                        value={editFormData.dateOfBirth}
                        onChange={(e) => setEditFormData({ ...editFormData, dateOfBirth: e.target.value })}
                        disabled={isUpdating}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="status">Status</Label>
                      <Select
                        value={editFormData.status}
                        onValueChange={(value: "active" | "in_hospital" | "disabled") => 
                          setEditFormData({ ...editFormData, status: value })
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
                  
                  <div className="flex gap-2 pt-4">
                    <Button type="submit" disabled={isUpdating}>
                      {isUpdating ? "Updating..." : "Update Customer"}
                    </Button>
                    <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                      Cancel
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
} 