
'use client';

import AppLayout from "@/components/AppLayout";
import { SidebarProvider, Sidebar, SidebarHeader, SidebarContent, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarInset } from "@/components/ui/sidebar";
import { LayoutDashboard, Users, DollarSign, History, Briefcase, ShieldAlert, ListChecks, CreditCard } from "lucide-react"; // Added CreditCard
import UserManagementTab from "@/components/admin/UserManagementTab";
import BalanceControlTab from "@/components/admin/BalanceControlTab";
import AgentManagementTab from "@/components/admin/AgentManagementTab";
import TransactionsLogTab from "@/components/admin/TransactionsLogTab";
import DashboardTab from "@/components/admin/DashboardTab";
import BetHistoryTab from "@/components/admin/BetHistoryTab";
import PaymentMethodsManagementTab from "@/components/admin/PaymentMethodsManagementTab";

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
  { id: 'paymentMethods', label: 'Payment Methods', icon: CreditCard, component: PaymentMethodsManagementTab },
  { id: 'agentControl', label: 'Agent Control', icon: Briefcase, component: AgentManagementTab },
  { id: 'betHistory', label: 'Bet History', icon: ListChecks, component: BetHistoryTab },
];

export default function AdminPage() {
  const { user, loadingAuth } = useAuth();
  const router = useRouter();
  const [activeSection, setActiveSection] = useState<string>('dashboard');

  useEffect(() => {
    console.log('AdminPage Effect Fired. State: loadingAuth:', loadingAuth, 'user exists:', !!user, 'user.emailVerified:', user?.emailVerified, 'user.role:', user?.role);
    if (!loadingAuth) {
      if (!user) {
        console.log('AdminPage: No user object found. Redirecting to /login.');
        router.push('/login');
      } else if (user.emailVerified !== true) { // Explicitly check for true
        console.log('AdminPage: User email is not verified (current value: ' + user.emailVerified + '). Redirecting to /login.');
        router.push('/login');
      } else if (user.role !== 'Admin') { 
        console.log(`AdminPage: User role is "${user.role}" (not 'Admin'). Redirecting to /.`);
        router.push('/'); 
      } else {
        // User is present, emailVerified is true, and role is 'Admin'
        console.log('AdminPage: User is admin and verified. Proceeding to render admin content.');
      }
    }
  }, [user, loadingAuth, router]);

  if (loadingAuth) {
    return <AppLayout><div className="flex items-center justify-center min-h-screen"><div className="text-center p-10">Loading authentication for Admin...</div></div></AppLayout>;
  }

  // These checks are primarily for the initial render before useEffect can redirect.
  // The useEffect handles the definitive redirection.
  if (!user || user.emailVerified !== true) {
    return <AppLayout><div className="flex items-center justify-center min-h-screen"><div className="text-center p-10">Redirecting to login... (User not authenticated or email not verified for admin access)</div></div></AppLayout>;
  }
  
  if (user.role !== 'Admin') {
    return <AppLayout><div className="flex items-center justify-center min-h-screen"><div className="text-center p-10">Access Denied. Redirecting... (User is not Admin)</div></div></AppLayout>;
  }

  const ActiveComponent = navItems.find(item => item.id === activeSection)?.component || DashboardTab;

  return (
    <AppLayout>
      <SidebarProvider>
        <div className="flex min-h-[calc(100vh-theme(spacing.16))]">
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
          </Sidebar>
          <SidebarInset className="flex-1 bg-background">
            <div className="p-4 md:p-6 lg:p-8">
              {ActiveComponent === DashboardTab ? (
                <DashboardTab setActiveSection={setActiveSection} />
              ) : (
                <ActiveComponent />
              )}
            </div>
          </SidebarInset>
        </div>
      </SidebarProvider>
    </AppLayout>
  );
}
