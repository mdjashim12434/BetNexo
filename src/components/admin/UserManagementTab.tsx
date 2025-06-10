
'use client';

import { useState, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { MoreHorizontal, Edit2, ShieldCheck, UserX, UserCheck, DollarSign, Phone, Mail } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { User } from '@/contexts/AuthContext'; // Assuming User type includes currency

interface AdminManagedUser extends User {
  role: 'User' | 'Agent' | 'Admin';
  status: 'active' | 'suspended' | 'pending_verification';
  balance: number; // Explicitly add balance here if not in base User type for admin view
}

const mockUsersData: AdminManagedUser[] = [
  { id: 'user001', name: 'Alice Wonderland', email: 'alice@example.com', phone: '123-456-7890', role: 'User', status: 'active', isVerified: true, currency: 'USD', balance: 1250.75 },
  { id: 'user002', name: 'Bob The Builder', email: 'bob@example.com', phone: '987-654-3210', role: 'Agent', status: 'active', isVerified: false, currency: 'BDT', balance: 58000.00 },
  { id: 'user003', name: 'Charlie Brown', email: 'charlie@example.com', phone: '555-123-4567', role: 'Admin', status: 'active', isVerified: true, currency: 'INR', balance: 150000.50 },
  { id: 'user004', name: 'Diana Prince', email: 'diana@example.com', phone: '222-333-4444', role: 'User', status: 'suspended', isVerified: true, currency: 'EUR', balance: 300.00 },
  { id: 'user005', name: 'Edward Scissorhands', email: 'edward@example.com', phone: '777-888-9999', role: 'User', status: 'pending_verification', isVerified: false, currency: 'GBP', balance: 50.20 },
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
    // Mock action
    setUsers(prevUsers => prevUsers.map(u => u.id === userId ? {...u, isVerified: true, status: 'active'} : u));
    toast({ title: `User ${type} Verified`, description: `User ID ${userId} ${type.toLowerCase()} has been marked as verified.` });
  };

  const handleEditUser = (userId: string) => {
    // Mock action - In a real app, this would open a dialog/form
    toast({ title: 'Edit User', description: `Initiating edit for user ID ${userId}. (Dialog not implemented yet)` });
  };
  
  const handleSetRole = (userId: string, role: AdminManagedUser['role']) => {
    setUsers(prevUsers => prevUsers.map(u => u.id === userId ? {...u, role} : u));
    toast({ title: 'User Role Updated', description: `User ID ${userId} role set to ${role}.` });
  };

  const handleSuspendUser = (userId: string) => {
    setUsers(prevUsers => prevUsers.map(u => u.id === userId ? {...u, status: u.status === 'suspended' ? 'active' : 'suspended' } : u));
    const newStatus = users.find(u => u.id === userId)?.status === 'suspended' ? 'unsuspended' : 'suspended';
    toast({ title: `User ${newStatus}`, description: `User ID ${userId} has been ${newStatus}.` });
  };

  const handleManualBalance = (userId: string) => {
    // Mock action
     toast({ title: 'Manual Balance Adjustment', description: `Opening balance adjustment for user ID ${userId}. (Dialog not implemented yet)` });
  };


  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline text-xl">Manage Users</CardTitle>
        <div className="mt-4">
          <Input
            placeholder="Search users by name, email, phone, or ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User ID</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Verified</TableHead>
              <TableHead>Balance</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="font-medium">{user.id}</TableCell>
                <TableCell>{user.name || 'N/A'}</TableCell>
                <TableCell>
                  <div className="flex flex-col text-xs">
                    {user.email && <span className="flex items-center gap-1"><Mail className="h-3 w-3 text-muted-foreground"/> {user.email}</span>}
                    {user.phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3 text-muted-foreground"/> {user.phone}</span>}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={user.role === 'Admin' ? 'default' : user.role === 'Agent' ? 'secondary' : 'outline'}>
                    {user.role}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={user.status === 'active' ? 'default' : user.status === 'suspended' ? 'destructive' : 'outline'} className={user.status === 'active' ? 'bg-green-500/20 text-green-700 border-green-500' : ''}>
                    {user.status.replace('_', ' ')}
                  </Badge>
                </TableCell>
                <TableCell>
                  {user.isVerified ? (
                    <Badge variant="default" className="bg-green-500/20 text-green-700 border-green-500 flex items-center gap-1"><ShieldCheck className="h-3 w-3"/>Yes</Badge>
                  ) : (
                    <Badge variant="outline" className="flex items-center gap-1"><ShieldCheck className="h-3 w-3 text-yellow-600"/>No</Badge>
                  )}
                </TableCell>
                <TableCell>{user.balance.toFixed(2)} {user.currency}</TableCell>
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
                          <UserCheck className="mr-2 h-4 w-4" /> Verify ID
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
                      <DropdownMenuItem onClick={() => handleSuspendUser(user.id)} className={user.status === 'suspended' ? "text-green-600 focus:text-green-700" : "text-destructive focus:text-destructive"}>
                        <UserX className="mr-2 h-4 w-4" /> {user.status === 'suspended' ? 'Unsuspend' : 'Suspend'} User
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {filteredUsers.length === 0 && <p className="text-center text-muted-foreground py-4">No users found.</p>}
      </CardContent>
    </Card>
  );
}
