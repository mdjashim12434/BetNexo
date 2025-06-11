
'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DollarSign, TrendingUp, TrendingDown, Search } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

// Mock data structure, replace with actual data fetching
interface UserBalance {
  id: string;
  name: string;
  email: string;
  balance: number;
  currency: string;
}

const mockUserBalances: UserBalance[] = [
  { id: 'user001', name: 'Alice Wonderland', email: 'alice@example.com', balance: 1250.75, currency: 'USD' },
  { id: 'user002', name: 'Bob The Builder', email: 'bob@example.com', balance: 58000.00, currency: 'BDT' },
  { id: 'user003', name: 'Charlie Brown', email: 'charlie@example.com', balance: 150000.50, currency: 'INR' },
];


export default function BalanceControlTab() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserBalance | null>(null);
  const [amount, setAmount] = useState('');
  const { toast } = useToast();

  const filteredUsers = mockUserBalances.filter(user =>
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

    // Mock balance adjustment
    console.log(`${type === 'add' ? 'Adding' : 'Deducting'} ${numAmount} ${selectedUser.currency} for ${selectedUser.name}`);
    toast({
      title: "Balance Adjusted (Mock)",
      description: `${numAmount.toFixed(2)} ${selectedUser.currency} has been ${type === 'add' ? 'added to' : 'deducted from'} ${selectedUser.name}'s account.`
    });
    setSelectedUser(null); // Reset selection
    setAmount('');
  };


  return (
    <Card className="shadow-xl bg-card min-h-full">
      <CardHeader className="border-b">
        <CardTitle className="font-headline text-2xl flex items-center text-primary">
          <DollarSign className="mr-3 h-7 w-7" /> Balance Sheet
        </CardTitle>
        <p className="text-muted-foreground text-sm">View and manage user balances.</p>
      </CardHeader>
      <CardContent className="pt-6 space-y-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="Search users by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 w-full md:w-1/2 lg:w-1/3"
          />
        </div>

        {selectedUser ? (
          <Card className="bg-muted/30 p-6 rounded-lg">
            <CardTitle className="text-xl mb-1">Adjust Balance for: {selectedUser.name}</CardTitle>
            <p className="text-sm text-muted-foreground mb-4">Current Balance: {selectedUser.balance.toFixed(2)} {selectedUser.currency}</p>
            <div className="flex flex-col sm:flex-row gap-4 items-end">
              <div className="flex-grow">
                <label htmlFor="adjustAmount" className="block text-xs font-medium text-muted-foreground mb-1">Amount ({selectedUser.currency})</label>
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
              <Button onClick={() => handleAdjustBalance('deduct')} variant="destructive" className="w-full sm:w-auto">
                <TrendingDown className="mr-2 h-4 w-4" /> Deduct Balance
              </Button>
            </div>
            <Button variant="outline" size="sm" onClick={() => setSelectedUser(null)} className="mt-4">Cancel</Button>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredUsers.length > 0 ? filteredUsers.map(user => (
              <div key={user.id} className="flex flex-col sm:flex-row justify-between items-center p-3 border rounded-md hover:bg-muted/20">
                <div>
                  <p className="font-semibold text-foreground">{user.name} <span className="text-xs text-muted-foreground">({user.email})</span></p>
                  <p className="text-sm text-foreground">Balance: <span className="font-bold">{user.balance.toFixed(2)} {user.currency}</span></p>
                </div>
                <Button variant="outline" size="sm" onClick={() => setSelectedUser(user)} className="mt-2 sm:mt-0">
                  Adjust Balance
                </Button>
              </div>
            )) : (
              <p className="text-center text-muted-foreground py-4">No users found matching your search.</p>
            )}
          </div>
        )}

        <div className="mt-8 p-6 border-2 border-dashed border-border rounded-lg text-center">
            <h3 className="text-lg font-semibold text-foreground">Additional Features Coming Soon</h3>
            <p className="text-sm text-muted-foreground">Deposit/withdraw limit settings and more detailed balance history will be added here.</p>
        </div>
      </CardContent>
    </Card>
  );
}
