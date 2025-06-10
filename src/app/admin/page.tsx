
'use client';

import AppLayout from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldAlert } from "lucide-react";

export default function AdminPage() {
  return (
    <AppLayout>
      <div className="space-y-8">
        <Card className="shadow-xl">
          <CardHeader>
            <CardTitle className="font-headline text-3xl flex items-center">
              <ShieldAlert className="mr-3 h-8 w-8 text-primary" />
              Admin Panel
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg text-muted-foreground">
              Welcome to the Admin Panel. This area is for administrative tasks and site management.
            </p>
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Placeholder for admin sections/widgets */}
              <Card>
                <CardHeader><CardTitle className="font-headline text-xl">User Management</CardTitle></CardHeader>
                <CardContent><p className="text-sm text-muted-foreground">View and manage user accounts.</p></CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle className="font-headline text-xl">Content Management</CardTitle></CardHeader>
                <CardContent><p className="text-sm text-muted-foreground">Edit site content and match data.</p></CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle className="font-headline text-xl">Settings</CardTitle></CardHeader>
                <CardContent><p className="text-sm text-muted-foreground">Configure application settings.</p></CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
