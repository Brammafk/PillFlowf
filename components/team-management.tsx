"use client"

import { useState } from "react"
import { useQuery, useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Users, Plus, Edit2, Trash2, ToggleLeft, ToggleRight } from "lucide-react"
import { toast } from "sonner"

interface TeamMember {
  _id: Id<"teamMembers">
  initials: string
  fullName: string
  email?: string
  role?: string
  isActive: boolean
  createdAt: number
  updatedAt: number
}

export function TeamManagement() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null)
  const [formData, setFormData] = useState({
    initials: "",
    fullName: "",
    email: "",
    role: ""
  })

  const teamMembers = useQuery(api.myFunctions.getTeamMembers)
  const createTeamMember = useMutation(api.myFunctions.createTeamMember)
  const updateTeamMember = useMutation(api.myFunctions.updateTeamMember)
  const deleteTeamMember = useMutation(api.myFunctions.deleteTeamMember)
  const toggleTeamMemberStatus = useMutation(api.myFunctions.toggleTeamMemberStatus)

  const resetForm = () => {
    setFormData({
      initials: "",
      fullName: "",
      email: "",
      role: ""
    })
  }

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.initials.trim() || !formData.fullName.trim()) {
      toast.error("Initials and full name are required")
      return
    }

    try {
      await createTeamMember({
        initials: formData.initials.trim(),
        fullName: formData.fullName.trim(),
        email: formData.email.trim() || undefined,
        role: formData.role.trim() || undefined,
      })
      
      toast.success("Team member added successfully")
      setIsAddDialogOpen(false)
      resetForm()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to add team member")
    }
  }

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!editingMember || !formData.initials.trim() || !formData.fullName.trim()) {
      toast.error("Initials and full name are required")
      return
    }

    try {
      await updateTeamMember({
        id: editingMember._id,
        initials: formData.initials.trim(),
        fullName: formData.fullName.trim(),
        email: formData.email.trim() || undefined,
        role: formData.role.trim() || undefined,
        isActive: editingMember.isActive,
      })
      
      toast.success("Team member updated successfully")
      setIsEditDialogOpen(false)
      setEditingMember(null)
      resetForm()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update team member")
    }
  }

  const handleDelete = async (id: Id<"teamMembers">) => {
    if (!confirm("Are you sure you want to delete this team member?")) {
      return
    }

    try {
      await deleteTeamMember({ id })
      toast.success("Team member deleted successfully")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete team member")
    }
  }

  const handleToggleStatus = async (id: Id<"teamMembers">) => {
    try {
      await toggleTeamMemberStatus({ id })
      toast.success("Team member status updated")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update status")
    }
  }

  const openEditDialog = (member: TeamMember) => {
    setEditingMember(member)
    setFormData({
      initials: member.initials,
      fullName: member.fullName,
      email: member.email || "",
      role: member.role || ""
    })
    setIsEditDialogOpen(true)
  }

  if (teamMembers === undefined) {
    return <div>Loading team members...</div>
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Team Management
        </CardTitle>
        <CardDescription>
          Manage your team members and their access to the system
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex justify-between items-center mb-6">
          <p className="text-sm text-muted-foreground">
            {teamMembers.length} team member{teamMembers.length !== 1 ? 's' : ''}
          </p>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => resetForm()}>
                <Plus className="h-4 w-4 mr-2" />
                Add Team Member
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Team Member</DialogTitle>
                <DialogDescription>
                  Add a new team member to your account. Initials must be 2-3 letters.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAdd}>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="initials" className="text-right">
                      Initials *
                    </Label>
                    <Input
                      id="initials"
                      value={formData.initials}
                      onChange={(e) => setFormData(prev => ({ ...prev, initials: e.target.value }))}
                      className="col-span-3"
                      placeholder="e.g., JD"
                      maxLength={3}
                      required
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="fullName" className="text-right">
                      Full Name *
                    </Label>
                    <Input
                      id="fullName"
                      value={formData.fullName}
                      onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                      className="col-span-3"
                      placeholder="e.g., John Doe"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="email" className="text-right">
                      Email
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      className="col-span-3"
                      placeholder="john.doe@example.com"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="role" className="text-right">
                      Role
                    </Label>
                    <Input
                      id="role"
                      value={formData.role}
                      onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
                      className="col-span-3"
                      placeholder="e.g., Pharmacist, Technician"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">Add Team Member</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {teamMembers.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No team members added yet</p>
            <p className="text-sm">Click "Add Team Member" to get started</p>
          </div>
        ) : (
          <div className="space-y-4">
            {teamMembers.map((member) => (
              <div key={member._id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center font-semibold text-primary">
                    {member.initials}
                  </div>
                  <div>
                    <h4 className="font-medium">{member.fullName}</h4>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      {member.email && <span>{member.email}</span>}
                      {member.role && (
                        <>
                          {member.email && <span>•</span>}
                          <span>{member.role}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={member.isActive ? "default" : "secondary"}>
                    {member.isActive ? "Active" : "Inactive"}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleToggleStatus(member._id)}
                  >
                    {member.isActive ? (
                      <ToggleRight className="h-4 w-4" />
                    ) : (
                      <ToggleLeft className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openEditDialog(member)}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(member._id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Team Member</DialogTitle>
              <DialogDescription>
                Update team member information. Initials must be 2-3 letters.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleEdit}>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-initials" className="text-right">
                    Initials *
                  </Label>
                  <Input
                    id="edit-initials"
                    value={formData.initials}
                    onChange={(e) => setFormData(prev => ({ ...prev, initials: e.target.value }))}
                    className="col-span-3"
                    placeholder="e.g., JD"
                    maxLength={3}
                    required
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-fullName" className="text-right">
                    Full Name *
                  </Label>
                  <Input
                    id="edit-fullName"
                    value={formData.fullName}
                    onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                    className="col-span-3"
                    placeholder="e.g., John Doe"
                    required
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-email" className="text-right">
                    Email
                  </Label>
                  <Input
                    id="edit-email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    className="col-span-3"
                    placeholder="john.doe@example.com"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-role" className="text-right">
                    Role
                  </Label>
                  <Input
                    id="edit-role"
                    value={formData.role}
                    onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
                    className="col-span-3"
                    placeholder="e.g., Pharmacist, Technician"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Update Team Member</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
} 