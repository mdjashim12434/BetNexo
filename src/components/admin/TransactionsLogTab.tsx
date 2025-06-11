
'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { History } from "lucide-react";

export default function TransactionsLogTab() {
  return (
    <Card className="shadow-md">
      <CardHeader className="border-b">
        <CardTitle className="font-headline text-xl flex items-center">
          <History className="mr-2 h-5 w-5 text-primary" /> Transactions Log
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <p className="text-muted-foreground">
          View all deposit and withdrawal records, filter by status, user, or payment method. Track transaction history.
        </p>
        <div className="mt-6 p-8 border-2 border-dashed border-border rounded-lg text-center">
            <h3 className="text-lg font-semibold text-foreground">Coming Soon</h3>
            <p className="text-sm text-muted-foreground">Detailed transaction logging and viewing features are under development.</p>
        </div>
      </CardContent>
    </Card>
  );
}
