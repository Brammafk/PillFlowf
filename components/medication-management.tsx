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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Pill, Plus, Edit2, Trash2, ToggleLeft, ToggleRight, Table, List } from "lucide-react"
import { toast } from "sonner"

interface Medication {
  _id: Id<"medications">
  name: string
  form: "tablet" | "capsule" | "liquid" | "injection" | "cream" | "inhaler" | "patch" | "other"
  strength: string
  frequency: {
    morning?: number
    afternoon?: number
    evening?: number
    night?: number
  }
  instructions?: string
  startDate: string
  endDate?: string
  isActive: boolean
  createdAt: number
  updatedAt: number
}

interface MedicationManagementProps {
  customerId: Id<"customers">
}

export function MedicationManagement({ customerId }: MedicationManagementProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingMedication, setEditingMedication] = useState<Medication | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    form: "tablet" as Medication["form"],
    strength: "",
    frequency: {
      morning: "",
      afternoon: "",
      evening: "",
      night: "",
    } as Record<string, string>,
    instructions: "",
    startDate: new Date().toISOString().split("T")[0],
    endDate: "",
  })
  const [viewMode, setViewMode] = useState<'list' | 'schedule'>('list')

  const medications = useQuery(api.myFunctions.getCustomerMedications, { customerId })
  const createMedication = useMutation(api.myFunctions.createMedication)
  const updateMedication = useMutation(api.myFunctions.updateMedication)
  const deleteMedication = useMutation(api.myFunctions.deleteMedication)
  const toggleMedicationStatus = useMutation(api.myFunctions.toggleMedicationStatus)

  const resetForm = () => {
    setFormData({
      name: "",
      form: "tablet",
      strength: "",
      frequency: {
        morning: "",
        afternoon: "",
        evening: "",
        night: "",
      },
      instructions: "",
      startDate: new Date().toISOString().split("T")[0],
      endDate: "",
    })
  }

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim() || !formData.strength.trim()) {
      toast.error("Name and strength are required")
      return
    }
    if (!['morning', 'afternoon', 'evening', 'night'].some(time => formData.frequency[time] && !isNaN(Number(formData.frequency[time])) && Number(formData.frequency[time]) > 0)) {
      toast.error("Enter at least one valid frequency value")
      return
    }
    try {
      await createMedication({
        customerId,
        name: formData.name.trim(),
        form: formData.form,
        strength: formData.strength.trim(),
        frequency: {
          morning: formData.frequency.morning ? Number(formData.frequency.morning) : undefined,
          afternoon: formData.frequency.afternoon ? Number(formData.frequency.afternoon) : undefined,
          evening: formData.frequency.evening ? Number(formData.frequency.evening) : undefined,
          night: formData.frequency.night ? Number(formData.frequency.night) : undefined,
        },
        instructions: formData.instructions.trim() || undefined,
        startDate: formData.startDate,
        endDate: formData.endDate || undefined,
      })
      toast.success("Medication added successfully")
      setIsAddDialogOpen(false)
      resetForm()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to add medication")
    }
  }

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingMedication || !formData.name.trim() || !formData.strength.trim()) {
      toast.error("Name and strength are required")
      return
    }
    if (!['morning', 'afternoon', 'evening', 'night'].some(time => formData.frequency[time] && !isNaN(Number(formData.frequency[time])) && Number(formData.frequency[time]) > 0)) {
      toast.error("Enter at least one valid frequency value")
      return
    }
    try {
      await updateMedication({
        id: editingMedication._id,
        name: formData.name.trim(),
        form: formData.form,
        strength: formData.strength.trim(),
        frequency: {
          morning: formData.frequency.morning ? Number(formData.frequency.morning) : undefined,
          afternoon: formData.frequency.afternoon ? Number(formData.frequency.afternoon) : undefined,
          evening: formData.frequency.evening ? Number(formData.frequency.evening) : undefined,
          night: formData.frequency.night ? Number(formData.frequency.night) : undefined,
        },
        instructions: formData.instructions.trim() || undefined,
        startDate: formData.startDate,
        endDate: formData.endDate || undefined,
        isActive: editingMedication.isActive,
      })
      toast.success("Medication updated successfully")
      setIsEditDialogOpen(false)
      setEditingMedication(null)
      resetForm()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update medication")
    }
  }

  const handleDelete = async (id: Id<"medications">) => {
    if (!confirm("Are you sure you want to delete this medication?")) {
      return
    }

    try {
      await deleteMedication({ id })
      toast.success("Medication deleted successfully")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete medication")
    }
  }

  const handleToggleStatus = async (id: Id<"medications">) => {
    try {
      await toggleMedicationStatus({ id })
      toast.success("Medication status updated")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update status")
    }
  }

  const openEditDialog = (medication: Medication) => {
    setEditingMedication(medication)
    setFormData({
      name: medication.name,
      form: medication.form,
      strength: medication.strength,
      frequency: {
        morning: medication.frequency.morning?.toString() || "",
        afternoon: medication.frequency.afternoon?.toString() || "",
        evening: medication.frequency.evening?.toString() || "",
        night: medication.frequency.night?.toString() || "",
      },
      instructions: medication.instructions || "",
      startDate: medication.startDate,
      endDate: medication.endDate || "",
    })
    setIsEditDialogOpen(true)
  }

  if (medications === undefined) {
    return <div>Loading medications...</div>
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Pill className="h-5 w-5" />
            Medications
          </div>
          <Button
            variant="ghost"
            size="icon"
            aria-label={viewMode === 'list' ? 'Switch to schedule view' : 'Switch to list view'}
            onClick={() => setViewMode(viewMode === 'list' ? 'schedule' : 'list')}
          >
            {viewMode === 'list' ? <Table className="h-5 w-5" /> : <List className="h-5 w-5" />}
          </Button>
        </div>
        <CardDescription>
          {viewMode === 'list'
            ? 'Manage customer medications and dosages'
            : 'Visualize medication schedule by time of day'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex justify-between items-center mb-6">
          <p className="text-sm text-muted-foreground">
            {medications.length} medication{medications.length !== 1 ? 's' : ''}
          </p>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => resetForm()}>
                <Plus className="h-4 w-4 mr-2" />
                Add Medication
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl w-full">
              <DialogHeader>
                <DialogTitle>Add Medication</DialogTitle>
                <DialogDescription>
                  Add a new medication for this customer
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAdd}>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="name" className="text-right">
                      Name *
                    </Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      className="col-span-3"
                      placeholder="e.g., Amoxicillin"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="form" className="text-right">
                      Form *
                    </Label>
                    <Select
                      value={formData.form}
                      onValueChange={(value: Medication["form"]) => setFormData(prev => ({ ...prev, form: value }))}
                    >
                      <SelectTrigger className="col-span-3">
                        <SelectValue placeholder="Select form" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="tablet">Tablet</SelectItem>
                        <SelectItem value="capsule">Capsule</SelectItem>
                        <SelectItem value="liquid">Liquid</SelectItem>
                        <SelectItem value="injection">Injection</SelectItem>
                        <SelectItem value="cream">Cream</SelectItem>
                        <SelectItem value="inhaler">Inhaler</SelectItem>
                        <SelectItem value="patch">Patch</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="strength" className="text-right">
                      Strength *
                    </Label>
                    <Input
                      id="strength"
                      value={formData.strength}
                      onChange={(e) => setFormData(prev => ({ ...prev, strength: e.target.value }))}
                      className="col-span-3"
                      placeholder="e.g., 500mg"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label className="text-right">
                      Frequency
                    </Label>
                    <div className="col-span-3">
                      <div className="grid grid-cols-4 gap-4 w-full">
                        {['morning', 'afternoon', 'evening', 'night'].map((time) => (
                          <div key={time} className="flex flex-col items-center w-full">
                            <span className="text-xs font-medium mb-1 capitalize">{time}</span>
                            <Input
                              type="number"
                              step="any"
                              min="0"
                              placeholder="-"
                              value={formData.frequency[time]}
                              onChange={e => {
                                const val = e.target.value
                                setFormData(prev => ({
                                  ...prev,
                                  frequency: { ...prev.frequency, [time]: val }
                                }))
                              }}
                              className="w-24 text-center"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="instructions" className="text-right">
                      Instructions
                    </Label>
                    <Input
                      id="instructions"
                      value={formData.instructions}
                      onChange={(e) => setFormData(prev => ({ ...prev, instructions: e.target.value }))}
                      className="col-span-3"
                      placeholder="e.g., Take with food"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="startDate" className="text-right">
                      Start Date *
                    </Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                      className="col-span-3"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="endDate" className="text-right">
                      End Date
                    </Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={formData.endDate}
                      onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                      className="col-span-3"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">Add Medication</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {medications.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Pill className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No medications added yet</p>
            <p className="text-sm">Click "Add Medication" to get started</p>
          </div>
        ) : viewMode === 'list' ? (
          <div className="space-y-4">
            {medications.map((medication) => (
              <div key={medication._id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                    <Pill className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-medium">{medication.name}</h4>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>{medication.form}</span>
                      <span>•</span>
                      <span>{medication.strength}</span>
                      <span>•</span>
                      <span>
                        {(['morning', 'afternoon', 'evening', 'night'] as const)
                          .filter(time => (medication.frequency as Record<string, number | undefined>)[time] && (medication.frequency as Record<string, number | undefined>)[time]! > 0)
                          .map(time => `${(medication.frequency as Record<string, number | undefined>)[time]} ${time.charAt(0).toUpperCase() + time.slice(1)}`)
                          .join(', ')
                        }
                      </span>
                    </div>
                    {medication.instructions && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {medication.instructions}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={medication.isActive ? "default" : "secondary"}>
                    {medication.isActive ? "Active" : "Inactive"}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleToggleStatus(medication._id)}
                  >
                    {medication.isActive ? (
                      <ToggleRight className="h-4 w-4" />
                    ) : (
                      <ToggleLeft className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openEditDialog(medication)}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(medication._id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full border text-sm">
              <thead>
                <tr className="bg-muted">
                  <th className="px-3 py-2 text-left font-semibold">Medication</th>
                  <th className="px-3 py-2 text-center font-semibold">Morning</th>
                  <th className="px-3 py-2 text-center font-semibold">Afternoon</th>
                  <th className="px-3 py-2 text-center font-semibold">Evening</th>
                  <th className="px-3 py-2 text-center font-semibold">Night</th>
                  <th className="px-3 py-2 text-center font-semibold">Status</th>
                  <th className="px-3 py-2 text-center font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {medications.map((medication) => (
                  <tr key={medication._id} className="border-b">
                    <td className="px-3 py-2 whitespace-nowrap">
                      <div className="font-medium">{medication.name}</div>
                      <div className="text-xs text-muted-foreground">{medication.strength} {medication.form}</div>
                      {medication.instructions && (
                        <div className="text-xs text-muted-foreground italic">{medication.instructions}</div>
                      )}
                    </td>
                    {(['morning', 'afternoon', 'evening', 'night'] as const).map((time) => (
                      <td key={time} className="px-3 py-2 text-center">
                        {(medication.frequency as Record<string, number | undefined>)[time] ? (
                          <span className="font-semibold">
                            {(medication.frequency as Record<string, number | undefined>)[time]}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </td>
                    ))}
                    <td className="px-3 py-2 text-center">
                      <Badge variant={medication.isActive ? "default" : "secondary"}>
                        {medication.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </td>
                    <td className="px-3 py-2 text-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleStatus(medication._id)}
                        className="mr-1"
                      >
                        {medication.isActive ? (
                          <ToggleRight className="h-4 w-4" />
                        ) : (
                          <ToggleLeft className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditDialog(medication)}
                        className="mr-1"
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(medication._id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-3xl w-full">
            <DialogHeader>
              <DialogTitle>Edit Medication</DialogTitle>
              <DialogDescription>
                Update medication information
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleEdit}>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-name" className="text-right">
                    Name *
                  </Label>
                  <Input
                    id="edit-name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="col-span-3"
                    placeholder="e.g., Amoxicillin"
                    required
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-form" className="text-right">
                    Form *
                  </Label>
                  <Select
                    value={formData.form}
                    onValueChange={(value: Medication["form"]) => setFormData(prev => ({ ...prev, form: value }))}
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Select form" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="tablet">Tablet</SelectItem>
                      <SelectItem value="capsule">Capsule</SelectItem>
                      <SelectItem value="liquid">Liquid</SelectItem>
                      <SelectItem value="injection">Injection</SelectItem>
                      <SelectItem value="cream">Cream</SelectItem>
                      <SelectItem value="inhaler">Inhaler</SelectItem>
                      <SelectItem value="patch">Patch</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-strength" className="text-right">
                    Strength *
                  </Label>
                  <Input
                    id="edit-strength"
                    value={formData.strength}
                    onChange={(e) => setFormData(prev => ({ ...prev, strength: e.target.value }))}
                    className="col-span-3"
                    placeholder="e.g., 500mg"
                    required
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right">
                    Frequency
                  </Label>
                  <div className="col-span-3">
                    <div className="grid grid-cols-4 gap-4 w-full">
                      {['morning', 'afternoon', 'evening', 'night'].map((time) => (
                        <div key={time} className="flex flex-col items-center w-full">
                          <span className="text-xs font-medium mb-1 capitalize">{time}</span>
                          <Input
                            type="number"
                            step="any"
                            min="0"
                            placeholder="-"
                            value={formData.frequency[time]}
                            onChange={e => {
                              const val = e.target.value
                              setFormData(prev => ({
                                ...prev,
                                frequency: { ...prev.frequency, [time]: val }
                              }))
                            }}
                            className="w-24 text-center"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-instructions" className="text-right">
                    Instructions
                  </Label>
                  <Input
                    id="edit-instructions"
                    value={formData.instructions}
                    onChange={(e) => setFormData(prev => ({ ...prev, instructions: e.target.value }))}
                    className="col-span-3"
                    placeholder="e.g., Take with food"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-startDate" className="text-right">
                    Start Date *
                  </Label>
                  <Input
                    id="edit-startDate"
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                    className="col-span-3"
                    required
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-endDate" className="text-right">
                    End Date
                  </Label>
                  <Input
                    id="edit-endDate"
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                    className="col-span-3"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Update Medication</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
} 