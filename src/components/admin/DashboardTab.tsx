'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Briefcase, DollarSign, TrendingUp, TrendingDown, Activity, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface StatCardProps {
  title: string;
  value: string;
  icon: React.ElementType;
  description?: string;
  trend?: string;
  onClick?: () => void;
  sectionId?: string; // To identify which section to navigate to
}

const StatCard = ({ title, value, icon: Icon, description, trend, onClick }: StatCardProps) => (
  <Card 
    className={`shadow-md hover:shadow-primary/20 transition-shadow duration-300 ${onClick ? 'cursor-pointer' : ''}`}
    onClick={onClick}
  >
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium text-muted-foreground">
        {title}
      </CardTitle>
      <Icon className="h-5 w-5 text-primary" />
    </CardHeader>
    <CardContent>
      <div className="text-3xl font-bold text-foreground">{value}</div>
      {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
      {trend && <p className="text-xs text-green-500 dark:text-green-400 mt-1">{trend}</p>}
      {onClick && <Button variant="link" size="sm" className="p-0 mt-2 text-xs text-primary h-auto">View Details <ArrowRight className="ml-1 h-3 w-3"/></Button>}
    </CardContent>
  </Card>
);

interface DashboardTabProps {
  setActiveSection?: (sectionId: string) => void;
}

export default function DashboardTab({ setActiveSection }: DashboardTabProps) {
  const mockRecentActivities = [
    { id: 1, user: "Alice", action: "Placed a bet", time: "5m ago" },
    { id: 2, user: "Bob", action: "Deposited $50", time: "10m ago" },
    { id: 3, user: "Charlie", action: "Verified KYC", time: "1h ago" },
    { id: 4, user: "Diana", action: "Won a bet", time: "2h ago" },
  ];

  const handleCardClick = (sectionId: string) => {
    if (setActiveSection) {
      setActiveSection(sectionId);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-headline font-semibold text-primary mb-1">Admin Dashboard</h2>
        <p className="text-muted-foreground">Overview of BetNexo platform activity.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <StatCard 
          title="Total Users" 
          value="1,482" 
          icon={Users} 
          description="Registered users on the platform" 
          trend="+2.5% this month" 
          onClick={() => handleCardClick('userManagement')}
          sectionId="userManagement"
        />
        <StatCard 
          title="Active Bets" 
          value="305" 
          icon={Briefcase} 
          description="Current ongoing bets" 
          // onClick={() => handleCardClick('betsManagement')} // Example for a future section
        />
        <StatCard 
          title="Total Agents" 
          value="27" 
          icon={Users} 
          description="Active agents managing operations" 
          onClick={() => handleCardClick('agentControl')}
          sectionId="agentControl"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="shadow-md">
          <CardHeader 
            className={`flex flex-row items-center justify-between ${setActiveSection ? 'cursor-pointer hover:bg-muted/30' : ''} rounded-t-lg`}
            onClick={() => handleCardClick('transactionsLog')}
          >
            <CardTitle className="font-headline text-lg flex items-center">
              <TrendingUp className="mr-2 h-5 w-5 text-green-500" /> Deposits Summary
            </CardTitle>
            {setActiveSection && <ArrowRight className="h-4 w-4 text-muted-foreground"/>}
          </CardHeader>
          <CardContent className="space-y-2 pt-4">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Today's Deposits:</span>
              <span className="font-semibold text-foreground">$5,230</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Pending Deposits:</span>
              <span className="font-semibold text-foreground">$150 (2)</span>
            </div>
             <div className="flex justify-between">
              <span className="text-muted-foreground">This Month:</span>
              <span className="font-semibold text-foreground">$88,750</span>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-md">
           <CardHeader 
            className={`flex flex-row items-center justify-between ${setActiveSection ? 'cursor-pointer hover:bg-muted/30' : ''} rounded-t-lg`}
            onClick={() => handleCardClick('transactionsLog')}
          >
            <CardTitle className="font-headline text-lg flex items-center">
              <TrendingDown className="mr-2 h-5 w-5 text-red-500" /> Withdrawals Summary
            </CardTitle>
            {setActiveSection && <ArrowRight className="h-4 w-4 text-muted-foreground"/>}
          </CardHeader>
          <CardContent className="space-y-2 pt-4">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Today's Withdrawals:</span>
              <span className="font-semibold text-foreground">$2,100</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Pending Withdrawals:</span>
              <span className="font-semibold text-foreground">$820 (5)</span>
            </div>
             <div className="flex justify-between">
              <span className="text-muted-foreground">This Month:</span>
              <span className="font-semibold text-foreground">$45,300</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="font-headline text-lg flex items-center">
            <Activity className="mr-2 h-5 w-5 text-accent" /> Recent User Activities (Coming Soon)
          </CardTitle>
          <CardDescription>A log of important user actions on the platform.</CardDescription>
        </CardHeader>
        <CardContent>
            <div className="mt-2 p-6 border-2 border-dashed border-border rounded-lg text-center">
                <h3 className="text-md font-semibold text-foreground">Activity Feed</h3>
                <p className="text-sm text-muted-foreground">This section will display recent user activities.</p>
            </div>
          {/* <ul className="space-y-3">
            {mockRecentActivities.map(activity => (
              <li key={activity.id} className="flex items-center justify-between text-sm p-2 rounded-md hover:bg-muted/50">
                <div>
                  <span className="font-semibold text-foreground">{activity.user}</span>
                  <span className="text-muted-foreground"> {activity.action}</span>
                </div>
                <span className="text-xs text-muted-foreground">{activity.time}</span>
              </li>
            ))}
          </ul> */}
        </CardContent>
      </Card>

    </div>
  );
}
