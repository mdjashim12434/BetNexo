
'use client';

import AppLayout from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ShieldAlert, Users, DollarSign, Settings as SettingsIcon, Briefcase, BarChartHorizontalBig } from "lucide-react";
import UserManagementTab from "@/components/admin/UserManagementTab";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function AdminPage() {
  const { user, loadingAuth } = useAuth(); // Correctly destructure loadingAuth
  const router = useRouter();

  useEffect(() => {
    if (!loadingAuth) { // Only check/redirect once authentication status is resolved
      if (!user) {
        // If authentication is resolved and there's no user, redirect to login
        router.push('/login');
      }
      // The following role-based redirect is INTENTIONALLY COMMENTED OUT
      // to prevent redirection to the home page based on a missing 'Admin' role.
      // else if (user && user.role !== 'Admin') { // Assuming user object has a 'role' property
      //   router.push('/'); 
      // }
    }
  }, [user, loadingAuth, router]);

  if (loadingAuth) {
    // If authentication is still loading, show a loading message.
    return <AppLayout><div className="text-center p-10">Loading authentication...</div></AppLayout>;
  }

  if (!user) {
    // If authentication has resolved and there's still no user (e.g., useEffect hasn't redirected yet or as a fallback)
    // show a message indicating redirection to login. The useEffect will handle the actual redirect.
    return <AppLayout><div className="text-center p-10">Redirecting to login...</div></AppLayout>;
  }
  
  // Placeholder for actual admin role check.
  // This conditional rendering block is INTENTIONALLY COMMENTED OUT
  // to prevent blocking access based on a missing 'Admin' role for now.
  // if (user.role !== 'Admin') { // Assuming user object has a 'role' property
  //   return (
  //     <AppLayout>
  //       <div className="text-center p-10">
  //         Access Denied. Administrator access required. Redirecting to home...
  //       </div>
  //     </AppLayout>
  //   );
  // }

  // If loadingAuth is false and user exists, render the admin panel.
  // No role check is performed here that would redirect to '/'.
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
            <Tabs defaultValue="userManagement" className="w-full">
              <TabsList className="grid w-full grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 mb-6">
                <TabsTrigger value="userManagement" className="flex items-center gap-2">
                  <Users className="h-4 w-4" /> User Management
                </TabsTrigger>
                <TabsTrigger value="balanceControl" className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4" /> Balance Control
                </TabsTrigger>
                <TabsTrigger value="transactions" className="flex items-center gap-2">
                  <BarChartHorizontalBig className="h-4 w-4" /> Transactions
                </TabsTrigger>
                <TabsTrigger value="agentManagement" className="flex items-center gap-2">
                  <Briefcase className="h-4 w-4" /> Agent Management
                </TabsTrigger>
                <TabsTrigger value="matchControl" className="flex items-center gap-2">
                  <SettingsIcon className="h-4 w-4" /> Match Control
                </TabsTrigger>
                <TabsTrigger value="appSettings" className="flex items-center gap-2">
                  <SettingsIcon className="h-4 w-4" /> App Settings
                </TabsTrigger>
              </TabsList>

              <TabsContent value="userManagement">
                <UserManagementTab />
              </TabsContent>
              <TabsContent value="balanceControl">
                <Card>
                  <CardHeader><CardTitle className="font-headline text-xl">Balance Control</CardTitle></CardHeader>
                  <CardContent><p className="text-muted-foreground">Manage user balances and currency settings. (Coming Soon)</p></CardContent>
                </Card>
              </TabsContent>
              <TabsContent value="transactions">
                <Card>
                  <CardHeader><CardTitle className="font-headline text-xl">Deposit & Withdraw Requests</CardTitle></CardHeader>
                  <CardContent><p className="text-muted-foreground">View, approve, or reject transaction requests. (Coming Soon)</p></CardContent>
                </Card>
              </TabsContent>
              <TabsContent value="agentManagement">
                <Card>
                  <CardHeader><CardTitle className="font-headline text-xl">Agent Management</CardTitle></CardHeader>
                  <CardContent><p className="text-muted-foreground">Manage agents and their commissions. (Coming Soon)</p></CardContent>
                </Card>
              </TabsContent>
              <TabsContent value="matchControl">
                <Card>
                  <CardHeader><CardTitle className="font-headline text-xl">Match Control</CardTitle></CardHeader>
                  <CardContent><p className="text-muted-foreground">Control sports categories and match visibility. (Coming Soon)</p></CardContent>
                </Card>
              </TabsContent>
              <TabsContent value="appSettings">
                <Card>
                  <CardHeader><CardTitle className="font-headline text-xl">Application Settings</CardTitle></CardHeader>
                  <CardContent><p className="text-muted-foreground">Configure site settings, currencies, and signup methods. (Coming Soon)</p></CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
