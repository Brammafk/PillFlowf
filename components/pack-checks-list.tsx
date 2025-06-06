"use client";

import React from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

export function PackChecksList() {
  const packChecks = useQuery(api.myFunctions.getPackChecks);

  if (!packChecks) {
    return <div className="text-muted-foreground">Loading pack checks...</div>;
  }

  if (packChecks.length === 0) {
    return <div className="text-muted-foreground">No pack checks found.</div>;
  }

  return (
    <ScrollArea className="h-[600px]">
      <div className="space-y-4">
        {packChecks.map((packCheck) => (
          <div
            key={packCheck._id}
            className="border rounded-lg p-4 space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="font-medium">
                {packCheck.customer
                  ? `${packCheck.customer.firstName} ${packCheck.customer.lastName} (${packCheck.customer.customerId})`
                  : "Unknown Customer"}
              </div>
              <Badge variant={packCheck.status === "checked" ? "default" : "secondary"}>
                {packCheck.status}
              </Badge>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-muted-foreground">
              <div>
                <span className="font-medium">Pack ID:</span> {packCheck.websterPackId}
              </div>
              <div>
                <span className="font-medium">Pack Type:</span> {packCheck.packType === "blister_packs" ? "Blister Packs" : "Sachet Rolls"}
              </div>
              <div>
                <span className="font-medium">Pharmacist:</span> {packCheck.pharmacistInitials}
              </div>
              <div>
                <span className="font-medium">Checked:</span> {new Date(packCheck.createdAt).toLocaleDateString()} at{" "}
                {new Date(packCheck.createdAt).toLocaleTimeString()}
              </div>
              {packCheck.notes && (
                <div className="md:col-span-2">
                  <span className="font-medium">Notes:</span> {packCheck.notes}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
} 