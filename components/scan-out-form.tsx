"use client";

import React, { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, Check, Search } from "lucide-react";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

const scanOutSchema = z.object({
  customerId: z.string().min(1, "Please select a customer"),
  pharmacistInitials: z.string().min(1, "Please select a pharmacist"),
  websterPackId: z.string().min(1, "Pack ID is required"),
  packType: z.enum(["blister_packs", "sachet_rolls"]),
  notes: z.string().optional(),
  status: z.enum(["scanned_out", "delivered"]),
});

type ScanOutFormData = z.infer<typeof scanOutSchema>;

export function ScanOutForm() {
  const [customerSearchOpen, setCustomerSearchOpen] = useState(false);
  const [pharmacistSearchOpen, setPharmacistSearchOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showWarningDialog, setShowWarningDialog] = useState(false);
  const [pendingSubmission, setPendingSubmission] = useState<ScanOutFormData | null>(null);

  const customers = useQuery(api.myFunctions.getCustomers, { status: "active" });
  const teamMembers = useQuery(api.myFunctions.getTeamMembers);
  const createScanOut = useMutation(api.myFunctions.createScanOut);

  const form = useForm<ScanOutFormData>({
    resolver: zodResolver(scanOutSchema),
    defaultValues: {
      customerId: "",
      pharmacistInitials: "",
      websterPackId: "",
      packType: "blister_packs",
      notes: "",
      status: "scanned_out",
    },
  });

  const selectedCustomer = customers?.find(
    (customer) => customer._id === form.watch("customerId")
  );

  const selectedPharmacist = teamMembers?.find(
    (member) => member.initials === form.watch("pharmacistInitials")
  );

  // Check pack validation when both customer and pack ID are provided
  const packValidation = useQuery(
    api.myFunctions.checkPackExists,
    form.watch("customerId") && form.watch("websterPackId")
      ? {
          customerId: form.watch("customerId") as any,
          websterPackId: form.watch("websterPackId"),
        }
      : "skip"
  );

  const handleFormSubmit = async (data: ScanOutFormData) => {
    // Check if pack has been checked
    if (packValidation && !packValidation.isChecked) {
      setPendingSubmission(data);
      setShowWarningDialog(true);
      return;
    }

    // Proceed with normal submission
    await submitScanOut(data);
  };

  const submitScanOut = async (data: ScanOutFormData) => {
    setIsSubmitting(true);
    try {
      await createScanOut({
        customerId: data.customerId as any,
        pharmacistInitials: data.pharmacistInitials,
        websterPackId: data.websterPackId,
        packType: data.packType || "blister_packs",
        notes: data.notes || undefined,
        status: data.status,
      });

      toast.success("Webster pack scanned out successfully!");
      form.reset();
    } catch (error) {
      console.error("Error creating scan out:", error);
      toast.error("Failed to scan out pack. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleWarningProceed = async () => {
    setShowWarningDialog(false);
    if (pendingSubmission) {
      await submitScanOut(pendingSubmission);
      setPendingSubmission(null);
    }
  };

  const handleWarningCancel = () => {
    setShowWarningDialog(false);
    setPendingSubmission(null);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
        {/* Customer Selection */}
        <FormField
          control={form.control}
          name="customerId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Customer</FormLabel>
              <Popover open={customerSearchOpen} onOpenChange={setCustomerSearchOpen}>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={customerSearchOpen}
                      className="w-full justify-between"
                    >
                      {selectedCustomer ? (
                        <div className="flex items-center gap-2">
                          <span>
                            {selectedCustomer.firstName} {selectedCustomer.lastName}
                          </span>
                          <Badge variant="secondary" className="text-xs">
                            {selectedCustomer.customerId}
                          </Badge>
                        </div>
                      ) : (
                        "Select customer..."
                      )}
                      <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0">
                  <Command>
                    <CommandInput placeholder="Search customers..." />
                    <CommandList>
                      <CommandEmpty>No customers found.</CommandEmpty>
                      <CommandGroup>
                        {customers?.map((customer) => (
                          <CommandItem
                            key={customer._id}
                            value={`${customer.firstName} ${customer.lastName} ${customer.customerId}`}
                            onSelect={() => {
                              field.onChange(customer._id);
                              setCustomerSearchOpen(false);
                            }}
                          >
                            <Check
                              className={`mr-2 h-4 w-4 ${
                                field.value === customer._id ? "opacity-100" : "opacity-0"
                              }`}
                            />
                            <div className="flex items-center gap-2">
                              <span>
                                {customer.firstName} {customer.lastName}
                              </span>
                              <Badge variant="outline" className="text-xs">
                                {customer.customerId}
                              </Badge>
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Pack ID */}
        <FormField
          control={form.control}
          name="websterPackId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Webster Pack ID</FormLabel>
              <FormControl>
                <Input placeholder="Enter pack ID or scan barcode" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Pack Type Selection */}
        <FormField
          control={form.control}
          name="packType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Pack Type</FormLabel>
              <FormControl>
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select pack type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="blister_packs">Blister Packs</SelectItem>
                    <SelectItem value="sachet_rolls">Sachet Rolls</SelectItem>
                  </SelectContent>
                </Select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Pharmacist Selection */}
        <FormField
          control={form.control}
          name="pharmacistInitials"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Pharmacist</FormLabel>
              <Popover open={pharmacistSearchOpen} onOpenChange={setPharmacistSearchOpen}>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={pharmacistSearchOpen}
                      className="w-full justify-between"
                    >
                      {selectedPharmacist ? (
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">{selectedPharmacist.initials}</Badge>
                          <span>{selectedPharmacist.fullName}</span>
                        </div>
                      ) : (
                        "Select pharmacist..."
                      )}
                      <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0">
                  <Command>
                    <CommandInput placeholder="Search pharmacists..." />
                    <CommandList>
                      <CommandEmpty>No pharmacists found.</CommandEmpty>
                      <CommandGroup>
                        {teamMembers
                          ?.filter((member) => member.isActive)
                          .map((member) => (
                            <CommandItem
                              key={member._id}
                              value={`${member.initials} ${member.fullName}`}
                              onSelect={() => {
                                field.onChange(member.initials);
                                setPharmacistSearchOpen(false);
                              }}
                            >
                              <Check
                                className={`mr-2 h-4 w-4 ${
                                  field.value === member.initials ? "opacity-100" : "opacity-0"
                                }`}
                              />
                              <div className="flex items-center gap-2">
                                <Badge variant="outline">{member.initials}</Badge>
                                <span>{member.fullName}</span>
                              </div>
                            </CommandItem>
                          ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Status Selection */}
        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Status</FormLabel>
              <FormControl>
                <RadioGroup
                  onValueChange={field.onChange}
                  value={field.value}
                  className="flex flex-col space-y-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="scanned_out" id="scanned_out" />
                    <Label htmlFor="scanned_out">Scanned Out</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="delivered" id="delivered" />
                    <Label htmlFor="delivered">Delivered</Label>
                  </div>
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Notes */}
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes (Optional)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Add any additional notes about this scan out..."
                  className="min-h-[80px]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            "Scan Out Pack"
          )}
        </Button>
      </form>

      {showWarningDialog && (
        <AlertDialog open={showWarningDialog} onOpenChange={handleWarningCancel}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Warning</AlertDialogTitle>
              <AlertDialogDescription>
                This pack has not been checked. Are you sure you want to proceed?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleWarningProceed}>Proceed</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </Form>
  );
} 