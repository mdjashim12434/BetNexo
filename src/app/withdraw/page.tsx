
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
import { ArrowLeft } from "lucide-react";
import { db, addDoc, collection, serverTimestamp, getDocs, query, where, Timestamp } from '@/lib/firebase';
import type { PaymentMethodConfig } from "@/components/admin/PaymentMethodsManagementTab";
import { Skeleton } from "@/components/ui/skeleton";

interface DisplayPaymentMethod {
  id: string;
  name: string;
  logoUrl: string;
  description?: string;
  type: 'mobile' | 'upi' | 'bank' | 'crypto';
  dataAiHint?: string;
  // For display on form
  companyAccountNumber: string; // Platform's account for this method
  companyAccountType: 'personal' | 'agent' | 'merchant';
  minAmount: number;
  maxAmount: number;
}


export default function WithdrawPage() {
  const { user, balance, currency, loadingAuth } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [availableMethods, setAvailableMethods] = useState<DisplayPaymentMethod[]>([]);
  const [loadingMethods, setLoadingMethods] = useState(true);
  const [selectedMethod, setSelectedMethod] = useState<DisplayPaymentMethod | null>(null);
  
  const [amount, setAmount] = useState('');
  const [userReceivingAccountDetails, setUserReceivingAccountDetails] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchWithdrawalMethods = useCallback(async () => {
    setLoadingMethods(true);
    try {
      const q = query(
        collection(db, "paymentMethods"), 
        where("transactionType", "==", "withdrawal"), 
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
          type: data.companyAccountType === 'personal' || data.companyAccountType === 'agent' || data.companyAccountType === 'merchant' ? 'mobile' : 'bank',
          dataAiHint: `${data.name} logo`,
          companyAccountNumber: data.companyAccountNumber,
          companyAccountType: data.companyAccountType,
          minAmount: data.minAmount,
          maxAmount: data.maxAmount,
        });
      });
      setAvailableMethods(methods);
    } catch (error: any) {
      console.error("Error fetching withdrawal methods:", error);
      let description = "Could not load withdrawal methods.";
      if (error.message) {
        if (error.message.toLowerCase().includes("missing or insufficient permissions")) {
          description += ` Firestore reported: "${error.message}". This usually means your Firestore security rules are not allowing this query. Please double-check the rules for the 'paymentMethods' collection to ensure authenticated users can read documents where transactionType is 'withdrawal' and enabled is true.`;
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
        fetchWithdrawalMethods();
    }
  }, [user, loadingAuth, router, fetchWithdrawalMethods]);

  const handleMethodSelect = (methodId: string) => {
    const method = availableMethods.find(m => m.id === methodId);
    if (method) {
      setSelectedMethod(method);
      setAmount('');
      setUserReceivingAccountDetails('');
    }
  };

  const handleWithdrawalRequest = async (e: React.FormEvent) => {
    e.preventDefault();
     if (!user || !selectedMethod) {
      toast({ title: "Error", description: "User or payment method not selected.", variant: "destructive" });
      return;
    }

    const withdrawalAmount = parseFloat(amount);
    if (isNaN(withdrawalAmount) || withdrawalAmount <= 0) {
      toast({ title: "Invalid Amount", description: "Please enter a valid positive amount.", variant: "destructive" });
      return;
    }
    if (withdrawalAmount > balance) {
      toast({ title: "Insufficient Balance", description: `You do not have enough funds to request a withdrawal of ${currency} ${withdrawalAmount.toFixed(2)}. Current balance: ${currency} ${balance.toFixed(2)}`, variant: "destructive" });
      return;
    }
     if (selectedMethod.minAmount > 0 && withdrawalAmount < selectedMethod.minAmount) {
      toast({ title: "Amount Too Low", description: `Minimum withdrawal amount is ${selectedMethod.minAmount} ${currency}.`, variant: "destructive" });
      return;
    }
    if (selectedMethod.maxAmount > 0 && withdrawalAmount > selectedMethod.maxAmount) {
      toast({ title: "Amount Too High", description: `Maximum withdrawal amount is ${selectedMethod.maxAmount} ${currency}.`, variant: "destructive" });
      return;
    }
    if (!userReceivingAccountDetails.trim()) {
        toast({ title: "Account Details Required", description: "Please enter your account details for withdrawal.", variant: "destructive" });
        return;
    }

    setIsSubmitting(true);
    try {
      const newTransaction = {
        userId: user.id,
        userName: user.name || user.email || 'N/A',
        amount: withdrawalAmount,
        currency: currency,
        method: selectedMethod.name,
        methodId: selectedMethod.id,
        type: 'withdrawal' as const,
        status: 'pending' as const,
        // Renamed from accountDetails to userReceivingAccountDetails for clarity
        userReceivingAccountDetails: userReceivingAccountDetails,
        // Platform's account info for this method (for record keeping)
        platformSendingAccountNumber: selectedMethod.companyAccountNumber,
        platformAccountType: selectedMethod.companyAccountType,
        requestedAt: serverTimestamp(),
      };

      await addDoc(collection(db, "transactions"), newTransaction);

      toast({ 
        title: "Withdrawal Request Submitted", 
        description: `${currency} ${withdrawalAmount.toFixed(2)} withdrawal request to ${userReceivingAccountDetails} is pending approval.` 
      });
      setSelectedMethod(null);
      setAmount('');
      setUserReceivingAccountDetails('');
      // router.push('/'); 
    } catch (error: any) {
        console.error("Error submitting withdrawal request:", error);
        toast({ title: "Request Failed", description: "Could not submit your withdrawal request. " + error.message, variant: "destructive" });
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

  const currentMethodDetails = selectedMethod; // Already using selectedMethod
  const withdrawalAmount = parseFloat(amount) || 0;
  
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
                    Withdraw via {selectedMethod.name}
                  </CardTitle>
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <Card className="bg-muted/50 p-4">
                  <CardDescription className="text-sm text-foreground mb-2">
                    You are requesting withdrawal via <strong>{selectedMethod.name}</strong>.
                  </CardDescription>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Platform Account: {selectedMethod.companyAccountNumber} ({selectedMethod.companyAccountType})</p>
                    {selectedMethod.minAmount > 0 && <p className="text-xs text-muted-foreground">Min Amount: {selectedMethod.minAmount} {currency}</p>}
                    {selectedMethod.maxAmount > 0 && <p className="text-xs text-muted-foreground">Max Amount: {selectedMethod.maxAmount} {currency}</p>}
                  </div>
              </Card>
              
              <form onSubmit={handleWithdrawalRequest} className="space-y-4">
                <p className="text-sm text-muted-foreground">Available Balance: <span className="font-semibold text-foreground">{currency} {balance.toFixed(2)}</span></p>
                <div>
                  <label htmlFor="amount" className="block text-sm font-medium text-foreground mb-1">
                    Amount to Withdraw ({currency})
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
                  <label htmlFor="userReceivingAccountDetails" className="block text-sm font-medium text-foreground mb-1">
                    Your Receiving Account Details (e.g., Bkash/Nagad Number, Bank A/C)
                  </label>
                  <Input
                    id="userReceivingAccountDetails"
                    type="text"
                    value={userReceivingAccountDetails}
                    onChange={(e) => setUserReceivingAccountDetails(e.target.value)}
                    placeholder="Enter your account details for receiving funds"
                    required
                    className="text-lg"
                    disabled={isSubmitting}
                  />
                </div>
                <Button 
                    type="submit" 
                    className="w-full font-semibold text-lg py-3" 
                    disabled={isSubmitting || withdrawalAmount <=0 || withdrawalAmount > balance || (selectedMethod.minAmount > 0 && withdrawalAmount < selectedMethod.minAmount) || (selectedMethod.maxAmount > 0 && withdrawalAmount > selectedMethod.maxAmount)}
                >
                  {isSubmitting ? 'Submitting Request...' : 'Submit Withdrawal Request'}
                </Button>
                 {withdrawalAmount > 0 && (
                    (withdrawalAmount > balance && <p className="text-xs text-destructive text-center">Withdrawal amount exceeds your available balance.</p>) ||
                    (selectedMethod.minAmount > 0 && withdrawalAmount < selectedMethod.minAmount && <p className="text-xs text-destructive text-center">Amount is less than minimum.</p>) ||
                    (selectedMethod.maxAmount > 0 && withdrawalAmount > selectedMethod.maxAmount && <p className="text-xs text-destructive text-center">Amount is more than maximum.</p>)
                 )}
              </form>
               <p className="mt-4 text-xs text-muted-foreground text-center">
                Withdrawals are typically processed within 24 hours after admin approval. Ensure your account details are correct.
               </p>
            </CardContent>
          </Card>
        ) : (
           availableMethods.length > 0 ?
            <PaymentMethodSelector methods={availableMethods} onSelectMethod={handleMethodSelect} actionType="Withdraw" />
           : <p className="text-center text-muted-foreground py-10">No withdrawal methods are currently available. Please check back later.</p>
        )}
      </div>
    </AppLayout>
  );
}

    