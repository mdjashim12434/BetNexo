
'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import type { FC } from 'react';

interface PaymentMethod {
  id: string;
  name: string;
  logoUrl: string;
  description?: string;
  type: 'mobile' | 'upi' | 'bank' | 'crypto'; // Extended types
  dataAiHint?: string; // Added for better image generation hints
}

interface PaymentMethodSelectorProps {
  methods: PaymentMethod[];
  onSelectMethod: (methodId: string) => void;
  actionType: 'Deposit' | 'Withdraw';
}

const PaymentMethodSelector: FC<PaymentMethodSelectorProps> = ({ methods, onSelectMethod, actionType }) => {
  return (
    <div className="space-y-6">
      <h2 className="font-headline text-2xl font-semibold text-center">
        Choose a {actionType} Method
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {methods.map((method) => (
          <Card 
            key={method.id} 
            className="hover:shadow-primary/30 hover:shadow-lg transition-all duration-300 cursor-pointer transform hover:-translate-y-1"
            onClick={() => onSelectMethod(method.id)}
          >
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg font-medium">{method.name}</CardTitle>
              <Image 
                src={method.logoUrl} 
                alt={`${method.name} logo`} 
                width={40} 
                height={40} 
                className="rounded" 
                data-ai-hint={method.dataAiHint || `${method.name} logo`}
              />
            </CardHeader>
            <CardContent>
              {method.description && (
                <p className="text-sm text-muted-foreground mb-3">{method.description}</p>
              )}
              <Button className="w-full bg-primary hover:bg-primary/90">
                {actionType} with {method.name}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
      {methods.length === 0 && (
        <p className="text-center text-muted-foreground">No {actionType.toLowerCase()} methods available at the moment.</p>
      )}
    </div>
  );
};

export default PaymentMethodSelector;
