"use client";

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { BackgroundGlow } from "@/components/background-glow";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { PackCheckForm } from "@/components/pack-check-form";
import { PackChecksList } from "@/components/pack-checks-list";

export default function CheckingPacksPage() {
  return (
    <SidebarProvider
      style={{
        "--sidebar-width": "calc(var(--spacing) * 72)",
        "--header-height": "calc(var(--spacing) * 12)",
      } as React.CSSProperties}
    >
      <BackgroundGlow />
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader title="Checking Packs" />
        <div className="flex flex-1 flex-col gap-6 p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
            {/* Left side - Pack Check Form */}
            <Card className="h-fit">
              <CardHeader>
                <CardTitle>Check Webster Pack</CardTitle>
                <CardDescription>
                  Scan or manually enter pack details to mark as checked
                </CardDescription>
              </CardHeader>
              <CardContent>
                <PackCheckForm />
              </CardContent>
            </Card>
            
            {/* Right side - Pack Checks List */}
            <Card className="h-fit">
              <CardHeader>
                <CardTitle>Recent Pack Checks</CardTitle>
                <CardDescription>
                  View recently checked packs and their status
                </CardDescription>
              </CardHeader>
              <CardContent>
                <PackChecksList />
              </CardContent>
            </Card>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
} 