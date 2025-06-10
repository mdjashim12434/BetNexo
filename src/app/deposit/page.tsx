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

const depositMethods = [
  { id: 'bkash', name: 'Bkash', logoUrl: 'https://placehold.co/100x100.png?text=Bkash', description: 'Popular mobile financial service in Bangladesh.', type: 'mobile' as const },
  { id: 'nagad', name: 'Nagad', logoUrl: 'https://placehold.co/100x100.png?text=Nagad', description: 'Digital financial service by Bangladesh Post Office.', type: 'mobile' as const },
  { id: 'rocket', name: 'Rocket', logoUrl: 'https://placehold.co/100x100.png?text=Rocket', description: 'Mobile banking by Dutch-Bangla Bank.', type: 'mobile' as const },
  { id: 'upay', name: 'Upay', logoUrl: 'https://placehold.co/100x100.png?text=Upay', description: 'Mobile financial service by UCB.', type: 'mobile' as const },
  { id: 'phonepe', name: 'PhonePe', logoUrl: 'https://placehold.co/100x100.png?text=PhonePe', description: 'Indian digital payments platform.', type: 'upi' as const },
  { id: 'upi', name: 'UPI', logoUrl: 'https://placehold.co/100x100.png?text=UPI', description: 'Unified Payments Interface for India.', type: 'upi' as const },
  { id: 'bank', name: 'Bank Transfer', logoUrl: 'https://placehold.co/100x100.png?text=Bank', description: 'Direct deposit from your bank account.', type: 'bank' as const },
];

export default function DepositPage() {
  const { user, currency, updateBalance } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  const [amount, setAmount] = useState('');

  useEffect(() => {
    if (!user) {
      router.push('/login');
    }
  }, [user, router]);

  const handleMethodSelect = (methodId: string) => {
    setSelectedMethod(methodId);
    setAmount(''); // Reset amount when method changes
  };
  
  const handleDeposit = (e: React.FormEvent) => {
    e.preventDefault();
    const depositAmount = parseFloat(amount);
    if (isNaN(depositAmount) || depositAmount <= 0) {
      toast({ title: "Invalid Amount", description: "Please enter a valid positive amount.", variant: "destructive" });
      return;
    }
    // Mock deposit processing
    updateBalance(depositAmount); // Add to balance
    toast({ title: "Deposit Successful", description: `${currency} ${depositAmount.toFixed(2)} has been added to your account.` });
    setSelectedMethod(null); // Go back to method selection
    setAmount('');
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
                Deposit with {depositMethods.find(m => m.id === selectedMethod)?.name}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleDeposit} className="space-y-4">
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
                  />
                </div>
                <Button type="submit" className="w-full font-semibold text-lg py-3">
                  Confirm Deposit
                </Button>
              </form>
              <p className="mt-4 text-xs text-muted-foreground text-center">
                You will be redirected to the payment gateway. Follow the instructions to complete your deposit.
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
