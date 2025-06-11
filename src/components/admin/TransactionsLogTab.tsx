
'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Clock, History, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from '@/lib/utils';
import { db, collection, query, orderBy, getDocs, doc, updateDoc, serverTimestamp, Timestamp, updateUserBalanceInFirestore } from '@/lib/firebase';
import { format } from 'date-fns';


export type TransactionStatus = 'pending' | 'approved' | 'rejected';
export type TransactionType = 'deposit' | 'withdrawal';

export interface Transaction {
  id: string; // Firestore document ID
  userId: string;
  userName: string;
  amount: number;
  currency: string;
  method: string;
  type: TransactionType;
  status: TransactionStatus;
  requestedAt: Timestamp; // Firestore Timestamp
  processedAt?: Timestamp;
  accountDetails?: string; // For withdrawals
  transactionId?: string; // Optional gateway transaction ID for deposits
}


export default function TransactionsLogTab() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    try {
      const q = query(collection(db, "transactions"), orderBy("requestedAt", "desc"));
      const querySnapshot = await getDocs(q);
      const fetchedTransactions: Transaction[] = [];
      querySnapshot.forEach((doc) => {
        fetchedTransactions.push({ id: doc.id, ...doc.data() } as Transaction);
      });
      setTransactions(fetchedTransactions);
    } catch (error) {
      console.error("Error fetching transactions: ", error);
      toast({ title: "Error", description: "Could not fetch transaction logs.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const handleAction = async (transaction: Transaction, newStatus: 'approved' | 'rejected') => {
    const transactionDocRef = doc(db, "transactions", transaction.id);
    try {
      if (newStatus === 'approved') {
        if (transaction.type === 'deposit') {
          await updateUserBalanceInFirestore(transaction.userId, transaction.amount);
        } else if (transaction.type === 'withdrawal') {
          // Check balance before deducting for withdrawal, though initial check was on user side
          const userDocRef = doc(db, "users", transaction.userId);
          const userDocSnap = await getDoc(userDocRef); // Re-fetch for current balance
          if (userDocSnap.exists()) {
            const userData = userDocSnap.data();
            if ((userData.balance || 0) < transaction.amount) {
               toast({ title: "Action Failed", description: `User ${transaction.userName} has insufficient balance for this withdrawal. Balance: ${userData.currency} ${(userData.balance || 0).toFixed(2)}`, variant: "destructive" });
               // Optionally set status to rejected or keep pending for re-evaluation
               await updateDoc(transactionDocRef, { status: 'rejected', processedAt: serverTimestamp() });
               fetchTransactions(); // Re-fetch to update UI
               return;
            }
          }
          await updateUserBalanceInFirestore(transaction.userId, -transaction.amount);
        }
      }
      // For both approved and rejected, update transaction status
      await updateDoc(transactionDocRef, { status: newStatus, processedAt: serverTimestamp() });
      
      toast({
        title: `Transaction ${newStatus}`,
        description: `Transaction ID ${transaction.id} has been ${newStatus}. User balance updated accordingly for approvals.`,
      });
      fetchTransactions(); // Re-fetch to update UI
    } catch (error: any) {
      console.error(`Error ${newStatus} transaction: `, error);
      toast({ title: "Action Failed", description: `Could not ${newStatus} transaction ${transaction.id}. ${error.message}`, variant: "destructive" });
    }
  };

  const getStatusBadgeVariant = (status: TransactionStatus) => {
    switch (status) {
      case 'approved': return 'default';
      case 'pending': return 'outline';
      case 'rejected': return 'destructive';
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
  
  const formatDate = (timestamp?: Timestamp) => {
    if (!timestamp) return 'N/A';
    try {
      return format(timestamp.toDate(), 'PPpp'); // Example format: Jun 12, 2024, 10:00:00 AM
    } catch (e) {
        return 'Invalid Date';
    }
  };


  return (
    <Card className="shadow-xl bg-card min-h-full">
      <CardHeader className="border-b flex flex-row justify-between items-center">
        <div>
          <CardTitle className="font-headline text-2xl flex items-center text-primary">
            <History className="mr-3 h-7 w-7" /> Transaction Logs
          </CardTitle>
          <CardDescription>View and manage all user deposit and withdrawal requests.</CardDescription>
        </div>
        <Button variant="outline" size="icon" onClick={fetchTransactions} disabled={loading}>
          <RefreshCw className={cn("h-4 w-4", {"animate-spin": loading})} />
        </Button>
      </CardHeader>
      <CardContent className="pt-6">
        {loading ? (
          <div className="text-center py-10">Loading transactions...</div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Requested At</TableHead>
                  <TableHead>Processed At</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Details</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.length > 0 ? transactions.map((txn) => (
                  <TableRow key={txn.id} className="hover:bg-muted/50">
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
                    <TableCell className="text-xs">{formatDate(txn.requestedAt)}</TableCell>
                    <TableCell className="text-xs">{formatDate(txn.processedAt)}</TableCell>
                    <TableCell>
                      <Badge
                        variant={getStatusBadgeVariant(txn.status)}
                        className={cn("capitalize font-medium flex items-center gap-1.5", {
                          'bg-green-500/20 text-green-700 border-green-500/30 dark:text-green-400 dark:border-green-700/50': txn.status === 'approved',
                          'bg-yellow-500/20 text-yellow-700 border-yellow-500/30 dark:text-yellow-400 dark:border-yellow-700/50': txn.status === 'pending',
                        })}
                      >
                        {getStatusIcon(txn.status)}
                        {txn.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs">
                        {txn.type === 'withdrawal' && txn.accountDetails && <div>To: {txn.accountDetails}</div>}
                        {txn.type === 'deposit' && txn.transactionId && <div>Ref ID: {txn.transactionId}</div>}
                    </TableCell>
                    <TableCell className="text-right">
                      {txn.status === 'pending' ? (
                        <div className="flex gap-2 justify-end">
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-green-500 text-green-500 hover:bg-green-500/10 hover:text-green-600"
                            onClick={() => handleAction(txn, 'approved')}
                          >
                            <CheckCircle className="mr-1.5 h-4 w-4" /> Approve
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-red-500 text-red-500 hover:bg-red-500/10 hover:text-red-600"
                            onClick={() => handleAction(txn, 'rejected')}
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
                    <TableCell colSpan={9} className="h-24 text-center">
                      No transactions found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
