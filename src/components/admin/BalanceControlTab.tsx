
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DollarSign, TrendingUp, TrendingDown, Search, User, Users } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface UserBalance {
  id: string;
  name: string;
  email: string;
  balance: number;
  currency: string;
}

const initialMockUserBalances: UserBalance[] = [
  { id: 'user001', name: 'Alice Wonderland', email: 'alice@example.com', balance: 1250.75, currency: 'USD' },
  { id: 'user002', name: 'Bob The Builder', email: 'bob@example.com', balance: 58000.00, currency: 'BDT' },
  { id: 'user003', name: 'Charlie Brown', email: 'charlie@example.com', balance: 150000.50, currency: 'INR' },
];

export default function BalanceControlTab() {
  const [searchTerm, setSearchTerm] = useState('');
  const [userBalances, setUserBalances] = useState<UserBalance[]>(initialMockUserBalances);
  const [selectedUser, setSelectedUser] = useState<UserBalance | null>(null);
  const [amount, setAmount] = useState('');
  const { toast } = useToast();

  const filteredUsers = userBalances.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAdjustBalance = (type: 'add' | 'deduct') => {
    if (!selectedUser || !amount) {
      toast({ title: "Error", description: "Please select a user and enter an amount.", variant: "destructive" });
      return;
    }
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      toast({ title: "Invalid Amount", description: "Please enter a valid positive amount.", variant: "destructive" });
      return;
    }

    setUserBalances(prevBalances => 
      prevBalances.map(user => {
        if (user.id === selectedUser.id) {
          const newBalance = type === 'add' ? user.balance + numAmount : user.balance - numAmount;
          if (newBalance < 0 && type === 'deduct') {
            toast({ title: "Insufficient Balance", description: `${user.name} does not have enough balance to deduct ${numAmount.toFixed(2)} ${user.currency}.`, variant: "destructive" });
            return user; // Return original user if deduction makes balance negative
          }
          toast({
            title: "Balance Adjusted",
            description: `${numAmount.toFixed(2)} ${user.currency} has been ${type === 'add' ? 'added to' : 'deducted from'} ${user.name}'s account.`
          });
          return { ...user, balance: newBalance };
        }
        return user;
      })
    );
    
    // Update selectedUser's balance if it was the one modified
    if (selectedUser) {
        const updatedSelectedUser = userBalances.find(u => u.id === selectedUser.id);
        if(updatedSelectedUser){
             const currentBalance = type === 'add' ? selectedUser.balance + numAmount : selectedUser.balance - numAmount;
             if (currentBalance >= 0 || type === 'add') {
                setSelectedUser({ ...selectedUser, balance: currentBalance });
             }
        }
    }
    setAmount(''); // Reset amount after action
  };

  const handleUserSelect = (user: UserBalance) => {
    setSelectedUser(user);
    setAmount(''); // Reset amount when user changes
  };

  return (
    <Card className="shadow-xl bg-card min-h-full">
      <CardHeader className="border-b">
        <CardTitle className="font-headline text-2xl flex items-center text-primary">
          <DollarSign className="mr-3 h-7 w-7" /> Balance Sheet
        </CardTitle>
        <CardDescription>View and manually adjust user balances.</CardDescription>
      </CardHeader>
      <CardContent className="pt-6 space-y-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="Search users by name or email..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setSelectedUser(null); // Clear selected user on new search
            }}
            className="pl-10 w-full md:w-1/2 lg:w-1/3"
          />
        </div>

        {selectedUser ? (
          <Card className="bg-muted/30 p-6 rounded-lg">
            <div className="flex justify-between items-start">
                <div>
                    <CardTitle className="text-xl mb-1 flex items-center">
                        <User className="mr-2 h-5 w-5"/> Adjust Balance for: {selectedUser.name}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground mb-4">Current Balance: {selectedUser.balance.toFixed(2)} {selectedUser.currency}</p>
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
                />
              </div>
              <Button onClick={() => handleAdjustBalance('add')} className="bg-green-600 hover:bg-green-700 text-white w-full sm:w-auto">
                <TrendingUp className="mr-2 h-4 w-4" /> Add Balance
              </Button>
              <Button onClick={() => handleAdjustBalance('deduct')} variant="destructive" className="w-full sm:w-auto" disabled={selectedUser.balance - parseFloat(amount) < 0 && parseFloat(amount) > 0}>
                <TrendingDown className="mr-2 h-4 w-4" /> Deduct Balance
              </Button>
            </div>
             {selectedUser.balance - parseFloat(amount) < 0 && parseFloat(amount) > 0 && (
                <p className="text-xs text-destructive mt-2 text-right">Deduction exceeds available balance.</p>
            )}
          </Card>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {filteredUsers.length > 0 ? filteredUsers.map(user => (
              <Card key={user.id} className="p-4 hover:bg-muted/20 transition-colors">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
                  <div>
                    <p className="font-semibold text-foreground">{user.name}</p>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                  </div>
                  <div className="mt-2 sm:mt-0 text-right sm:text-left">
                     <p className="text-sm text-foreground">Balance: <span className="font-bold">{user.balance.toFixed(2)} {user.currency}</span></p>
                     <Button variant="outline" size="sm" onClick={() => handleUserSelect(user)} className="mt-1 w-full sm:w-auto">
                      Adjust Balance
                    </Button>
                  </div>
                </div>
              </Card>
            )) : (
              <div className="text-center text-muted-foreground py-10 border-2 border-dashed border-border rounded-lg">
                <Users className="mx-auto h-12 w-12 text-muted-foreground/50 mb-2"/>
                <p>No users found matching your search.</p>
                <p className="text-xs">Try a different name or email.</p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

    