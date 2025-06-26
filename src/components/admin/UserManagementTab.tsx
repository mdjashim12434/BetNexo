
'use client';

import { useState, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { MoreHorizontal, Edit2, ShieldCheck, UserX, UserCheck, DollarSign, Phone, Mail, Search, Users, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { User } from '@/contexts/AuthContext'; 
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { cn } from '@/lib/utils';

interface AdminManagedUser extends User {
  role: 'User' | 'Agent' | 'Admin';
  status: 'active' | 'suspended' | 'pending_verification';
  // balance is already in User, but explicitly stating for clarity in Admin context
  lastLogin?: string; 
}

const mockUsersData: AdminManagedUser[] = [
  { id: 'user001', name: 'Alice Wonderland', email: 'alice@example.com', phone: '123-456-7890', role: 'User', status: 'active', isVerified: true, currency: 'USD', balance: 1250.75, lastLogin: '2024-06-10 10:00 UTC' },
  { id: 'user002', name: 'Bob The Builder', email: 'bob@example.com', phone: '987-654-3210', role: 'Agent', status: 'active', isVerified: false, currency: 'BDT', balance: 58000.00, lastLogin: '2024-06-11 08:30 UTC' },
  { id: 'user003', name: 'Charlie Brown', email: 'charlie@example.com', phone: '555-123-4567', role: 'Admin', status: 'active', isVerified: true, currency: 'INR', balance: 150000.50, lastLogin: '2024-06-11 12:15 UTC' },
  { id: 'user004', name: 'Diana Prince', email: 'diana@example.com', phone: '222-333-4444', role: 'User', status: 'suspended', isVerified: true, currency: 'EUR', balance: 300.00, lastLogin: '2024-06-09 15:00 UTC' },
  { id: 'user005', name: 'Edward Scissorhands', email: 'edward@example.com', phone: '777-888-9999', role: 'User', status: 'pending_verification', isVerified: false, currency: 'GBP', balance: 50.20, lastLogin: '2024-06-01 09:00 UTC' },
];

export default function UserManagementTab() {
  const [users, setUsers] = useState<AdminManagedUser[]>(mockUsersData);
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

  const filteredUsers = useMemo(() => {
    if (!searchTerm) return users;
    return users.filter(user =>
      user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.phone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.id.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [users, searchTerm]);

  const handleVerifyKYC = (userId: string) => {
    setUsers(prevUsers => prevUsers.map(u => u.id === userId ? {...u, isVerified: true, status: u.status === 'pending_verification' ? 'active' : u.status} : u));
    toast({ title: "KYC Approved (Mock)", description: `User ID ${userId} KYC has been approved.` });
  };

  const handleEditUser = (userId: string) => {
    toast({ title: 'Edit User (Mock)', description: `Opening edit dialog for user ID ${userId}.` });
    // In a real app, this would open a modal or navigate to an edit page
  };
  
  const handleSetRole = (userId: string, role: AdminManagedUser['role']) => {
    setUsers(prevUsers => prevUsers.map(u => u.id === userId ? {...u, role} : u));
    toast({ title: 'User Role Updated (Mock)', description: `User ID ${userId} role set to ${role}.` });
  };

  const handleSuspendUser = (userId: string) => {
    let userStatus: AdminManagedUser['status'] = 'active';
    setUsers(prevUsers => prevUsers.map(u => {
      if (u.id === userId) {
        userStatus = u.status === 'suspended' ? 'active' : 'suspended';
        return {...u, status: userStatus };
      }
      return u;
    }));
    const actionText = userStatus === 'suspended' ? 'blocked (suspended)' : 'unblocked (activated)';
    toast({ title: `User ${actionText} (Mock)`, description: `User ID ${userId} has been ${actionText}.` });
  };

  const handleManualBalance = (userId: string) => {
     toast({ title: 'Adjust Balance (Mock)', description: `Opening balance adjustment for user ID ${userId}. Navigation to Balance Sheet might be appropriate.` });
     // Consider navigating to Balance Sheet tab with user pre-selected, or opening a modal.
  };

  const getStatusBadgeVariant = (status: AdminManagedUser['status']) => {
    switch (status) {
      case 'active': return 'default'; // Will use green styling via className
      case 'suspended': return 'destructive';
      case 'pending_verification': return 'outline'; // Will use yellow styling via className
      default: return 'secondary';
    }
  };

  const getRoleBadgeVariant = (role: AdminManagedUser['role']) => {
    switch (role) {
      case 'Admin': return 'default'; // Will use primary styling
      case 'Agent': return 'secondary'; // Will use accent styling
      default: return 'outline';
    }
  };


  return (
    <Card className="shadow-xl bg-card min-h-full">
      <CardHeader className="border-b">
        <CardTitle className="font-headline text-2xl flex items-center text-primary">
          <Users className="mr-3 h-7 w-7" /> User Management
        </CardTitle>
        <CardDescription>View, search, and manage platform users.</CardDescription>
        <div className="mt-4 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search users by name, email, phone, or ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full md:w-1/2 lg:w-1/3 pl-10"
          />
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="px-3 py-3.5 text-left text-sm font-semibold text-foreground">Name</TableHead>
                <TableHead className="px-3 py-3.5 text-left text-sm font-semibold text-foreground hidden md:table-cell">Contact</TableHead>
                <TableHead className="px-3 py-3.5 text-left text-sm font-semibold text-foreground hidden lg:table-cell">Role</TableHead>
                <TableHead className="px-3 py-3.5 text-left text-sm font-semibold text-foreground">Status</TableHead>
                <TableHead className="px-3 py-3.5 text-left text-sm font-semibold text-foreground hidden sm:table-cell">KYC</TableHead>
                <TableHead className="px-3 py-3.5 text-left text-sm font-semibold text-foreground hidden lg:table-cell">Balance</TableHead>
                <TableHead className="relative py-3.5 pl-3 pr-4 sm:pr-6 text-right text-sm font-semibold text-foreground">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-border bg-card">
              {filteredUsers.length > 0 ? filteredUsers.map((user) => (
                <TableRow key={user.id} className="hover:bg-muted/50 transition-colors">
                  <TableCell className="whitespace-nowrap px-3 py-4 text-sm text-foreground">
                    <div>{user.name || 'N/A'}</div>
                    <div className="text-xs text-muted-foreground md:hidden">{user.email}</div>
                  </TableCell>
                  <TableCell className="px-3 py-4 text-xs text-muted-foreground hidden md:table-cell">
                    {user.email && <div className="flex items-center gap-1.5 mb-0.5"><Mail className="h-3.5 w-3.5"/> {user.email}</div>}
                    {user.phone && <div className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5"/> {user.phone}</div>}
                  </TableCell>
                  <TableCell className="whitespace-nowrap px-3 py-4 text-sm hidden lg:table-cell">
                    <Badge 
                      variant={getRoleBadgeVariant(user.role)}
                      className={cn("capitalize font-medium", {
                        'bg-primary/20 text-primary-foreground border-primary/30 hover:bg-primary/30': user.role === 'Admin',
                        'bg-accent/20 text-accent-foreground border-accent/30 hover:bg-accent/30': user.role === 'Agent',
                        'border-foreground/30': user.role === 'User',
                      })}
                    >
                      {user.role}
                    </Badge>
                  </TableCell>
                  <TableCell className="whitespace-nowrap px-3 py-4 text-sm">
                    <Badge 
                      variant={getStatusBadgeVariant(user.status)} 
                      className={cn("capitalize font-medium", {
                        'bg-green-500/20 text-green-700 border-green-500/30 dark:text-green-400 dark:border-green-700/50': user.status === 'active',
                        'bg-yellow-500/20 text-yellow-700 border-yellow-500/30 dark:text-yellow-400 dark:border-yellow-700/50': user.status === 'pending_verification',
                         // Destructive variant handles its own red styling
                      })}
                    >
                      {user.status.replace('_', ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell className="whitespace-nowrap px-3 py-4 text-sm hidden sm:table-cell">
                    {user.isVerified ? (
                      <Badge variant="default" className="bg-green-500/20 text-green-700 border-green-500/30 dark:text-green-400 dark:border-green-700/50 flex items-center gap-1 font-medium"><ShieldCheck className="h-3.5 w-3.5"/>Yes</Badge>
                    ) : (
                      <Badge variant="outline" className="border-yellow-500/30 text-yellow-700 dark:text-yellow-500 flex items-center gap-1 font-medium"><ShieldCheck className="h-3.5 w-3.5"/>No</Badge>
                    )}
                  </TableCell>
                  <TableCell className="whitespace-nowrap px-3 py-4 text-sm text-foreground hidden lg:table-cell">{user.currency} {user.balance?.toFixed(2) || '0.00'}</TableCell>
                  <TableCell className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground">
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-popover shadow-xl">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => handleEditUser(user.id)}>
                          <Edit2 className="mr-2 h-4 w-4" /> Edit User
                        </DropdownMenuItem>
                        {!user.isVerified && user.status === 'pending_verification' && (
                          <DropdownMenuItem onClick={() => handleVerifyKYC(user.id)}>
                            <UserCheck className="mr-2 h-4 w-4" /> Approve KYC
                          </DropdownMenuItem>
                        )}
                         <DropdownMenuItem onClick={() => handleManualBalance(user.id)}>
                          <DollarSign className="mr-2 h-4 w-4" /> Adjust Balance
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuLabel>Set Role</DropdownMenuLabel>
                        {['User', 'Agent', 'Admin'].map(role => (
                            <DropdownMenuItem key={role} onClick={() => handleSetRole(user.id, role as AdminManagedUser['role'])} disabled={user.role === role}>
                                {user.role === role && <Check className="mr-2 h-4 w-4" />} Set as {role}
                            </DropdownMenuItem>
                        ))}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleSuspendUser(user.id)} className={user.status === 'suspended' ? "text-green-600 focus:text-green-700 dark:text-green-400 dark:focus:text-green-300" : "text-destructive focus:text-destructive"}>
                           {user.status === 'suspended' ? <UserCheck className="mr-2 h-4 w-4" /> : <UserX className="mr-2 h-4 w-4" />}
                           {user.status === 'suspended' ? 'Unblock User' : 'Block User'}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow>
                  <TableCell colSpan={9} className="h-24 text-center text-muted-foreground">
                    No users found matching your search.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
