
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DollarSign, TrendingUp, TrendingDown, Search, User, Users, RefreshCw, Loader2 } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { useAuth, type User } from "@/contexts/AuthContext";
import { db, collection, getDocs, doc, writeBatch, serverTimestamp } from '@/lib/firebase';
import { cn } from "@/lib/utils";

// We will use the User type from AuthContext as it's comprehensive.
type AdminManagedUser = User;

export default function BalanceControlTab() {
  const { user: adminUser } = useAuth(); // Get current admin user
  const { toast } = useToast();

  const [searchTerm, setSearchTerm] = useState('');
  const [allUsers, setAllUsers] = useState<AdminManagedUser[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<AdminManagedUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  
  const [selectedUser, setSelectedUser] = useState<AdminManagedUser | null>(null);
  const [amount, setAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchUsers = useCallback(async () => {
    setLoadingUsers(true);
    try {
      const usersCollection = collection(db, 'users');
      const usersSnapshot = await getDocs(usersCollection);
      const usersList = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AdminManagedUser));
      setAllUsers(usersList);
      setFilteredUsers(usersList);
    } catch (error: any) {
      toast({ title: "Error", description: "Could not fetch user data. " + error.message, variant: "destructive" });
    } finally {
      setLoadingUsers(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);
  
  useEffect(() => {
    if (!searchTerm) {
      setFilteredUsers(allUsers);
      return;
    }
    const lowercasedFilter = searchTerm.toLowerCase();
    const results = allUsers.filter(user =>
      user.name?.toLowerCase().includes(lowercasedFilter) ||
      user.email?.toLowerCase().includes(lowercasedFilter) ||
      user.customUserId?.toString().includes(lowercasedFilter)
    );
    setFilteredUsers(results);
  }, [searchTerm, allUsers]);

  const handleAdjustBalance = async (type: 'add' | 'deduct') => {
    if (!selectedUser || !selectedUser.customUserId || !amount || !adminUser) {
      toast({ title: "Error", description: "A user must be selected and an amount entered.", variant: "destructive" });
      return;
    }
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      toast({ title: "Invalid Amount", description: "Please enter a valid positive amount.", variant: "destructive" });
      return;
    }
    
    if (type === 'deduct' && (selectedUser.balance || 0) < numAmount) {
      toast({ title: "Insufficient Balance", description: `${selectedUser.name} does not have enough balance to deduct ${numAmount.toFixed(2)} ${selectedUser.currency}.`, variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    try {
      const batch = writeBatch(db);
      
      const userDocRef = doc(db, "users", selectedUser.id);
      const newBalance = type === 'add' ? (selectedUser.balance || 0) + numAmount : (selectedUser.balance || 0) - numAmount;
      batch.update(userDocRef, { balance: newBalance });
      
      const transactionDocRef = doc(collection(db, "transactions"));
      const newTransaction = {
        userId: selectedUser.customUserId,
        userName: selectedUser.name || selectedUser.email,
        amount: numAmount,
        currency: selectedUser.currency || 'N/A',
        method: 'Manual Adjustment',
        type: type === 'add' ? 'deposit' : 'withdrawal',
        status: 'approved',
        requestedAt: serverTimestamp(),
        processedAt: serverTimestamp(),
        processedBy: adminUser.id,
        adminNotes: `Manual ${type === 'add' ? 'deposit' : 'withdrawal'} by admin: ${adminUser.name || adminUser.email}.`
      };
      batch.set(transactionDocRef, newTransaction);
      
      await batch.commit();

      toast({
        title: "Balance Adjusted",
        description: `${numAmount.toFixed(2)} ${selectedUser.currency} has been ${type === 'add' ? 'added to' : 'deducted from'} ${selectedUser.name}'s account.`
      });

      const updatedUser = { ...selectedUser, balance: newBalance };
      setSelectedUser(updatedUser);
      setAllUsers(prev => prev.map(u => u.id === selectedUser.id ? updatedUser : u));
      setAmount('');
      
    } catch (error: any) {
      console.error("Error adjusting balance:", error);
      toast({ title: "Action Failed", description: "Could not adjust balance. " + error.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUserSelect = (user: AdminManagedUser) => {
    setSelectedUser(user);
    setAmount('');
  };

  return (
    <Card className="shadow-xl bg-card min-h-full">
      <CardHeader className="border-b flex flex-row items-center justify-between">
        <div>
          <CardTitle className="font-headline text-2xl flex items-center text-primary">
            <DollarSign className="mr-3 h-7 w-7" /> Balance Control
          </CardTitle>
          <CardDescription>View and manually adjust user balances via deposits or withdrawals.</CardDescription>
        </div>
        <Button onClick={fetchUsers} variant="outline" size="icon" disabled={loadingUsers}>
          <RefreshCw className={cn("h-4 w-4", { "animate-spin": loadingUsers })} />
        </Button>
      </CardHeader>
      <CardContent className="pt-6 space-y-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="Search users by name, email, or User ID..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setSelectedUser(null);
            }}
            className="pl-10 w-full md:w-1/2 lg:w-1/3"
          />
        </div>

        {loadingUsers ? (
          <div className="text-center py-10 flex items-center justify-center"><Loader2 className="mr-2 h-6 w-6 animate-spin" />Loading Users...</div>
        ) : selectedUser ? (
          <Card className="bg-muted/30 p-6 rounded-lg">
            <div className="flex justify-between items-start">
                <div>
                    <CardTitle className="text-xl mb-1 flex items-center">
                        <User className="mr-2 h-5 w-5"/> Adjust Balance for: {selectedUser.name}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground mb-4">Current Balance: {(selectedUser.balance || 0).toFixed(2)} {selectedUser.currency}</p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setSelectedUser(null)} className="text-xs">Change User</Button>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 items-end mt-2">
              <div className="flex-grow">
                <label htmlFor="adjustAmount" className="block text-xs font-medium text-foreground mb-1">Amount ({selectedUser.currency})</label>
                <Input
                  id="adjustAmount"
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Enter amount"
                  min="0.01"
                  step="0.01"
                  disabled={isSubmitting}
                />
              </div>
              <Button onClick={() => handleAdjustBalance('add')} className="bg-green-600 hover:bg-green-700 text-white w-full sm:w-auto" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <TrendingUp className="mr-2 h-4 w-4" />} Manual Deposit
              </Button>
              <Button onClick={() => handleAdjustBalance('deduct')} variant="destructive" className="w-full sm:w-auto" disabled={isSubmitting || (selectedUser.balance || 0) < parseFloat(amount)}>
                 {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <TrendingDown className="mr-2 h-4 w-4" />} Manual Withdrawal
              </Button>
            </div>
          </Card>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {filteredUsers.length > 0 ? filteredUsers.map(user => (
              <Card key={user.id} className="p-4 hover:bg-muted/20 transition-colors">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
                  <div>
                    <p className="font-semibold text-foreground">{user.name}</p>
                    <p className="text-xs text-muted-foreground">{user.email} (ID: {user.customUserId})</p>
                  </div>
                  <div className="mt-2 sm:mt-0 text-right sm:text-left">
                     <p className="text-sm text-foreground">Balance: <span className="font-bold">{(user.balance || 0).toFixed(2)} {user.currency}</span></p>
                     <Button variant="outline" size="sm" onClick={() => handleUserSelect(user)} className="mt-1 w-full sm:w-auto">
                      Adjust Balance
                    </Button>
                  </div>
                </div>
              </Card>
            )) : (
              <div className="text-center text-muted-foreground py-10 border-2 border-dashed border-border rounded-lg">
                <Users className="mx-auto h-12 w-12 text-muted-foreground/50 mb-2"/>
                <p>No users found.</p>
                <p className="text-xs">{searchTerm ? 'Try a different search term.' : 'The database may be empty.'}</p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
