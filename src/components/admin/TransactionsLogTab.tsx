
'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Clock, History, RefreshCw, AlertTriangle, Info } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from '@/lib/utils';
import { db, collection, query, orderBy, getDocs, doc, updateDoc, serverTimestamp, Timestamp, getDoc, updateUserBalanceInFirestore } from '@/lib/firebase';
import { format } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose
} from "@/components/ui/dialog";


export type TransactionStatus = 'pending' | 'approved' | 'rejected';
export type TransactionType = 'deposit' | 'withdrawal';

export interface Transaction {
  id: string; // Firestore document ID
  userId: string;
  userName: string;
  amount: number;
  currency: string;
  method: string; // Name of the payment method (e.g., Bkash)
  methodId?: string; // ID of the payment method from paymentMethods collection
  type: TransactionType;
  status: TransactionStatus;
  requestedAt: Timestamp; // Firestore Timestamp
  processedAt?: Timestamp;
  
  // Deposit specific
  userSendingAccountNumber?: string;
  platformReceivingAccountNumber?: string;
  platformAccountType?: 'personal' | 'agent' | 'merchant'; // For deposits
  paymentTransactionId?: string; // User provided TrxID for deposits

  // Withdrawal specific (platformAccountType might be stored for withdrawals too for consistency)
  userReceivingAccountDetails?: string; 
  platformSendingAccountNumber?: string; // Platform's account used for this withdrawal method

  // Generic field for older transactions or if specific fields are missing
  accountDetails?: string; // Fallback or general purpose
}


export default function TransactionsLogTab() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTransactionForDetails, setSelectedTransactionForDetails] = useState<Transaction | null>(null);
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
    } catch (error: any) {
      console.error("Error fetching transactions: ", error);
      let description = "Could not fetch transaction logs.";
      if (error.message) {
        description += ` Details: ${error.message}`;
      }
      toast({ title: "Fetch Error", description, variant: "destructive" });
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
          const userDocRef = doc(db, "users", transaction.userId);
          const userDocSnap = await getDoc(userDocRef); 
          if (userDocSnap.exists()) {
            const userData = userDocSnap.data();
            if ((userData.balance || 0) < transaction.amount) {
               toast({ title: "Action Failed", description: `User ${transaction.userName} has insufficient balance for this withdrawal. Current Balance: ${userData.currency || 'N/A'} ${(userData.balance || 0).toFixed(2)}. Required: ${transaction.amount.toFixed(2)}`, variant: "destructive", duration: 7000 });
               return; 
            }
            await updateUserBalanceInFirestore(transaction.userId, -transaction.amount);
          } else {
            toast({title: "Error", description: `User document for ${transaction.userName} not found. Cannot process withdrawal.`, variant: "destructive"});
            return; 
          }
        }
      }
      await updateDoc(transactionDocRef, { status: newStatus, processedAt: serverTimestamp() });
      
      toast({
        title: `Transaction ${newStatus}`,
        description: `Transaction ID ${transaction.id} for ${transaction.userName} has been ${newStatus}. ${newStatus === 'approved' ? 'User balance updated.' : ''}`,
      });
      fetchTransactions(); 
    } catch (error: any) {
      console.error(`Error ${newStatus} transaction: `, error);
      toast({ title: "Action Failed", description: `Could not ${newStatus} transaction ${transaction.id}. ` + error.message, variant: "destructive" });
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
      return format(timestamp.toDate(), 'PPpp'); 
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
        <Button variant="outline" size="icon" onClick={fetchTransactions} disabled={loading} aria-label="Refresh transactions">
          <RefreshCw className={cn("h-4 w-4", {"animate-spin": loading})} />
        </Button>
      </CardHeader>
      <CardContent className="pt-6">
        {loading ? (
          <div className="text-center py-10 flex items-center justify-center"><RefreshCw className="mr-2 h-5 w-5 animate-spin" /> Loading transactions...</div>
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
                  <TableHead>Status</TableHead>
                  <TableHead className="text-center">Details</TableHead>
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
                    <TableCell>
                      <Badge
                        variant={getStatusBadgeVariant(txn.status)}
                        className={cn("capitalize font-medium flex items-center gap-1.5 text-xs", { 
                          'bg-green-500/20 text-green-700 border-green-500/30 dark:text-green-400 dark:border-green-700/50': txn.status === 'approved',
                          'bg-yellow-500/20 text-yellow-700 border-yellow-500/30 dark:text-yellow-400 dark:border-yellow-700/50': txn.status === 'pending',
                        })}
                      >
                        {getStatusIcon(txn.status)}
                        {txn.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                        <Dialog>
                          <DialogTrigger asChild>
                             <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => setSelectedTransactionForDetails(txn)}>
                                <Info className="h-3.5 w-3.5"/>
                             </Button>
                          </DialogTrigger>
                           {selectedTransactionForDetails && selectedTransactionForDetails.id === txn.id && (
                            <DialogContent className="sm:max-w-md">
                                <DialogHeader>
                                <DialogTitle>Transaction Details (ID: {selectedTransactionForDetails.id})</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-3 py-4 text-sm">
                                    <p><strong>User:</strong> {selectedTransactionForDetails.userName} ({selectedTransactionForDetails.userId})</p>
                                    <p><strong>Type:</strong> <span className="capitalize">{selectedTransactionForDetails.type}</span></p>
                                    <p><strong>Amount:</strong> {selectedTransactionForDetails.amount.toFixed(2)} {selectedTransactionForDetails.currency}</p>
                                    <p><strong>Method:</strong> {selectedTransactionForDetails.method}</p>
                                    <p><strong>Status:</strong> <span className="capitalize">{selectedTransactionForDetails.status}</span></p>
                                    <p><strong>Requested At:</strong> {formatDate(selectedTransactionForDetails.requestedAt)}</p>
                                    <p><strong>Processed At:</strong> {formatDate(selectedTransactionForDetails.processedAt)}</p>
                                    {selectedTransactionForDetails.type === 'deposit' && (
                                        <>
                                        <p><strong>User Sending A/C:</strong> {selectedTransactionForDetails.userSendingAccountNumber || 'N/A'}</p>
                                        <p><strong>Platform Receiving A/C:</strong> {selectedTransactionForDetails.platformReceivingAccountNumber || 'N/A'} ({selectedTransactionForDetails.platformAccountType || 'N/A'})</p>
                                        <p><strong>Payment TrxID:</strong> {selectedTransactionForDetails.paymentTransactionId || 'N/A'}</p>
                                        </>
                                    )}
                                    {selectedTransactionForDetails.type === 'withdrawal' && (
                                        <>
                                        <p><strong>User Receiving A/C:</strong> {selectedTransactionForDetails.userReceivingAccountDetails || selectedTransactionForDetails.accountDetails || 'N/A'}</p>
                                        <p><strong>Platform Sending A/C:</strong> {selectedTransactionForDetails.platformSendingAccountNumber || 'N/A'} ({selectedTransactionForDetails.platformAccountType || 'N/A'})</p>
                                        </>
                                    )}
                                     {selectedTransactionForDetails.accountDetails && (!selectedTransactionForDetails.userReceivingAccountDetails && selectedTransactionForDetails.type === 'withdrawal') && (
                                      <p><strong>Legacy Account Details:</strong> {selectedTransactionForDetails.accountDetails}</p>
                                    )}
                                </div>
                                <DialogClose asChild>
                                    <Button type="button" variant="outline">Close</Button>
                                </DialogClose>
                            </DialogContent>
                           )}
                        </Dialog>
                    </TableCell>
                    <TableCell className="text-right">
                      {txn.status === 'pending' ? (
                        <div className="flex gap-2 justify-end">
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-green-500 text-green-500 hover:bg-green-500/10 hover:text-green-600 h-8 px-2 text-xs"
                            onClick={() => handleAction(txn, 'approved')}
                          >
                            <CheckCircle className="mr-1.5 h-3.5 w-3.5" /> Approve
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-red-500 text-red-500 hover:bg-red-500/10 hover:text-red-600 h-8 px-2 text-xs"
                            onClick={() => handleAction(txn, 'rejected')}
                          >
                            <XCircle className="mr-1.5 h-3.5 w-3.5" /> Reject
                          </Button>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground italic">Processed</span>
                      )}
                    </TableCell>
                  </TableRow>
                )) : (
                  <TableRow>
                    <TableCell colSpan={8} className="h-24 text-center"> {/* Adjusted colSpan */}
                       <div className="flex flex-col items-center justify-center">
                         <AlertTriangle className="w-10 h-10 text-muted-foreground mb-2" />
                         <p className="font-semibold">No transactions found.</p>
                         <p className="text-xs text-muted-foreground">Users may not have made any requests yet.</p>
                       </div>
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

    