
'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings2 } from "lucide-react";

export default function MatchControlTab() {
  return (
    <Card className="shadow-md">
      <CardHeader className="border-b">
        <CardTitle className="font-headline text-xl flex items-center">
          <Settings2 className="mr-2 h-5 w-5 text-primary" /> Match Control
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <p className="text-muted-foreground">
          Controls for enabling/disabling sports categories, managing match visibility from Opticodds API, and other related settings will be available.
        </p>
        <div className="mt-6 p-8 border-2 border-dashed border-border rounded-lg text-center">
            <h3 className="text-lg font-semibold text-foreground">Coming Soon</h3>
            <p className="text-sm text-muted-foreground">Match and sports category controls are under development.</p>
        </div>
      </CardContent>
    </Card>
  );
}
