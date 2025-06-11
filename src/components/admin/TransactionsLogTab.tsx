
'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge';
import { CheckCircle, XCircle, Clock, History, DollarSign, Users, TrendingUp, TrendingDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from '@/lib/utils';

type TransactionStatus = 'pending' | 'approved' | 'rejected';
type TransactionType = 'deposit' | 'withdrawal';

interface Transaction {
  id: string;
  userId: string;
  userName: string;
  amount: number;
  currency: string;
  method: string;
  type: TransactionType;
  status: TransactionStatus;
  date: string;
}

const initialMockTransactions: Transaction[] = [
  { id: 'txn001', userId: 'user001', userName: 'Alice W.', amount: 100, currency: 'USD', method: 'Bkash', type: 'deposit', status: 'pending', date: '2024-06-12 10:00' },
  { id: 'txn002', userId: 'user002', userName: 'Bob B.', amount: 50, currency: 'BDT', method: 'Nagad', type: 'withdrawal', status: 'approved', date: '2024-06-12 09:30' },
  { id: 'txn003', userId: 'user003', userName: 'Charlie B.', amount: 200, currency: 'INR', method: 'Bank Transfer', type: 'deposit', status: 'rejected', date: '2024-06-11 15:00' },
  { id: 'txn004', userId: 'user001', userName: 'Alice W.', amount: 75, currency: 'USD', method: 'Rocket', type: 'withdrawal', status: 'pending', date: '2024-06-12 11:00' },
  { id: 'txn005', userId: 'user004', userName: 'Diana P.', amount: 1000, currency: 'EUR', method: 'UPI', type: 'deposit', status: 'pending', date: '2024-06-12 11:30' },
];

export default function TransactionsLogTab() {
  const [transactions, setTransactions] = useState<Transaction[]>(initialMockTransactions);
  const { toast } = useToast();

  const handleAction = (transactionId: string, newStatus: TransactionStatus) => {
    setTransactions(prevTransactions =>
      prevTransactions.map(txn =>
        txn.id === transactionId ? { ...txn, status: newStatus } : txn
      )
    );
    toast({
      title: `Transaction ${newStatus.charAt(0).toUpperCase() + newStatus.slice(1)}`,
      description: `Transaction ID ${transactionId} has been ${newStatus}.`,
    });
  };

  const getStatusBadgeVariant = (status: TransactionStatus) => {
    switch (status) {
      case 'approved': return 'default'; // Greenish
      case 'pending': return 'outline'; // Yellowish/Orange
      case 'rejected': return 'destructive'; // Reddish
      default: return 'secondary';
    }
  };

  const getStatusIcon = (status: TransactionStatus) => {
    switch (status) {
      case 'approved': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'pending': return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'rejected': return <XCircle className="h-4 w-4 text-red-500" />;
      default: return null;
    }
  };

  return (
    <Card className="shadow-xl bg-card min-h-full">
      <CardHeader className="border-b">
        <CardTitle className="font-headline text-2xl flex items-center text-primary">
          <History className="mr-3 h-7 w-7" /> Transaction Logs
        </CardTitle>
        <CardDescription>View and manage all user deposit and withdrawal requests.</CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        {/* Add filters here in the future if needed (e.g., by status, type) */}
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.length > 0 ? transactions.map((txn) => (
                <TableRow key={txn.id} className="hover:bg-muted/50">
                  <TableCell className="font-medium text-xs">{txn.id}</TableCell>
                  <TableCell>
                    <div>{txn.userName}</div>
                    <div className="text-xs text-muted-foreground">{txn.userId}</div>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant={txn.type === 'deposit' ? 'secondary' : 'outline'}
                      className={cn("capitalize font-medium", {
                        'bg-green-500/10 text-green-700 border-green-500/30 dark:text-green-400 dark:border-green-700/50': txn.type === 'deposit',
                        'bg-blue-500/10 text-blue-700 border-blue-500/30 dark:text-blue-400 dark:border-blue-700/50': txn.type === 'withdrawal',
                      })}
                    >
                      {txn.type}
                    </Badge>
                  </TableCell>
                  <TableCell>{txn.amount.toFixed(2)} {txn.currency}</TableCell>
                  <TableCell>{txn.method}</TableCell>
                  <TableCell className="text-xs">{txn.date}</TableCell>
                  <TableCell>
                    <Badge 
                      variant={getStatusBadgeVariant(txn.status)}
                      className={cn("capitalize font-medium flex items-center gap-1.5", {
                        'bg-green-500/20 text-green-700 border-green-500/30 dark:text-green-400 dark:border-green-700/50': txn.status === 'approved',
                        'bg-yellow-500/20 text-yellow-700 border-yellow-500/30 dark:text-yellow-400 dark:border-yellow-700/50': txn.status === 'pending',
                         // Destructive variant handles its own red styling for rejected
                      })}
                    >
                      {getStatusIcon(txn.status)}
                      {txn.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {txn.status === 'pending' ? (
                      <div className="flex gap-2 justify-end">
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-green-500 text-green-500 hover:bg-green-500/10 hover:text-green-600"
                          onClick={() => handleAction(txn.id, 'approved')}
                        >
                          <CheckCircle className="mr-1.5 h-4 w-4" /> Approve
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-red-500 text-red-500 hover:bg-red-500/10 hover:text-red-600"
                          onClick={() => handleAction(txn.id, 'rejected')}
                        >
                          <XCircle className="mr-1.5 h-4 w-4" /> Reject
                        </Button>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground italic">Processed</span>
                    )}
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow>
                  <TableCell colSpan={8} className="h-24 text-center">
                    No transactions found.
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

    