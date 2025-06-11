
'use client';

import AppLayout from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, DollarSign, Briefcase, Settings2, History, ShieldAlert } from "lucide-react";
import UserManagementTab from "@/components/admin/UserManagementTab";
import BalanceControlTab from "@/components/admin/BalanceControlTab";
import AgentManagementTab from "@/components/admin/AgentManagementTab";
import MatchControlTab from "@/components/admin/MatchControlTab";
import TransactionsLogTab from "@/components/admin/TransactionsLogTab";

import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function AdminPage() {
  const { user, loadingAuth } = useAuth(); 
  const router = useRouter();

  useEffect(() => {
    if (!loadingAuth) { 
      if (!user) {
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
    return <AppLayout><div className="text-center p-10">Loading authentication...</div></AppLayout>;
  }

  if (!user) {
    // This case should ideally be caught by the useEffect redirect, 
    // but it's a safeguard.
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

  return (
    <AppLayout>
      <div className="space-y-8">
        <Card className="shadow-xl bg-card">
          <CardHeader className="border-b">
            <CardTitle className="font-headline text-3xl flex items-center text-primary">
              <ShieldAlert className="mr-3 h-8 w-8" />
              BETBABU Admin Panel
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 md:p-6">
            <Tabs defaultValue="userManagement" className="w-full">
              <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 mb-6">
                <TabsTrigger value="userManagement" className="flex items-center gap-2 py-2.5">
                  <Users className="h-5 w-5" /> User Management
                </TabsTrigger>
                <TabsTrigger value="balanceControl" className="flex items-center gap-2 py-2.5">
                  <DollarSign className="h-5 w-5" /> Balance Control
                </TabsTrigger>
                <TabsTrigger value="agentManagement" className="flex items-center gap-2 py-2.5">
                  <Briefcase className="h-5 w-5" /> Agent Management
                </TabsTrigger>
                <TabsTrigger value="matchControl" className="flex items-center gap-2 py-2.5">
                  <Settings2 className="h-5 w-5" /> Match Control
                </TabsTrigger>
                <TabsTrigger value="transactionsLog" className="flex items-center gap-2 py-2.5">
                  <History className="h-5 w-5" /> Transactions Log
                </TabsTrigger>
              </TabsList>

              <TabsContent value="userManagement">
                <UserManagementTab />
              </TabsContent>
              <TabsContent value="balanceControl">
                <BalanceControlTab />
              </TabsContent>
              <TabsContent value="agentManagement">
                <AgentManagementTab />
              </TabsContent>
              <TabsContent value="matchControl">
                <MatchControlTab />
              </TabsContent>
              <TabsContent value="transactionsLog">
                <TransactionsLogTab />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
