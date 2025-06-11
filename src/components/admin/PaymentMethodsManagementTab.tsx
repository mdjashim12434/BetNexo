
'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { CreditCard, PlusCircle, Edit, Trash2, RefreshCw, UploadCloud } from "lucide-react";
import Image from 'next/image';
import { useToast } from "@/hooks/use-toast";
import { db, collection, addDoc, getDocs, updateDoc, deleteDoc, doc, serverTimestamp, Timestamp, query, where } from '@/lib/firebase';
import { cn } from '@/lib/utils';

export interface PaymentMethodConfig {
  id?: string; // Firestore document ID, optional for new methods
  name: string;
  transactionType: 'deposit' | 'withdrawal';
  logoUrl: string;
  enabled: boolean;
  companyAccountNumber: string;
  companyAccountType: 'personal' | 'agent' | 'merchant';
  minAmount: number;
  maxAmount: number;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

const initialFormState: PaymentMethodConfig = {
  name: '',
  transactionType: 'deposit', // Default for new, will be set by tab
  logoUrl: '',
  enabled: true,
  companyAccountNumber: '',
  companyAccountType: 'personal',
  minAmount: 0,
  maxAmount: 0,
};

export default function PaymentMethodsManagementTab() {
  const [depositMethods, setDepositMethods] = useState<PaymentMethodConfig[]>([]);
  const [withdrawalMethods, setWithdrawalMethods] = useState<PaymentMethodConfig[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentMethod, setCurrentMethod] = useState<PaymentMethodConfig | null>(null);
  const [formData, setFormData] = useState<PaymentMethodConfig>(initialFormState);
  const [activeTab, setActiveTab] = useState<'deposit' | 'withdrawal'>('deposit');

  const { toast } = useToast();

  const fetchMethods = useCallback(async (type: 'deposit' | 'withdrawal') => {
    setIsLoading(true);
    try {
      const q = query(collection(db, "paymentMethods"), where("transactionType", "==", type));
      const querySnapshot = await getDocs(q);
      const methods: PaymentMethodConfig[] = [];
      querySnapshot.forEach((doc) => {
        methods.push({ id: doc.id, ...doc.data() } as PaymentMethodConfig);
      });
      if (type === 'deposit') {
        setDepositMethods(methods);
      } else {
        setWithdrawalMethods(methods);
      }
    } catch (error: any) {
      toast({ title: "Error Fetching Methods", description: error.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchMethods(activeTab);
  }, [fetchMethods, activeTab]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: name === 'minAmount' || name === 'maxAmount' ? parseFloat(value) || 0 : value }));
  };

  const handleSelectChange = (name: keyof PaymentMethodConfig, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value as any }));
  };

  const handleSwitchChange = (name: keyof PaymentMethodConfig, checked: boolean) => {
    setFormData(prev => ({ ...prev, [name]: checked }));
  };

  const handleAddNewMethod = () => {
    setCurrentMethod(null);
    setFormData({ ...initialFormState, transactionType: activeTab });
    setIsDialogOpen(true);
  };

  const handleEditMethod = (method: PaymentMethodConfig) => {
    setCurrentMethod(method);
    setFormData({ ...method });
    setIsDialogOpen(true);
  };

  const handleDeleteMethod = async (methodId: string) => {
    if (!confirm("Are you sure you want to delete this payment method?")) return;
    setIsSaving(true);
    try {
      await deleteDoc(doc(db, "paymentMethods", methodId));
      toast({ title: "Method Deleted", description: "Payment method has been deleted successfully." });
      fetchMethods(activeTab); // Refresh list
    } catch (error: any) {
      toast({ title: "Error Deleting Method", description: error.message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    if (formData.minAmount < 0 || formData.maxAmount < 0) {
        toast({ title: "Invalid Amount", description: "Minimum and Maximum amounts cannot be negative.", variant: "destructive" });
        setIsSaving(false);
        return;
    }
    if (formData.maxAmount > 0 && formData.minAmount > formData.maxAmount) {
        toast({ title: "Invalid Amount Range", description: "Minimum amount cannot be greater than maximum amount.", variant: "destructive" });
        setIsSaving(false);
        return;
    }
    
    // Generate placeholder logo if URL is empty and name is provided
    let finalLogoUrl = formData.logoUrl;
    if (!finalLogoUrl && formData.name) {
        finalLogoUrl = `https://placehold.co/100x100.png?text=${encodeURIComponent(formData.name.substring(0,10))}`;
    }


    const methodData: Omit<PaymentMethodConfig, 'id' | 'createdAt' | 'updatedAt'> & { updatedAt: any, createdAt?: any } = {
      name: formData.name,
      transactionType: formData.transactionType,
      logoUrl: finalLogoUrl,
      enabled: formData.enabled,
      companyAccountNumber: formData.companyAccountNumber,
      companyAccountType: formData.companyAccountType,
      minAmount: formData.minAmount,
      maxAmount: formData.maxAmount,
      updatedAt: serverTimestamp(),
    };

    try {
      if (currentMethod && currentMethod.id) { // Editing existing method
        await updateDoc(doc(db, "paymentMethods", currentMethod.id), methodData);
        toast({ title: "Method Updated", description: `${formData.name} has been updated.` });
      } else { // Adding new method
        methodData.createdAt = serverTimestamp();
        await addDoc(collection(db, "paymentMethods"), methodData);
        toast({ title: "Method Added", description: `${formData.name} has been added.` });
      }
      setIsDialogOpen(false);
      fetchMethods(activeTab); // Refresh list
    } catch (error: any) {
      toast({ title: "Error Saving Method", description: error.message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const methodsToDisplay = activeTab === 'deposit' ? depositMethods : withdrawalMethods;

  return (
    <Card className="shadow-xl bg-card min-h-full">
      <CardHeader className="border-b flex flex-row justify-between items-center">
        <div>
          <CardTitle className="font-headline text-2xl flex items-center text-primary">
            <CreditCard className="mr-3 h-7 w-7" /> Payment Methods Management
          </CardTitle>
          <CardDescription>Configure deposit and withdrawal options for users.</CardDescription>
        </div>
        <Button variant="outline" size="icon" onClick={() => fetchMethods(activeTab)} disabled={isLoading}>
          <RefreshCw className={cn("h-4 w-4", { "animate-spin": isLoading })} />
        </Button>
      </CardHeader>
      <CardContent className="pt-6">
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'deposit' | 'withdrawal')} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="deposit">Deposit Methods</TabsTrigger>
            <TabsTrigger value="withdrawal">Withdrawal Methods</TabsTrigger>
          </TabsList>
          
          {['deposit', 'withdrawal'].map(type => (
            <TabsContent key={type} value={type}>
              <div className="flex justify-end mb-4">
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button onClick={handleAddNewMethod} disabled={isLoading || isSaving}>
                      <PlusCircle className="mr-2 h-4 w-4" /> Add New {type === 'deposit' ? 'Deposit' : 'Withdrawal'} Method
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                      <DialogTitle>{currentMethod ? 'Edit' : 'Add New'} {formData.transactionType === 'deposit' ? 'Deposit' : 'Withdrawal'} Method</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4 py-4 max-h-[70vh] overflow-y-auto pr-2">
                      <div>
                        <Label htmlFor="name">Method Name</Label>
                        <Input id="name" name="name" value={formData.name} onChange={handleInputChange} required disabled={isSaving} />
                      </div>
                      <div>
                        <Label htmlFor="logoUrl">Logo URL (leave blank for placeholder)</Label>
                        <Input id="logoUrl" name="logoUrl" value={formData.logoUrl} onChange={handleInputChange} placeholder="https://example.com/logo.png" disabled={isSaving} />
                         {formData.logoUrl && <Image src={formData.logoUrl} alt="logo preview" width={50} height={50} className="mt-2 rounded" data-ai-hint="payment logo" onError={(e) => e.currentTarget.style.display='none'}/>}
                         {!formData.logoUrl && formData.name && <Image src={`https://placehold.co/100x100.png?text=${encodeURIComponent(formData.name.substring(0,10))}`} alt="logo placeholder" width={50} height={50} className="mt-2 rounded" data-ai-hint="payment logo placeholder"/>}
                      </div>
                      <div>
                        <Label htmlFor="companyAccountNumber">Company Account Number</Label>
                        <Input id="companyAccountNumber" name="companyAccountNumber" value={formData.companyAccountNumber} onChange={handleInputChange} required disabled={isSaving} />
                      </div>
                       <div>
                        <Label htmlFor="companyAccountType">Company Account Type</Label>
                        <Select name="companyAccountType" value={formData.companyAccountType} onValueChange={(value) => handleSelectChange('companyAccountType', value)} disabled={isSaving}>
                          <SelectTrigger><SelectValue placeholder="Select account type" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="personal">Personal</SelectItem>
                            <SelectItem value="agent">Agent</SelectItem>
                            <SelectItem value="merchant">Merchant</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="minAmount">Minimum Amount</Label>
                          <Input id="minAmount" name="minAmount" type="number" value={formData.minAmount.toString()} onChange={handleInputChange} min="0" required disabled={isSaving} />
                        </div>
                        <div>
                          <Label htmlFor="maxAmount">Maximum Amount (0 for no limit)</Label>
                          <Input id="maxAmount" name="maxAmount" type="number" value={formData.maxAmount.toString()} onChange={handleInputChange} min="0" required disabled={isSaving} />
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch id="enabled" name="enabled" checked={formData.enabled} onCheckedChange={(checked) => handleSwitchChange('enabled', checked)} disabled={isSaving} />
                        <Label htmlFor="enabled">Enabled (Active)</Label>
                      </div>
                      <DialogFooter>
                        <DialogClose asChild><Button type="button" variant="outline" disabled={isSaving}>Cancel</Button></DialogClose>
                        <Button type="submit" disabled={isSaving}>{isSaving ? 'Saving...' : (currentMethod ? 'Save Changes' : 'Add Method')}</Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>

              {isLoading ? (
                <div className="text-center py-10">Loading {type} methods...</div>
              ) : methodsToDisplay.length === 0 ? (
                <p className="text-center text-muted-foreground py-10">No {type} methods configured yet.</p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Logo</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Company Account</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Min Amount</TableHead>
                        <TableHead>Max Amount</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {methodsToDisplay.map((method) => (
                        <TableRow key={method.id}>
                          <TableCell>
                            <Image src={method.logoUrl || `https://placehold.co/40x40.png?text=${method.name.charAt(0)}`} alt={method.name} width={40} height={40} className="rounded" data-ai-hint={`${method.name} logo`} />
                          </TableCell>
                          <TableCell className="font-medium">{method.name}</TableCell>
                          <TableCell>{method.companyAccountNumber}</TableCell>
                          <TableCell className="capitalize">{method.companyAccountType}</TableCell>
                          <TableCell>{method.minAmount.toFixed(2)}</TableCell>
                          <TableCell>{method.maxAmount > 0 ? method.maxAmount.toFixed(2) : 'N/A'}</TableCell>
                          <TableCell>
                            <Badge variant={method.enabled ? 'default' : 'outline'} className={method.enabled ? 'bg-green-500 hover:bg-green-600' : 'bg-red-500 hover:bg-red-600 text-white'}>
                              {method.enabled ? 'Active' : 'Inactive'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right space-x-2">
                            <Button variant="ghost" size="icon" onClick={() => handleEditMethod(method)} disabled={isSaving}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleDeleteMethod(method.id!)} disabled={isSaving} className="text-destructive hover:text-destructive/80">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
}

