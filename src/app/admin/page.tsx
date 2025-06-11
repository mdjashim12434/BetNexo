
'use client';

import AppLayout from "@/components/AppLayout";
import { SidebarProvider, Sidebar, SidebarHeader, SidebarContent, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarInset } from "@/components/ui/sidebar";
import { LayoutDashboard, Users, DollarSign, History, Briefcase, ShieldAlert } from "lucide-react";
import UserManagementTab from "@/components/admin/UserManagementTab";
import BalanceControlTab from "@/components/admin/BalanceControlTab";
import AgentManagementTab from "@/components/admin/AgentManagementTab";
import TransactionsLogTab from "@/components/admin/TransactionsLogTab";
import DashboardTab from "@/components/admin/DashboardTab";

import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface NavItem {
  id: string;
  label: string;
  icon: React.ElementType;
  component: React.ElementType;
}

const navItems: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, component: DashboardTab },
  { id: 'userManagement', label: 'Manage Users', icon: Users, component: UserManagementTab },
  { id: 'balanceSheet', label: 'Balance Sheet', icon: DollarSign, component: BalanceControlTab },
  { id: 'transactionsLog', label: 'Transaction Logs', icon: History, component: TransactionsLogTab },
  { id: 'agentControl', label: 'Agent Control', icon: Briefcase, component: AgentManagementTab },
];

export default function AdminPage() {
  const { user, loadingAuth } = useAuth();
  const router = useRouter();
  const [activeSection, setActiveSection] = useState<string>('dashboard');

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
    return <AppLayout><div className="flex items-center justify-center min-h-screen"><div className="text-center p-10">Loading authentication...</div></div></AppLayout>;
  }

  if (!user) {
    // This case should ideally be caught by the useEffect redirect,
    // but it's a safeguard.
    return <AppLayout><div className="flex items-center justify-center min-h-screen"><div className="text-center p-10">Redirecting to login...</div></div></AppLayout>;
  }

  const ActiveComponent = navItems.find(item => item.id === activeSection)?.component || DashboardTab;

  return (
    <AppLayout>
      <SidebarProvider>
        <div className="flex min-h-[calc(100vh-theme(spacing.16))]"> {/* Full height minus header */}
          <Sidebar collapsible="icon" variant="sidebar" className="border-r border-border/60">
            <SidebarHeader className="p-0">
              <div className="flex items-center justify-center h-16 border-b border-border/60">
                 <div className="font-headline text-xl text-primary flex items-center group-data-[collapsible=icon]:hidden">
                    <ShieldAlert className="mr-2 h-6 w-6" /> BETBABU
                 </div>
                 <ShieldAlert className="h-7 w-7 text-primary hidden group-data-[collapsible=icon]:block" />
              </div>
            </SidebarHeader>
            <SidebarContent className="p-2">
              <SidebarMenu>
                {navItems.map((item) => (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton
                      onClick={() => setActiveSection(item.id)}
                      isActive={activeSection === item.id}
                      tooltip={{ children: item.label, side: "right", align: "center" }}
                      className="justify-start"
                    >
                      <item.icon className="h-5 w-5" />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarContent>
            {/* <SidebarFooter>
              Optional Footer Content
            </SidebarFooter> */}
          </Sidebar>
          <SidebarInset className="flex-1 bg-background">
            <div className="p-4 md:p-6 lg:p-8">
              <ActiveComponent />
            </div>
          </SidebarInset>
        </div>
      </SidebarProvider>
    </AppLayout>
  );
}
