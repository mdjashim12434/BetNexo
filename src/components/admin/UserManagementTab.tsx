
'use client';

import { useState, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { MoreHorizontal, Edit2, ShieldCheck, UserX, UserCheck, DollarSign, Phone, Mail, Search } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { User } from '@/contexts/AuthContext'; 
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface AdminManagedUser extends User {
  role: 'User' | 'Agent' | 'Admin';
  status: 'active' | 'suspended' | 'pending_verification';
  balance: number; 
  lastLogin?: string; // Example additional field
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

  const handleVerifyUser = (userId: string, type: 'ID' | 'Phone' | 'Email') => {
    setUsers(prevUsers => prevUsers.map(u => u.id === userId ? {...u, isVerified: true, status: 'active'} : u));
    toast({ title: `User ${type} Verified`, description: `User ID ${userId} ${type.toLowerCase()} has been marked as verified. (Mock)` });
  };

  const handleEditUser = (userId: string) => {
    toast({ title: 'Edit User (Mock)', description: `Opening edit dialog for user ID ${userId}.` });
  };
  
  const handleSetRole = (userId: string, role: AdminManagedUser['role']) => {
    setUsers(prevUsers => prevUsers.map(u => u.id === userId ? {...u, role} : u));
    toast({ title: 'User Role Updated (Mock)', description: `User ID ${userId} role set to ${role}.` });
  };

  const handleSuspendUser = (userId: string) => {
    setUsers(prevUsers => prevUsers.map(u => u.id === userId ? {...u, status: u.status === 'suspended' ? 'active' : 'suspended' } : u));
    const newStatus = users.find(u => u.id === userId)?.status === 'suspended' ? 'unsuspended' : 'suspended';
    toast({ title: `User ${newStatus} (Mock)`, description: `User ID ${userId} has been ${newStatus}.` });
  };

  const handleManualBalance = (userId: string) => {
     toast({ title: 'Manual Balance (Mock)', description: `Opening balance adjustment for user ID ${userId}.` });
  };

  return (
    <Card className="shadow-md">
      <CardHeader className="border-b">
        <CardTitle className="font-headline text-xl">Manage Users</CardTitle>
        <div className="mt-4 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="Search users by name, email, phone, or ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm pl-10"
          />
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">User ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Verified</TableHead>
                <TableHead>Balance</TableHead>
                <TableHead>Last Login</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.length > 0 ? filteredUsers.map((user) => (
                <TableRow key={user.id} className="hover:bg-muted/50">
                  <TableCell className="font-medium text-xs">{user.id}</TableCell>
                  <TableCell>{user.name || 'N/A'}</TableCell>
                  <TableCell>
                    <div className="flex flex-col text-xs">
                      {user.email && <span className="flex items-center gap-1 whitespace-nowrap"><Mail className="h-3 w-3 text-muted-foreground"/> {user.email}</span>}
                      {user.phone && <span className="flex items-center gap-1 whitespace-nowrap"><Phone className="h-3 w-3 text-muted-foreground"/> {user.phone}</span>}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant={user.role === 'Admin' ? 'default' : user.role === 'Agent' ? 'secondary' : 'outline'}
                      className={`capitalize ${user.role === 'Admin' ? 'bg-primary/80 hover:bg-primary' : user.role === 'Agent' ? 'bg-accent text-accent-foreground hover:bg-accent/90' : ''}`}
                    >
                      {user.role}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant={user.status === 'active' ? 'default' : user.status === 'suspended' ? 'destructive' : 'outline'} 
                      className={`capitalize ${user.status === 'active' ? 'bg-green-600/20 text-green-700 border-green-500 dark:bg-green-500/10 dark:text-green-400 dark:border-green-700' : user.status === 'suspended' ? 'bg-red-600/20 text-red-700 border-red-500 dark:bg-red-500/10 dark:text-red-400 dark:border-red-700' : ''}`}
                    >
                      {user.status.replace('_', ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {user.isVerified ? (
                      <Badge variant="default" className="bg-green-600/20 text-green-700 border-green-500 dark:bg-green-500/10 dark:text-green-400 dark:border-green-700 flex items-center gap-1"><ShieldCheck className="h-3 w-3"/>Yes</Badge>
                    ) : (
                      <Badge variant="outline" className="flex items-center gap-1"><ShieldCheck className="h-3 w-3 text-yellow-600 dark:text-yellow-500"/>No</Badge>
                    )}
                  </TableCell>
                  <TableCell className="whitespace-nowrap">{user.currency} {user.balance.toFixed(2)}</TableCell>
                  <TableCell className="text-xs text-muted-foreground whitespace-nowrap">{user.lastLogin || 'N/A'}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => handleEditUser(user.id)}>
                          <Edit2 className="mr-2 h-4 w-4" /> Edit User
                        </DropdownMenuItem>
                        {!user.isVerified && (
                          <DropdownMenuItem onClick={() => handleVerifyUser(user.id, 'ID')}>
                            <UserCheck className="mr-2 h-4 w-4" /> Approve KYC
                          </DropdownMenuItem>
                        )}
                         <DropdownMenuItem onClick={() => handleManualBalance(user.id)}>
                          <DollarSign className="mr-2 h-4 w-4" /> Adjust Balance
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuLabel>Set Role</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => handleSetRole(user.id, 'User')}>User</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleSetRole(user.id, 'Agent')}>Agent</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleSetRole(user.id, 'Admin')}>Admin</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleSuspendUser(user.id)} className={user.status === 'suspended' ? "text-green-600 focus:text-green-700 dark:text-green-400 dark:focus:text-green-300" : "text-destructive focus:text-destructive"}>
                          <UserX className="mr-2 h-4 w-4" /> {user.status === 'suspended' ? 'Unsuspend' : 'Suspend'} User
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
