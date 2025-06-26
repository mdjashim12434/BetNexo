
'use client';

import AppLayout from "@/components/AppLayout";
import { SidebarProvider, Sidebar, SidebarHeader, SidebarContent, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarInset, SidebarFooter, SidebarTrigger } from "@/components/ui/sidebar";
import { LayoutDashboard, Users, DollarSign, History, Briefcase, ShieldAlert, ListChecks, CreditCard, LogOut } from "lucide-react";
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
import { useToast } from "@/hooks/use-toast";

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
  const { user, loadingAuth, logout } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [activeSection, setActiveSection] = useState<string>('dashboard');

  useEffect(() => {
    // This effect handles redirection based on auth state and role
    if (!loadingAuth) {
      if (!user) {
        // If there's no user object at all, redirect to login
        console.log('AdminPage: No user found. Redirecting to /login.');
        router.push('/login');
      } else if (user.role !== 'Admin') { 
        // If a user is logged in but is not an admin, redirect to the homepage
        console.log(`AdminPage: User role is "${user.role}" (not 'Admin'). Redirecting to /.`);
        router.push('/'); 
      }
      // If user exists and user.role is 'Admin', do nothing and let the page render.
      // The email verification check is now handled by the AuthContext.
    }
  }, [user, loadingAuth, router]);
  
  const handleLogout = () => {
    logout();
    toast({ title: "Logged Out", description: "You have been logged out successfully." });
    router.push('/login');
  };


  // Show loading screen while auth state is being determined or role is being fetched
  if (loadingAuth || (user && typeof user.role === 'undefined')) {
    return <AppLayout><div className="flex items-center justify-center min-h-screen"><div className="text-center p-10">Loading authentication for Admin...</div></div></AppLayout>;
  }

  // If after loading, there is still no user or user is not an Admin, show an appropriate message.
  // This content will be shown briefly while the useEffect above performs the redirect.
  if (!user) {
    return <AppLayout><div className="flex items-center justify-center min-h-screen"><div className="text-center p-10">Redirecting to login... (Authentication required)</div></div></AppLayout>;
  }
  
  if (user.role !== 'Admin') {
    return <AppLayout><div className="flex items-center justify-center min-h-screen"><div className="text-center p-10">Access Denied. Redirecting... (Admin role required)</div></div></AppLayout>;
  }

  // If all checks pass, render the admin dashboard
  const ActiveComponent = navItems.find(item => item.id === activeSection)?.component || DashboardTab;
  const activeSectionLabel = navItems.find(item => item.id === activeSection)?.label || 'Dashboard';

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
            <SidebarFooter className="p-2 mt-auto border-t border-border/60">
               <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      onClick={handleLogout}
                      tooltip={{ children: "Logout", side: "right", align: "center" }}
                      className="justify-start"
                    >
                      <LogOut className="h-5 w-5" />
                      <span>Logout</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
            </SidebarFooter>
          </Sidebar>
          <SidebarInset className="flex-1 bg-background">
            <header className="md:hidden flex items-center justify-between p-2 sm:p-4 border-b sticky top-16 bg-background/95 z-10">
              <div className="flex items-center gap-2">
                <SidebarTrigger />
                <h2 className="font-headline text-lg font-semibold">{activeSectionLabel}</h2>
              </div>
            </header>
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
