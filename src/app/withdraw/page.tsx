
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


const withdrawalMethods = [
  { id: 'bkash', name: 'Bkash', logoUrl: 'https://placehold.co/100x100.png?text=Bkash', description: 'Withdraw to your Bkash account.', type: 'mobile' as const, dataAiHint: 'Bkash logo' },
  { id: 'nagad', name: 'Nagad', logoUrl: 'https://placehold.co/100x100.png?text=Nagad', description: 'Withdraw to your Nagad account.', type: 'mobile' as const, dataAiHint: 'Nagad logo' },
  { id: 'rocket', name: 'Rocket', logoUrl: 'https://placehold.co/100x100.png?text=Rocket', description: 'Withdraw to your Rocket account.', type: 'mobile' as const, dataAiHint: 'Rocket logo' },
  { id: 'upay', name: 'Upay', logoUrl: 'https://placehold.co/100x100.png?text=Upay', description: 'Withdraw to your Upay account.', type: 'mobile' as const, dataAiHint: 'Upay logo' },
  { id: 'phonepe', name: 'PhonePe', logoUrl: 'https://placehold.co/100x100.png?text=PhonePe', description: 'Withdraw to your PhonePe account.', type: 'upi' as const, dataAiHint: 'PhonePe logo' },
  { id: 'upi', name: 'UPI', logoUrl: 'https://placehold.co/100x100.png?text=UPI', description: 'Withdraw using UPI.', type: 'upi' as const, dataAiHint: 'UPI logo' },
  { id: 'bank', name: 'Bank Transfer', logoUrl: 'https://placehold.co/100x100.png?text=Bank', description: 'Direct withdrawal to your bank account.', type: 'bank' as const, dataAiHint: 'Bank logo' },
];

export default function WithdrawPage() {
  const { user, balance, currency, updateBalance } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  const [amount, setAmount] = useState('');
  const [accountDetails, setAccountDetails] = useState('');


  useEffect(() => {
    if (!user) {
      router.push('/login');
    }
  }, [user, router]);

  const handleMethodSelect = (methodId: string) => {
    setSelectedMethod(methodId);
    setAmount('');
    setAccountDetails('');
  };

  const handleWithdrawal = (e: React.FormEvent) => {
    e.preventDefault();
    const withdrawalAmount = parseFloat(amount);
    if (isNaN(withdrawalAmount) || withdrawalAmount <= 0) {
      toast({ title: "Invalid Amount", description: "Please enter a valid positive amount.", variant: "destructive" });
      return;
    }
    if (withdrawalAmount > balance) {
      toast({ title: "Insufficient Balance", description: "You do not have enough funds to withdraw this amount.", variant: "destructive" });
      return;
    }
    if (!accountDetails.trim()) {
        toast({ title: "Account Details Required", description: "Please enter your account details for withdrawal.", variant: "destructive" });
        return;
    }

    // Mock withdrawal processing
    updateBalance(-withdrawalAmount); // Subtract from balance
    toast({ title: "Withdrawal Requested", description: `${currency} ${withdrawalAmount.toFixed(2)} withdrawal to ${accountDetails} is being processed.` });
    setSelectedMethod(null);
    setAmount('');
    setAccountDetails('');
    router.push('/'); // Or to a transactions history page
  };

  if (!user) {
    return <AppLayout><div className="text-center">Loading or redirecting...</div></AppLayout>;
  }
  
  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto">
        {selectedMethod ? (
          <Card className="shadow-xl">
             <CardHeader>
              <Button variant="ghost" size="sm" onClick={() => setSelectedMethod(null)} className="absolute top-4 left-4">
                <ArrowLeft className="mr-2 h-4 w-4" /> Back
              </Button>
              <CardTitle className="font-headline text-2xl text-center pt-8">
                Withdraw via {withdrawalMethods.find(m => m.id === selectedMethod)?.name}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleWithdrawal} className="space-y-4">
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
                    placeholder="Enter amount"
                    min="0.01"
                    step="0.01"
                    required
                    className="text-lg"
                  />
                </div>
                 <div>
                  <label htmlFor="accountDetails" className="block text-sm font-medium text-foreground mb-1">
                    Account Details (e.g., Phone Number, Account Number)
                  </label>
                  <Input
                    id="accountDetails"
                    type="text"
                    value={accountDetails}
                    onChange={(e) => setAccountDetails(e.target.value)}
                    placeholder="Enter your account details"
                    required
                    className="text-lg"
                  />
                </div>
                <Button type="submit" className="w-full font-semibold text-lg py-3">
                  Request Withdrawal
                </Button>
              </form>
               <p className="mt-4 text-xs text-muted-foreground text-center">
                Withdrawals are typically processed within 24 hours. Ensure your account details are correct.
              </p>
            </CardContent>
          </Card>
        ) : (
          <PaymentMethodSelector methods={withdrawalMethods} onSelectMethod={handleMethodSelect} actionType="Withdraw" />
        )}
      </div>
    </AppLayout>
  );
}
