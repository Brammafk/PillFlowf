"use client";

import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { toast } from "sonner";
import { Id } from "@/convex/_generated/dataModel";

export function PackCheckForm() {
  // Step state
  const [step, setStep] = useState(1);

  // Step 1 form state
  const [customerId, setCustomerId] = useState<string>("");
  const [websterPackId, setWebsterPackId] = useState("");
  const [packType, setPackType] = useState<"blister_packs" | "sachet_rolls">("blister_packs");
  const [pharmacistInitials, setPharmacistInitials] = useState("");
  const [notes, setNotes] = useState("");

  // Search states
  const [customerSearch, setCustomerSearch] = useState("");
  const [pharmacistSearch, setPharmacistSearch] = useState("");

  // Step 2 state
  const [checkedMedications, setCheckedMedications] = useState<any[]>([]);

  // Step 3 state
  const [finalInitials, setFinalInitials] = useState("");
  const [finalNotes, setFinalNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Data
  const customers = useQuery(api.myFunctions.getCustomers, {});
  const teamMembers = useQuery(api.myFunctions.getTeamMembers);
  const medications = useQuery(
    api.myFunctions.getCustomerMedications,
    customerId
      ? { customerId: customerId as Id<"customers"> }
      : "skip"
  );
  const createPackCheck = useMutation(api.myFunctions.createPackCheck);

  // Step 1: handle next
  const handleStep1Next = () => {
    if (!customerId || !websterPackId || !pharmacistInitials) {
      toast.error("Please fill all required fields.");
      return;
    }
    if (!medications || medications.length === 0) {
      toast.error("No medications found for this customer.");
      return;
    }
    
    // Create separate entries for each time slot
    const medicationEntries: any[] = [];
    medications.forEach((med: any) => {
      if (med.frequency.morning && med.frequency.morning > 0) {
        medicationEntries.push({
          medicationId: med._id,
          name: med.name,
          form: med.form,
          strength: med.strength,
          timeSlot: 'morning',
          quantity: med.frequency.morning,
          morning: med.frequency.morning,
          afternoon: 0,
          evening: 0,
          night: 0,
          correct: true,
          comment: "",
        });
      }
      if (med.frequency.afternoon && med.frequency.afternoon > 0) {
        medicationEntries.push({
          medicationId: med._id,
          name: med.name,
          form: med.form,
          strength: med.strength,
          timeSlot: 'afternoon',
          quantity: med.frequency.afternoon,
          morning: 0,
          afternoon: med.frequency.afternoon,
          evening: 0,
          night: 0,
          correct: true,
          comment: "",
        });
      }
      if (med.frequency.evening && med.frequency.evening > 0) {
        medicationEntries.push({
          medicationId: med._id,
          name: med.name,
          form: med.form,
          strength: med.strength,
          timeSlot: 'evening',
          quantity: med.frequency.evening,
          morning: 0,
          afternoon: 0,
          evening: med.frequency.evening,
          night: 0,
          correct: true,
          comment: "",
        });
      }
      if (med.frequency.night && med.frequency.night > 0) {
        medicationEntries.push({
          medicationId: med._id,
          name: med.name,
          form: med.form,
          strength: med.strength,
          timeSlot: 'night',
          quantity: med.frequency.night,
          morning: 0,
          afternoon: 0,
          evening: 0,
          night: med.frequency.night,
          correct: true,
          comment: "",
        });
      }
    });
    
    setCheckedMedications(medicationEntries);
    setStep(2);
  };

  // Step 2: handle next
  const handleStep2Next = () => {
    setStep(3);
  };

  // Step 3: handle submit
  const handleSubmit = async () => {
    if (!finalInitials) {
      toast.error("Please select your initials to confirm.");
      return;
    }
    setIsSubmitting(true);
    
    // Clean the checked medications data - remove UI-only fields
    const cleanedMedications = checkedMedications.map(med => ({
      medicationId: med.medicationId,
      name: med.name,
      form: med.form,
      strength: med.strength,
      morning: med.morning,
      afternoon: med.afternoon,
      evening: med.evening,
      night: med.night,
      correct: med.correct,
      comment: med.comment,
    }));
    
    try {
      await createPackCheck({
        customerId: customerId as Id<"customers">,
        pharmacistInitials,
        websterPackId,
        packType,
        notes: notes || finalNotes,
        checkedMedications: cleanedMedications,
        status: "checked",
      });
      toast.success("Pack check saved!");
      setStep(1);
      setCustomerId("");
      setWebsterPackId("");
      setPackType("blister_packs");
      setPharmacistInitials("");
      setNotes("");
      setCheckedMedications([]);
      setFinalInitials("");
      setFinalNotes("");
    } catch (e) {
      toast.error("Failed to save pack check.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Step 2: handle medication check
  const handleMedicationCheck = (idx: number, correct: boolean) => {
    setCheckedMedications((prev) =>
      prev.map((med, i) => (i === idx ? { ...med, correct } : med))
    );
  };
  const handleMedicationComment = (idx: number, comment: string) => {
    setCheckedMedications((prev) =>
      prev.map((med, i) => (i === idx ? { ...med, comment } : med))
    );
  };

  return (
    <div>
      {step === 1 && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleStep1Next();
          }}
          className="space-y-6"
        >
          <div>
            <Label>Patient Search</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  className="w-full justify-between"
                >
                  {customerId && customers
                    ? (() => {
                        const selectedCustomer = customers.find((customer: any) => customer._id === customerId);
                        return selectedCustomer 
                          ? `${selectedCustomer.firstName} ${selectedCustomer.lastName} (${selectedCustomer.customerId})`
                          : "Select patient...";
                      })()
                    : "Select patient..."}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0">
                <Command>
                  <CommandInput placeholder="Search patients..." />
                  <CommandEmpty>No patient found.</CommandEmpty>
                  <CommandGroup>
                    {customers && customers.map((customer: any) => (
                      <CommandItem
                        key={customer._id}
                        value={`${customer.firstName} ${customer.lastName} ${customer.customerId}`}
                        onSelect={() => {
                          setCustomerId(customer._id);
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            customerId === customer._id ? "opacity-100" : "opacity-0"
                          )}
                        />
                        {customer.firstName} {customer.lastName} ({customer.customerId})
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </Command>
              </PopoverContent>
            </Popover>
          </div>
          <div>
            <Label>Pharmacist Initials</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  className="w-full justify-between"
                >
                  {pharmacistInitials && teamMembers
                    ? (() => {
                        const selectedMember = teamMembers.find((member: any) => member.initials === pharmacistInitials);
                        return selectedMember 
                          ? `${selectedMember.initials} - ${selectedMember.fullName}`
                          : "Select pharmacist...";
                      })()
                    : "Select pharmacist..."}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0">
                <Command>
                  <CommandInput placeholder="Search pharmacists..." />
                  <CommandEmpty>No pharmacist found.</CommandEmpty>
                  <CommandGroup>
                    {teamMembers && teamMembers.filter((member: any) => member.isActive).map((member: any) => (
                      <CommandItem
                        key={member._id}
                        value={`${member.initials} ${member.fullName}`}
                        onSelect={() => {
                          setPharmacistInitials(member.initials);
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            pharmacistInitials === member.initials ? "opacity-100" : "opacity-0"
                          )}
                        />
                        {member.initials} - {member.fullName}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </Command>
              </PopoverContent>
            </Popover>
          </div>
          <div>
            <Label>Webster Pack ID</Label>
            <Input
              value={websterPackId}
              onChange={(e) => setWebsterPackId(e.target.value)}
              placeholder="Enter pack ID or barcode"
              required
            />
          </div>
          <div>
            <Label>Pack Type</Label>
            <Select value={packType} onValueChange={(value) => setPackType(value as "blister_packs" | "sachet_rolls")}>
              <SelectTrigger>
                <SelectValue placeholder="Select pack type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="blister_packs">Blister Packs</SelectItem>
                <SelectItem value="sachet_rolls">Sachet Rolls</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Check Notes (Optional)</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Enter any notes about this check"
            />
          </div>
          <Button type="submit" className="w-full">
            Next: Check Medications
          </Button>
        </form>
      )}
      {step === 2 && (
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-2">Check Medications</h3>
            <p className="text-muted-foreground mb-4">Review and check each medication in the pack.</p>
            
            {/* Time-based medication layout */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Morning */}
              <div className="space-y-3">
                <h4 className="font-medium text-center p-2 bg-yellow-50 rounded-lg text-yellow-800">
                  Morning
                </h4>
                {checkedMedications
                  .filter(med => med.timeSlot === 'morning')
                  .map((med, idx) => {
                    const globalIdx = checkedMedications.findIndex(m => m.medicationId === med.medicationId && m.timeSlot === med.timeSlot);
                    return (
                      <Card key={`${med.medicationId}-${med.timeSlot}`} className="p-3">
                        <div className="space-y-2">
                          <div className="font-medium text-sm">{med.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {med.strength} {med.form}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Quantity: {med.quantity}
                          </div>
                          
                          <div className="space-y-2">
                            <Label className="text-xs">Correct?</Label>
                            <div className="flex gap-1">
                              <Button
                                type="button"
                                size="sm"
                                variant={med.correct ? "default" : "outline"}
                                onClick={() => handleMedicationCheck(globalIdx, true)}
                                className="flex-1 text-xs"
                              >
                                Yes
                              </Button>
                              <Button
                                type="button"
                                size="sm"
                                variant={!med.correct ? "destructive" : "outline"}
                                onClick={() => handleMedicationCheck(globalIdx, false)}
                                className="flex-1 text-xs"
                              >
                                No
                              </Button>
                            </div>
                            <Input
                              value={med.comment}
                              onChange={e => handleMedicationComment(globalIdx, e.target.value)}
                              placeholder="Comment"
                              className="text-xs"
                            />
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                {checkedMedications.filter(med => med.timeSlot === 'morning').length === 0 && (
                  <div className="text-xs text-muted-foreground text-center p-4 border-2 border-dashed rounded">
                    No morning medications
                  </div>
                )}
              </div>

              {/* Afternoon */}
              <div className="space-y-3">
                <h4 className="font-medium text-center p-2 bg-orange-50 rounded-lg text-orange-800">
                  Afternoon
                </h4>
                {checkedMedications
                  .filter(med => med.timeSlot === 'afternoon')
                  .map((med, idx) => {
                    const globalIdx = checkedMedications.findIndex(m => m.medicationId === med.medicationId && m.timeSlot === med.timeSlot);
                    return (
                      <Card key={`${med.medicationId}-${med.timeSlot}`} className="p-3">
                        <div className="space-y-2">
                          <div className="font-medium text-sm">{med.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {med.strength} {med.form}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Quantity: {med.quantity}
                          </div>
                          
                          <div className="space-y-2">
                            <Label className="text-xs">Correct?</Label>
                            <div className="flex gap-1">
                              <Button
                                type="button"
                                size="sm"
                                variant={med.correct ? "default" : "outline"}
                                onClick={() => handleMedicationCheck(globalIdx, true)}
                                className="flex-1 text-xs"
                              >
                                Yes
                              </Button>
                              <Button
                                type="button"
                                size="sm"
                                variant={!med.correct ? "destructive" : "outline"}
                                onClick={() => handleMedicationCheck(globalIdx, false)}
                                className="flex-1 text-xs"
                              >
                                No
                              </Button>
                            </div>
                            <Input
                              value={med.comment}
                              onChange={e => handleMedicationComment(globalIdx, e.target.value)}
                              placeholder="Comment"
                              className="text-xs"
                            />
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                {checkedMedications.filter(med => med.timeSlot === 'afternoon').length === 0 && (
                  <div className="text-xs text-muted-foreground text-center p-4 border-2 border-dashed rounded">
                    No afternoon medications
                  </div>
                )}
              </div>

              {/* Evening */}
              <div className="space-y-3">
                <h4 className="font-medium text-center p-2 bg-blue-50 rounded-lg text-blue-800">
                  Evening
                </h4>
                {checkedMedications
                  .filter(med => med.timeSlot === 'evening')
                  .map((med, idx) => {
                    const globalIdx = checkedMedications.findIndex(m => m.medicationId === med.medicationId && m.timeSlot === med.timeSlot);
                    return (
                      <Card key={`${med.medicationId}-${med.timeSlot}`} className="p-3">
                        <div className="space-y-2">
                          <div className="font-medium text-sm">{med.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {med.strength} {med.form}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Quantity: {med.quantity}
                          </div>
                          
                          <div className="space-y-2">
                            <Label className="text-xs">Correct?</Label>
                            <div className="flex gap-1">
                              <Button
                                type="button"
                                size="sm"
                                variant={med.correct ? "default" : "outline"}
                                onClick={() => handleMedicationCheck(globalIdx, true)}
                                className="flex-1 text-xs"
                              >
                                Yes
                              </Button>
                              <Button
                                type="button"
                                size="sm"
                                variant={!med.correct ? "destructive" : "outline"}
                                onClick={() => handleMedicationCheck(globalIdx, false)}
                                className="flex-1 text-xs"
                              >
                                No
                              </Button>
                            </div>
                            <Input
                              value={med.comment}
                              onChange={e => handleMedicationComment(globalIdx, e.target.value)}
                              placeholder="Comment"
                              className="text-xs"
                            />
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                {checkedMedications.filter(med => med.timeSlot === 'evening').length === 0 && (
                  <div className="text-xs text-muted-foreground text-center p-4 border-2 border-dashed rounded">
                    No evening medications
                  </div>
                )}
              </div>

              {/* Night */}
              <div className="space-y-3">
                <h4 className="font-medium text-center p-2 bg-purple-50 rounded-lg text-purple-800">
                  Night
                </h4>
                {checkedMedications
                  .filter(med => med.timeSlot === 'night')
                  .map((med, idx) => {
                    const globalIdx = checkedMedications.findIndex(m => m.medicationId === med.medicationId && m.timeSlot === med.timeSlot);
                    return (
                      <Card key={`${med.medicationId}-${med.timeSlot}`} className="p-3">
                        <div className="space-y-2">
                          <div className="font-medium text-sm">{med.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {med.strength} {med.form}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Quantity: {med.quantity}
                          </div>
                          
                          <div className="space-y-2">
                            <Label className="text-xs">Correct?</Label>
                            <div className="flex gap-1">
                              <Button
                                type="button"
                                size="sm"
                                variant={med.correct ? "default" : "outline"}
                                onClick={() => handleMedicationCheck(globalIdx, true)}
                                className="flex-1 text-xs"
                              >
                                Yes
                              </Button>
                              <Button
                                type="button"
                                size="sm"
                                variant={!med.correct ? "destructive" : "outline"}
                                onClick={() => handleMedicationCheck(globalIdx, false)}
                                className="flex-1 text-xs"
                              >
                                No
                              </Button>
                            </div>
                            <Input
                              value={med.comment}
                              onChange={e => handleMedicationComment(globalIdx, e.target.value)}
                              placeholder="Comment"
                              className="text-xs"
                            />
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                {checkedMedications.filter(med => med.timeSlot === 'night').length === 0 && (
                  <div className="text-xs text-muted-foreground text-center p-4 border-2 border-dashed rounded">
                    No night medications
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setStep(1)}>
              Back
            </Button>
            <Button onClick={handleStep2Next}>
              Next: Confirm
            </Button>
          </div>
        </div>
      )}
      {step === 3 && (
        <form
          onSubmit={e => {
            e.preventDefault();
            handleSubmit();
          }}
          className="space-y-6"
        >
          <div>
            <h3 className="text-lg font-semibold mb-2">Confirm & Submit</h3>
            <p className="text-muted-foreground mb-4">Review and confirm the pack check. Select your initials to verify.</p>
            <div className="mb-4">
              <Label>Pharmacist Initials</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    className="w-full justify-between"
                  >
                    {finalInitials && teamMembers
                      ? (() => {
                          const selectedMember = teamMembers.find((member: any) => member.initials === finalInitials);
                          return selectedMember 
                            ? `${selectedMember.initials} - ${selectedMember.fullName}`
                            : "Select your initials to confirm...";
                        })()
                      : "Select your initials to confirm..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0">
                  <Command>
                    <CommandInput placeholder="Search pharmacists..." />
                    <CommandEmpty>No pharmacist found.</CommandEmpty>
                    <CommandGroup>
                      {teamMembers && teamMembers.filter((member: any) => member.isActive).map((member: any) => (
                        <CommandItem
                          key={member._id}
                          value={`${member.initials} ${member.fullName}`}
                          onSelect={() => {
                            setFinalInitials(member.initials);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              finalInitials === member.initials ? "opacity-100" : "opacity-0"
                            )}
                          />
                          {member.initials} - {member.fullName}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
            <div className="mb-4">
              <Label>Final Notes (Optional)</Label>
              <Textarea
                value={finalNotes}
                onChange={e => setFinalNotes(e.target.value)}
                placeholder="Add any final notes or issues found"
              />
            </div>
            <div className="mb-4 p-4 bg-muted/50 rounded-lg">
              <h4 className="font-medium mb-2">Pack Details</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="font-medium">Pack ID:</span> {websterPackId}
                </div>
                <div>
                  <span className="font-medium">Pack Type:</span> {packType === "blister_packs" ? "Blister Packs" : "Sachet Rolls"}
                </div>
                <div>
                  <span className="font-medium">Customer:</span> {customers?.find(c => c._id === customerId)?.firstName} {customers?.find(c => c._id === customerId)?.lastName}
                </div>
                <div>
                  <span className="font-medium">Pharmacist:</span> {pharmacistInitials}
                </div>
              </div>
            </div>
            <div className="mb-4">
              <h4 className="font-medium mb-2">Medications Checked</h4>
              <ul className="list-disc pl-5 text-sm">
                {checkedMedications.map((med, idx) => (
                  <li key={idx}>
                    {med.name} ({med.strength} {med.form}) - {med.timeSlot} ({med.quantity})
                    {med.correct ? " ✅" : " ❌"}
                    {med.comment && ` - ${med.comment}`}
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setStep(2)} type="button">
              Back
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Submitting..." : "Mark Pack as Checked"}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
} 