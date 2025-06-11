
'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LayoutDashboard } from "lucide-react";

export default function DashboardTab() {
  return (
    <Card className="shadow-md">
      <CardHeader className="border-b">
        <CardTitle className="font-headline text-xl flex items-center">
          <LayoutDashboard className="mr-2 h-5 w-5 text-primary" /> Dashboard Overview
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <p className="text-muted-foreground">
          Welcome to the Admin Dashboard. Key metrics, summaries, and quick actions will be displayed here.
        </p>
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Placeholder cards for dashboard stats */}
          {[
            { title: "Total Users", value: "1,234", icon: Users },
            { title: "Active Bets", value: "567", icon: Briefcase },
            { title: "Pending Withdrawals", value: "12", icon: DollarSign },
          ].map((item, index) => (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {item.title}
                </CardTitle>
                <item.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{item.value}</div>
                <p className="text-xs text-muted-foreground">
                  +20.1% from last month (mock data)
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="mt-8 p-8 border-2 border-dashed border-border rounded-lg text-center">
            <h3 className="text-lg font-semibold text-foreground">More Widgets Coming Soon</h3>
            <p className="text-sm text-muted-foreground">Detailed statistics and charts will be added here.</p>
        </div>
      </CardContent>
    </Card>
  );
}

// Temporary import for placeholder icons, move to actual components later if needed
import { Users, Briefcase, DollarSign } from "lucide-react";
