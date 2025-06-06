"use client";

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { BackgroundGlow } from "@/components/background-glow";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { ScanOutForm } from "@/components/scan-out-form";
import { ScanOutList } from "@/components/scan-out-list";

export default function ScanOutPage() {
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
        <SiteHeader title="Scan Out" />
        <div className="flex flex-1 flex-col gap-6 p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
            {/* Left side - Scan Out Form */}
            <Card className="h-fit">
              <CardHeader>
                <CardTitle>Scan Out Webster Pack</CardTitle>
                <CardDescription>
                  Scan or manually enter pack details to mark as scanned out
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScanOutForm />
              </CardContent>
            </Card>
            
            {/* Right side - Scan Out List */}
            <Card className="h-fit">
              <CardHeader>
                <CardTitle>Recent Scan Outs</CardTitle>
                <CardDescription>
                  View recently scanned out packs and their delivery status
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScanOutList />
              </CardContent>
            </Card>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
} 