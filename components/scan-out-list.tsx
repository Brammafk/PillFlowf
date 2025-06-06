"use client";

import React from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function ScanOutList() {
  const scanOuts = useQuery(api.myFunctions.getScanOuts);
  const updateScanOutStatus = useMutation(api.myFunctions.updateScanOutStatus);

  const handleStatusUpdate = async (id: string, newStatus: "scanned_out" | "delivered") => {
    try {
      await updateScanOutStatus({
        id: id as any,
        status: newStatus,
      });
      toast.success(`Status updated to ${newStatus === "scanned_out" ? "Scanned Out" : "Delivered"}`);
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error("Failed to update status. Please try again.");
    }
  };

  if (!scanOuts) {
    return <div className="text-muted-foreground">Loading scan outs...</div>;
  }

  if (scanOuts.length === 0) {
    return <div className="text-muted-foreground">No scan outs found.</div>;
  }

  return (
    <ScrollArea className="h-[600px]">
      <div className="space-y-4">
        {scanOuts.map((scanOut) => (
          <div
            key={scanOut._id}
            className="border rounded-lg p-4 space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="font-medium">
                {scanOut.customer
                  ? `${scanOut.customer.firstName} ${scanOut.customer.lastName} (${scanOut.customer.customerId})`
                  : "Unknown Customer"}
              </div>
              <div className="flex items-center gap-2">
                <Badge 
                  variant={scanOut.status === "delivered" ? "default" : "secondary"}
                  className={scanOut.status === "delivered" ? "bg-green-600" : ""}
                >
                  {scanOut.status === "scanned_out" ? "Scanned Out" : "Delivered"}
                </Badge>
                {scanOut.status === "scanned_out" && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleStatusUpdate(scanOut._id, "delivered")}
                    className="text-xs"
                  >
                    Mark Delivered
                  </Button>
                )}
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-muted-foreground">
              <div>
                <span className="font-medium">Pack ID:</span> {scanOut.websterPackId}
              </div>
              <div>
                <span className="font-medium">Pack Type:</span> {scanOut.packType === "blister_packs" ? "Blister Packs" : "Sachet Rolls"}
              </div>
              <div>
                <span className="font-medium">Pharmacist:</span> {scanOut.pharmacistInitials}
              </div>
              <div>
                <span className="font-medium">Scanned:</span> {new Date(scanOut.createdAt).toLocaleDateString()} at{" "}
                {new Date(scanOut.createdAt).toLocaleTimeString()}
              </div>
              {scanOut.notes && (
                <div className="md:col-span-2">
                  <span className="font-medium">Notes:</span> {scanOut.notes}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
} 