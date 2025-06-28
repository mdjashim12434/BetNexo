'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trash2, Edit3, ListPlus, CreditCard, RefreshCw, Eye, EyeOff, Loader2, UploadCloud } from "lucide-react";
import Image from 'next/image';
import { useToast } from "@/hooks/use-toast";
import { cn } from '@/lib/utils';
import { 
  db, 
  collection, 
  addDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  where, 
  serverTimestamp, 
  type Timestamp,
  storage,
  storageRef,
  uploadBytes,
  getDownloadURL
} from '@/lib/firebase';
import { v4 as uuidv4 } from 'uuid';

export interface PaymentMethodConfig {
  id: string;
  name: string;
  logoUrl: string;
  companyAccountNumber: string; // e.g., Bkash number
  companyAccountType: 'personal' | 'agent' | 'merchant';
  minAmount: number;
  maxAmount: number;
  enabled: boolean;
  transactionType: 'deposit' | 'withdrawal';
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
  recommended?: boolean; // Optional: for flagging recommended methods
}

export default function PaymentMethodsManagementTab() {
  const { toast } = useToast();
  const [activeMainTab, setActiveMainTab] = useState<'deposit' | 'withdrawal'>('deposit');
  
  const [depositMethods, setDepositMethods] = useState<PaymentMethodConfig[]>([]);
  const [withdrawalMethods, setWithdrawalMethods] = useState<PaymentMethodConfig[]>([]);
  const [loading, setLoading] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [currentMethod, setCurrentMethod] = useState<Partial<PaymentMethodConfig> & { id?: string }>({});
  
  // Form fields state
  const [methodName, setMethodName] = useState('');
  const [logoUrl, setLogoUrl] = useState(''); // Used for preview
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [companyAccountNumber, setCompanyAccountNumber] = useState('');
  const [companyAccountType, setCompanyAccountType] = useState<'personal' | 'agent' | 'merchant'>('personal');
  const [minAmount, setMinAmount] = useState<number | string>('');
  const [maxAmount, setMaxAmount] = useState<number | string>('');
  const [isEnabled, setIsEnabled] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditing = !!currentMethod.id;


  const fetchMethods = useCallback(async (type: 'deposit' | 'withdrawal') => {
    setLoading(true);
    try {
      const q = query(collection(db, "paymentMethods"), where("transactionType", "==", type));
      const querySnapshot = await getDocs(q);
      const methods: PaymentMethodConfig[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        methods.push({ 
          id: doc.id,
          name: data.name || 'Unnamed Method',
          logoUrl: data.logoUrl || 'https://placehold.co/100x100.png?text=Icon',
          companyAccountNumber: data.companyAccountNumber || 'N/A',
          companyAccountType: data.companyAccountType || 'personal',
          minAmount: data.minAmount || 0,
          maxAmount: data.maxAmount || 0,
          enabled: data.enabled === undefined ? true : data.enabled,
          transactionType: data.transactionType,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
          recommended: data.recommended || false,
        });
      });
      if (type === 'deposit') setDepositMethods(methods);
      else setWithdrawalMethods(methods);
    } catch (error: any) {
      toast({ title: "Error fetching methods", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchMethods(activeMainTab);
  }, [activeMainTab, fetchMethods]);

  const resetForm = () => {
    setMethodName('');
    setLogoUrl('');
    setLogoFile(null);
    setCompanyAccountNumber('');
    setCompanyAccountType('personal');
    setMinAmount('');
    setMaxAmount('');
    setIsEnabled(true);
    setCurrentMethod({});
    setShowForm(false);
  };

  const handleAddNew = () => {
    resetForm();
    setShowForm(true);
  };

  const handleEdit = (method: PaymentMethodConfig) => {
    setCurrentMethod(method);
    setMethodName(method.name);
    setLogoUrl(method.logoUrl);
    setCompanyAccountNumber(method.companyAccountNumber);
    setCompanyAccountType(method.companyAccountType);
    setMinAmount(method.minAmount);
    setMaxAmount(method.maxAmount);
    setIsEnabled(method.enabled);
    setLogoFile(null);
    setShowForm(true);
  };

  const handleDelete = async (methodId: string) => {
    if (!confirm("Are you sure you want to delete this payment method?")) return;
    try {
      await deleteDoc(doc(db, "paymentMethods", methodId));
      toast({ title: "Success", description: "Payment method deleted." });
      fetchMethods(activeMainTab);
    } catch (error: any) {
      toast({ title: "Error deleting method", description: error.message, variant: "destructive" });
    }
  };
  
  const handleToggleEnable = async (method: PaymentMethodConfig) => {
    try {
      const methodRef = doc(db, "paymentMethods", method.id);
      await updateDoc(methodRef, { enabled: !method.enabled, updatedAt: serverTimestamp() });
      toast({ title: "Status Updated", description: `Method ${method.name} is now ${!method.enabled ? 'enabled' : 'disabled'}.` });
      fetchMethods(activeMainTab);
    } catch (error:any) {
      toast({ title: "Error updating status", description: error.message, variant: "destructive" });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!methodName || !companyAccountNumber) {
      toast({ title: "Missing Fields", description: "Name and Payment Number are required.", variant: "destructive" });
      return;
    }
    
    setIsSubmitting(true);
    
    let finalLogoUrl = currentMethod.logoUrl || '';

    try {
      if (logoFile) {
        const fileExtension = logoFile.name.split('.').pop();
        const fileName = `${uuidv4()}.${fileExtension}`;
        const logoStorageRef = storageRef(storage, `payment-method-logos/${fileName}`);
        
        await uploadBytes(logoStorageRef, logoFile);
        finalLogoUrl = await getDownloadURL(logoStorageRef);
      } else if (!isEditing) {
        finalLogoUrl = `https://placehold.co/100x100.png?text=${methodName.charAt(0)}`;
      }

      const finalMinAmount = Number(minAmount) || 0;
      const finalMaxAmount = Number(maxAmount) || 0;

      const methodData = {
        name: methodName,
        logoUrl: finalLogoUrl,
        companyAccountNumber,
        companyAccountType,
        minAmount: finalMinAmount,
        maxAmount: finalMaxAmount,
        enabled: isEnabled,
        transactionType: activeMainTab,
        updatedAt: serverTimestamp(),
      };

      if (isEditing) {
        const methodRef = doc(db, "paymentMethods", currentMethod.id!);
        await updateDoc(methodRef, methodData);
        toast({ title: "Success", description: "Payment method updated." });
      } else {
        await addDoc(collection(db, "paymentMethods"), { ...methodData, createdAt: serverTimestamp() });
        toast({ title: "Success", description: "New payment method added." });
      }
      resetForm();
      fetchMethods(activeMainTab);
    } catch (error: any) {
      console.error("Error submitting payment method:", error);
      toast({ title: "Error saving method", description: error.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const methodsToDisplay = activeMainTab === 'deposit' ? depositMethods : withdrawalMethods;
  const dataAiHintForLogo = (name: string = "Method") => {
    const firstWord = name.split(" ")[0].toLowerCase();
    return `${firstWord} logo`.substring(0,20);
  }


  return (
    <Card className="shadow-xl bg-card min-h-full">
      <CardHeader className="border-b flex flex-row justify-between items-center">
        <div>
          <CardTitle className="font-headline text-2xl flex items-center text-primary">
            <CreditCard className="mr-3 h-7 w-7" /> Payment Methods Management
          </CardTitle>
          <CardDescription>Configure deposit and withdrawal options for users.</CardDescription>
        </div>
         <Button variant="outline" size="icon" onClick={() => fetchMethods(activeMainTab)} disabled={loading} aria-label="Refresh methods">
          <RefreshCw className={cn("h-4 w-4", {"animate-spin": loading})} />
        </Button>
      </CardHeader>
      <CardContent className="pt-6">
        <Tabs value={activeMainTab} onValueChange={(value) => setActiveMainTab(value as 'deposit' | 'withdrawal')} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="deposit">Deposit Methods</TabsTrigger>
            <TabsTrigger value="withdrawal">Withdrawal Methods</TabsTrigger>
          </TabsList>

          {showForm ? (
            <Card className="mb-6 p-4 md:p-6 bg-muted/30">
              <CardHeader className="px-0 pt-0">
                <CardTitle className="text-xl">{isEditing ? 'Edit' : 'Add New'} {activeMainTab.charAt(0).toUpperCase() + activeMainTab.slice(1)} Method</CardTitle>
              </CardHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="methodName">Method Name (e.g., Bkash, Nagad)</Label>
                    <Input id="methodName" value={methodName} onChange={(e) => setMethodName(e.target.value)} placeholder="Bkash" required disabled={isSubmitting}/>
                  </div>
                   <div>
                    <Label htmlFor="logoFile">Method Logo</Label>
                      <div className="flex items-center gap-4 mt-2">
                        {logoUrl && (
                          <Image
                            src={logoUrl}
                            alt="Logo Preview"
                            width={50}
                            height={50}
                            className="rounded-md border bg-background"
                            unoptimized
                          />
                        )}
                        <label htmlFor="logoFile" className="flex-1 cursor-pointer">
                          <div className="flex items-center justify-center w-full px-4 py-3 border-2 border-dashed rounded-md hover:bg-muted">
                            <UploadCloud className="w-5 h-5 mr-2 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground truncate">{logoFile ? logoFile.name : 'Click to upload a logo'}</span>
                          </div>
                          <Input
                            id="logoFile"
                            type="file"
                            className="sr-only"
                            accept="image/png, image/jpeg, image/gif, image/webp"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                setLogoFile(file);
                                setLogoUrl(URL.createObjectURL(file));
                              }
                            }}
                            disabled={isSubmitting}
                          />
                        </label>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Recommended: Square image (e.g., PNG, JPG).
                      </p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="companyAccountNumber">Our {activeMainTab === 'deposit' ? 'Receiving' : 'Sending'} Payment Number</Label>
                    <Input id="companyAccountNumber" value={companyAccountNumber} onChange={(e) => setCompanyAccountNumber(e.target.value)} placeholder="017XXXXXXXX" required disabled={isSubmitting} />
                  </div>
                  <div>
                    <Label htmlFor="companyAccountType">Our Account Type</Label>
                    <Select value={companyAccountType} onValueChange={(value) => setCompanyAccountType(value as 'personal' | 'agent' | 'merchant')} disabled={isSubmitting}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="personal">Personal</SelectItem>
                        <SelectItem value="agent">Agent</SelectItem>
                        <SelectItem value="merchant">Merchant</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <div>
                    <Label htmlFor="minAmount">Minimum Amount (0 for no limit)</Label>
                    <Input id="minAmount" type="number" value={minAmount} onChange={(e) => setMinAmount(Number(e.target.value))} placeholder="100" disabled={isSubmitting}/>
                  </div>
                  <div>
                    <Label htmlFor="maxAmount">Maximum Amount (0 for no limit)</Label>
                    <Input id="maxAmount" type="number" value={maxAmount} onChange={(e) => setMaxAmount(Number(e.target.value))} placeholder="25000" disabled={isSubmitting}/>
                  </div>
                </div>
                <div className="flex items-center space-x-2 pt-2">
                  <Switch id="isEnabled" checked={isEnabled} onCheckedChange={setIsEnabled} disabled={isSubmitting}/>
                  <Label htmlFor="isEnabled">Enable this method</Label>
                </div>
                <div className="flex justify-end space-x-2 pt-2">
                  <Button type="button" variant="outline" onClick={resetForm} disabled={isSubmitting}>Cancel</Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {isSubmitting ? 'Saving...' : (isEditing ? 'Save Changes' : 'Add Method')}
                  </Button>
                </div>
              </form>
            </Card>
          ) : (
            <div className="text-right mb-4">
              <Button onClick={handleAddNew}><ListPlus className="mr-2 h-4 w-4" /> Add New {activeMainTab.charAt(0).toUpperCase() + activeMainTab.slice(1)} Method</Button>
            </div>
          )}
          
          {loading && <p className="text-center py-4">Loading methods...</p>}
          {!loading && methodsToDisplay.length === 0 && !showForm && (
            <p className="text-center text-muted-foreground py-6">No {activeMainTab} methods configured yet. Click "Add New" to get started.</p>
          )}
          {!loading && methodsToDisplay.length > 0 && (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Logo</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead className="hidden sm:table-cell">Payment Number</TableHead>
                    <TableHead className="hidden md:table-cell">Type</TableHead>
                    <TableHead className="hidden lg:table-cell">Limits (Min/Max)</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {methodsToDisplay.map((method) => (
                    <TableRow key={method.id}>
                      <TableCell>
                        <Image 
                          src={method.logoUrl || `https://placehold.co/40x40.png?text=${method.name?.charAt(0) || 'M'}`} 
                          alt={method.name || 'Payment Method Logo'} 
                          width={40} 
                          height={40} 
                          className="rounded"
                          data-ai-hint={dataAiHintForLogo(method.name)}
                          onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.onerror = null;
                              target.src = `https://placehold.co/40x40.png?text=${method.name?.charAt(0) || 'Err'}`;
                              target.setAttribute('data-ai-hint', 'fallback icon');
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <div>{method.name}</div>
                        <div className="text-xs text-muted-foreground sm:hidden">{method.companyAccountNumber}</div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">{method.companyAccountNumber}</TableCell>
                      <TableCell className="capitalize hidden md:table-cell">{method.companyAccountType}</TableCell>
                      <TableCell className="hidden lg:table-cell">{method.minAmount} / {method.maxAmount || 'N/A'}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" onClick={() => handleToggleEnable(method)} className={cn("h-auto px-2 py-1 text-xs", method.enabled ? "text-green-600 hover:text-green-700" : "text-red-600 hover:text-red-700")}>
                          {method.enabled ? <Eye className="mr-1 h-3.5 w-3.5" /> : <EyeOff className="mr-1 h-3.5 w-3.5" />}
                          {method.enabled ? 'Enabled' : 'Disabled'}
                        </Button>
                      </TableCell>
                      <TableCell className="text-right space-x-1">
                        <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => handleEdit(method)}><Edit3 className="h-4 w-4" /></Button>
                        <Button variant="destructive" size="icon" className="h-8 w-8" onClick={() => handleDelete(method.id)}><Trash2 className="h-4 w-4" /></Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </Tabs>
      </CardContent>
    </Card>
  );
}
