
'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign } from "lucide-react";

export default function BalanceControlTab() {
  return (
    <Card className="shadow-md">
      <CardHeader className="border-b">
        <CardTitle className="font-headline text-xl flex items-center">
          <DollarSign className="mr-2 h-5 w-5 text-primary" /> Balance Sheet
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <p className="text-muted-foreground">
          View user balances, manually add or deduct balance, and set deposit/withdraw limits. This section will provide a comprehensive overview of financial balances.
        </p>
        <div className="mt-6 p-8 border-2 border-dashed border-border rounded-lg text-center">
            <h3 className="text-lg font-semibold text-foreground">Coming Soon</h3>
            <p className="text-sm text-muted-foreground">Detailed balance sheet features are under development.</p>
        </div>
      </CardContent>
    </Card>
  );
}
