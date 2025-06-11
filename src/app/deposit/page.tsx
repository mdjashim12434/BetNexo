
'use client';

import AppLayout from "@/components/AppLayout";
import PaymentMethodSelector from "@/components/transactions/PaymentMethodSelector";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft } from "lucide-react";
import { db, addDoc, collection, serverTimestamp } from '@/lib/firebase'; // Import Firestore functions

const depositMethods = [
  { id: 'bkash', name: 'Bkash', logoUrl: 'https://placehold.co/100x100.png?text=Bkash', description: 'Popular mobile financial service in Bangladesh.', type: 'mobile' as const, dataAiHint: 'Bkash logo' },
  { id: 'nagad', name: 'Nagad', logoUrl: 'https://placehold.co/100x100.png?text=Nagad', description: 'Digital financial service by Bangladesh Post Office.', type: 'mobile' as const, dataAiHint: 'Nagad logo' },
  { id: 'rocket', name: 'Rocket', logoUrl: 'https://placehold.co/100x100.png?text=Rocket', description: 'Mobile banking by Dutch-Bangla Bank.', type: 'mobile' as const, dataAiHint: 'Rocket logo' },
  { id: 'upay', name: 'Upay', logoUrl: 'https://placehold.co/100x100.png?text=Upay', description: 'Mobile financial service by UCB.', type: 'mobile' as const, dataAiHint: 'Upay logo' },
  { id: 'phonepe', name: 'PhonePe', logoUrl: 'https://placehold.co/100x100.png?text=PhonePe', description: 'Indian digital payments platform.', type: 'upi' as const, dataAiHint: 'PhonePe logo' },
  { id: 'upi', name: 'UPI', logoUrl: 'https://placehold.co/100x100.png?text=UPI', description: 'Unified Payments Interface for India.', type: 'upi' as const, dataAiHint: 'UPI logo' },
  { id: 'bank', name: 'Bank Transfer', logoUrl: 'https://placehold.co/100x100.png?text=Bank', description: 'Direct deposit from your bank account.', type: 'bank' as const, dataAiHint: 'Bank logo' },
];

export default function DepositPage() {
  const { user, currency } = useAuth(); // Removed updateBalance from here
  const router = useRouter();
  const { toast } = useToast();
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  const [amount, setAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [transactionId, setTransactionId] = useState(''); // For payment gateway transaction ID

  useEffect(() => {
    if (!user) {
      router.push('/login');
    }
  }, [user, router]);

  const handleMethodSelect = (methodId: string) => {
    setSelectedMethod(methodId);
    setAmount(''); 
    setTransactionId('');
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

    setIsSubmitting(true);
    try {
      const newTransaction = {
        userId: user.id,
        userName: user.name || user.email || 'N/A',
        amount: depositAmount,
        currency: currency,
        method: depositMethods.find(m => m.id === selectedMethod)?.name || selectedMethod,
        type: 'deposit' as const,
        status: 'pending' as const,
        requestedAt: serverTimestamp(),
        transactionId: transactionId || null, // Optional gateway transaction ID
      };
      
      await addDoc(collection(db, "transactions"), newTransaction);
      
      toast({ 
        title: "Deposit Request Submitted", 
        description: `${currency} ${depositAmount.toFixed(2)} deposit request is pending approval. You will be notified once processed.` 
      });
      setSelectedMethod(null); 
      setAmount('');
      setTransactionId('');
      router.push('/'); 
    } catch (error) {
      console.error("Error submitting deposit request:", error);
      toast({ title: "Request Failed", description: "Could not submit your deposit request. Please try again.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) {
    return <AppLayout><div className="text-center">Loading or redirecting...</div></AppLayout>;
  }

  const currentMethodDetails = depositMethods.find(m => m.id === selectedMethod);

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto">
        {selectedMethod && currentMethodDetails ? (
          <Card className="shadow-xl">
            <CardHeader>
              <Button variant="ghost" size="sm" onClick={() => setSelectedMethod(null)} className="absolute top-4 left-4">
                <ArrowLeft className="mr-2 h-4 w-4" /> Back
              </Button>
              <CardTitle className="font-headline text-2xl text-center pt-8">
                Deposit with {currentMethodDetails.name}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleDepositRequest} className="space-y-4">
                <div>
                  <label htmlFor="amount" className="block text-sm font-medium text-foreground mb-1">
                    Amount ({currency})
                  </label>
                  <Input
                    id="amount"
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="Enter amount"
                    min="0.01"
                    step="0.01"
                    required
                    className="text-lg"
                    disabled={isSubmitting}
                  />
                </div>
                <div>
                  <label htmlFor="transactionId" className="block text-sm font-medium text-foreground mb-1">
                    Payment Transaction ID (Optional)
                  </label>
                  <Input
                    id="transactionId"
                    type="text"
                    value={transactionId}
                    onChange={(e) => setTransactionId(e.target.value)}
                    placeholder="Enter if you have one (e.g., Bkash TrxID)"
                    className="text-lg"
                    disabled={isSubmitting}
                  />
                </div>
                <Button type="submit" className="w-full font-semibold text-lg py-3" disabled={isSubmitting}>
                  {isSubmitting ? 'Submitting Request...' : 'Submit Deposit Request'}
                </Button>
              </form>
              <p className="mt-4 text-xs text-muted-foreground text-center">
                Your deposit request will be reviewed by an admin. Please provide the payment transaction ID if available.
              </p>
            </CardContent>
          </Card>
        ) : (
          <PaymentMethodSelector methods={depositMethods} onSelectMethod={handleMethodSelect} actionType="Deposit" />
        )}
      </div>
    </AppLayout>
  );
}
