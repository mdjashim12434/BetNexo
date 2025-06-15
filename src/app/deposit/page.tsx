
'use client';

import AppLayout from "@/components/AppLayout";
import PaymentMethodSelector from "@/components/transactions/PaymentMethodSelector";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Info } from "lucide-react";
import { db, addDoc, collection, serverTimestamp, getDocs, query, where, Timestamp } from '@/lib/firebase';
import type { PaymentMethodConfig } from "@/components/admin/PaymentMethodsManagementTab"; // Assuming this can be imported
import { Skeleton } from "@/components/ui/skeleton";

interface DisplayPaymentMethod {
  id: string;
  name: string;
  logoUrl: string;
  description?: string;
  type: 'mobile' | 'upi' | 'bank' | 'crypto';
  dataAiHint?: string;
  // For display on form
  companyAccountNumber: string;
  companyAccountType: 'personal' | 'agent' | 'merchant';
  minAmount: number;
  maxAmount: number;
}

export default function DepositPage() {
  const { user, currency, loadingAuth } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  
  const [availableMethods, setAvailableMethods] = useState<DisplayPaymentMethod[]>([]);
  const [loadingMethods, setLoadingMethods] = useState(true);
  const [selectedMethod, setSelectedMethod] = useState<DisplayPaymentMethod | null>(null);
  
  const [amount, setAmount] = useState('');
  const [userSendingAccountNumber, setUserSendingAccountNumber] = useState('');
  const [paymentTransactionId, setPaymentTransactionId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchDepositMethods = useCallback(async () => {
    setLoadingMethods(true);
    try {
      const q = query(
        collection(db, "paymentMethods"), 
        where("transactionType", "==", "deposit"), 
        where("enabled", "==", true)
      );
      const querySnapshot = await getDocs(q);
      const methods: DisplayPaymentMethod[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data() as PaymentMethodConfig;
        methods.push({
          id: doc.id,
          name: data.name,
          logoUrl: data.logoUrl || `https://placehold.co/100x100.png?text=${data.name.charAt(0)}`,
          description: `Min: ${data.minAmount} ${currency}, Max: ${data.maxAmount > 0 ? data.maxAmount + ' ' + currency : 'No Limit'}`,
          type: data.companyAccountType === 'personal' || data.companyAccountType === 'agent' || data.companyAccountType === 'merchant' ? 'mobile' : 'bank', // Simplify type for selector
          dataAiHint: `${data.name} logo`,
          companyAccountNumber: data.companyAccountNumber,
          companyAccountType: data.companyAccountType,
          minAmount: data.minAmount,
          maxAmount: data.maxAmount,
        });
      });
      setAvailableMethods(methods);
    } catch (error: any) {
      console.error("Error fetching deposit methods:", error);
      let description = "Could not load deposit methods.";
      if (error.message) {
        if (error.message.toLowerCase().includes("missing or insufficient permissions")) {
          description += ` Firestore reported: "${error.message}". This usually means your Firestore security rules are not allowing this query. Please double-check the rules for the 'paymentMethods' collection to ensure authenticated users can read documents where transactionType is 'deposit' and enabled is true.`;
        } else if (error.message.toLowerCase().includes("index")) {
          description += ` Firestore reported: "${error.message}". This means a composite index is required. Please open your browser's developer console, find this exact Firebase error message, and click the link it provides to create the index. The required index is likely for 'paymentMethods' on fields 'transactionType' (Ascending) and 'enabled' (Ascending).`;
        } else {
          description += ` Details: ${error.message}`;
        }
      }
      if (error.code) {
          description += ` (Code: ${error.code})`;
      }
      toast({ title: "Error Loading Methods", description, variant: "destructive", duration: 15000 });
    } finally {
      setLoadingMethods(false);
    }
  }, [toast, currency]);

  useEffect(() => {
    if (!loadingAuth && !user) {
      router.push('/login');
    }
    if (user) {
        fetchDepositMethods();
    }
  }, [user, loadingAuth, router, fetchDepositMethods]);

  const handleMethodSelect = (methodId: string) => {
    const method = availableMethods.find(m => m.id === methodId);
    if (method) {
      setSelectedMethod(method);
      setAmount('');
      setUserSendingAccountNumber('');
      setPaymentTransactionId('');
    }
  };
  
  const handleDepositRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedMethod) {
      toast({ title: "Error", description: "User or payment method not selected.", variant: "destructive" });
      return;
    }

    const depositAmount = parseFloat(amount);
    if (isNaN(depositAmount) || depositAmount <= 0) {
      toast({ title: "Invalid Amount", description: "Please enter a valid positive amount.", variant: "destructive" });
      return;
    }
    if (selectedMethod.minAmount > 0 && depositAmount < selectedMethod.minAmount) {
      toast({ title: "Amount Too Low", description: `Minimum deposit amount is ${selectedMethod.minAmount} ${currency}.`, variant: "destructive" });
      return;
    }
    if (selectedMethod.maxAmount > 0 && depositAmount > selectedMethod.maxAmount) {
      toast({ title: "Amount Too High", description: `Maximum deposit amount is ${selectedMethod.maxAmount} ${currency}.`, variant: "destructive" });
      return;
    }
    if (!userSendingAccountNumber.trim()) {
        toast({ title: "Required Field", description: "Please enter your sending account number.", variant: "destructive" });
        return;
    }
    if (!paymentTransactionId.trim()) {
        toast({ title: "Required Field", description: "Please enter the payment transaction ID.", variant: "destructive" });
        return;
    }

    setIsSubmitting(true);
    try {
      const newTransaction = {
        userId: user.id,
        userName: user.name || user.email || 'N/A',
        amount: depositAmount,
        currency: currency,
        method: selectedMethod.name,
        methodId: selectedMethod.id,
        type: 'deposit' as const,
        status: 'pending' as const,
        requestedAt: serverTimestamp(),
        // New fields for deposit
        userSendingAccountNumber: userSendingAccountNumber,
        platformReceivingAccountNumber: selectedMethod.companyAccountNumber,
        platformAccountType: selectedMethod.companyAccountType,
        paymentTransactionId: paymentTransactionId, 
      };
      
      await addDoc(collection(db, "transactions"), newTransaction);
      
      toast({ 
        title: "Deposit Request Submitted", 
        description: `${currency} ${depositAmount.toFixed(2)} deposit request is pending approval. You will be notified once processed.` 
      });
      setSelectedMethod(null); 
      setAmount('');
      setUserSendingAccountNumber('');
      setPaymentTransactionId('');
      // router.push('/'); // Consider redirecting to transactions page or profile
    } catch (error: any) {
      console.error("Error submitting deposit request:", error);
      toast({ title: "Request Failed", description: "Could not submit your deposit request. " + error.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (loadingAuth || (user && loadingMethods)) {
    return (
        <AppLayout>
            <div className="max-w-2xl mx-auto space-y-4">
                <Skeleton className="h-10 w-1/2 mx-auto" />
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[1,2,3].map(i => <Skeleton key={i} className="h-32 w-full" />)}
                </div>
            </div>
        </AppLayout>
    );
  }


  if (!user) {
    return <AppLayout><div className="text-center p-10">Redirecting to login...</div></AppLayout>;
  }

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto">
        {selectedMethod ? (
          <Card className="shadow-xl">
            <CardHeader>
              <div className="flex items-center justify-between">
                <Button variant="ghost" size="sm" onClick={() => setSelectedMethod(null)} className="text-sm">
                  <ArrowLeft className="mr-2 h-4 w-4" /> Back
                </Button>
                <CardTitle className="font-headline text-xl text-center flex-grow">
                  Deposit with {selectedMethod.name}
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <Card className="bg-muted/50 p-4">
                <CardDescription className="text-sm text-foreground mb-2">
                  Please send <strong className="text-primary">{amount ? `${currency} ${amount}`: 'your desired amount'}</strong> to the following {selectedMethod.companyAccountType} account:
                </CardDescription>
                <div className="space-y-1">
                  <p className="font-mono text-lg bg-background p-2 rounded text-center">{selectedMethod.companyAccountNumber}</p>
                  <p className="text-xs text-muted-foreground text-center">Account Type: {selectedMethod.companyAccountType.charAt(0).toUpperCase() + selectedMethod.companyAccountType.slice(1)}</p>
                  {selectedMethod.minAmount > 0 && <p className="text-xs text-muted-foreground">Min Amount: {selectedMethod.minAmount} {currency}</p>}
                  {selectedMethod.maxAmount > 0 && <p className="text-xs text-muted-foreground">Max Amount: {selectedMethod.maxAmount} {currency}</p>}
                </div>
                <p className="text-xs text-muted-foreground mt-3 flex items-start">
                  <Info className="h-3 w-3 mr-1.5 mt-0.5 shrink-0"/>
                  After sending the money, fill in the details below and submit your request.
                </p>
              </Card>

              <form onSubmit={handleDepositRequest} className="space-y-4">
                <div>
                  <label htmlFor="amount" className="block text-sm font-medium text-foreground mb-1">
                    Amount Sent ({currency})
                  </label>
                  <Input
                    id="amount"
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder={`Enter amount (Min: ${selectedMethod.minAmount}, Max: ${selectedMethod.maxAmount > 0 ? selectedMethod.maxAmount : 'N/A'})`}
                    min={selectedMethod.minAmount > 0 ? selectedMethod.minAmount.toString() : "0.01"}
                    max={selectedMethod.maxAmount > 0 ? selectedMethod.maxAmount.toString() : undefined}
                    step="0.01"
                    required
                    className="text-lg"
                    disabled={isSubmitting}
                  />
                </div>
                 <div>
                  <label htmlFor="userSendingAccountNumber" className="block text-sm font-medium text-foreground mb-1">
                    Your Sending Account Number (e.g., your Bkash number)
                  </label>
                  <Input
                    id="userSendingAccountNumber"
                    type="text"
                    value={userSendingAccountNumber}
                    onChange={(e) => setUserSendingAccountNumber(e.target.value)}
                    placeholder="Enter your account number used for sending"
                    required
                    className="text-lg"
                    disabled={isSubmitting}
                  />
                </div>
                <div>
                  <label htmlFor="paymentTransactionId" className="block text-sm font-medium text-foreground mb-1">
                    Payment Transaction ID (TrxID)
                  </label>
                  <Input
                    id="paymentTransactionId"
                    type="text"
                    value={paymentTransactionId}
                    onChange={(e) => setPaymentTransactionId(e.target.value)}
                    placeholder="Enter the TrxID from your payment"
                    required
                    className="text-lg"
                    disabled={isSubmitting}
                  />
                </div>
                <Button type="submit" className="w-full font-semibold text-lg py-3" disabled={isSubmitting}>
                  {isSubmitting ? 'Submitting Request...' : 'Submit Deposit Request'}
                </Button>
              </form>
              <p className="mt-4 text-xs text-muted-foreground text-center">
                Your deposit request will be reviewed by an admin. Please ensure all details are correct.
              </p>
            </CardContent>
          </Card>
        ) : (
           availableMethods.length > 0 ?
            <PaymentMethodSelector methods={availableMethods} onSelectMethod={handleMethodSelect} actionType="Deposit" />
           : <p className="text-center text-muted-foreground py-10">No deposit methods are currently available. Please check back later.</p>
        )}
      </div>
    </AppLayout>
  );
}

    