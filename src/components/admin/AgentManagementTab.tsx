
'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Briefcase } from "lucide-react";

export default function AgentManagementTab() {
  return (
    <Card className="shadow-md">
      <CardHeader className="border-b">
        <CardTitle className="font-headline text-xl flex items-center">
          <Briefcase className="mr-2 h-5 w-5 text-primary" /> Agent Management
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <p className="text-muted-foreground">
          Tools to assign agents, manage their roles, set commission rates, and track performance will be implemented here.
        </p>
        <div className="mt-6 p-8 border-2 border-dashed border-border rounded-lg text-center">
            <h3 className="text-lg font-semibold text-foreground">Coming Soon</h3>
            <p className="text-sm text-muted-foreground">Agent management system is currently being built.</p>
        </div>
      </CardContent>
    </Card>
  );
}
