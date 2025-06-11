
'use client';

import AppLayout from '@/components/AppLayout';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/contexts/AuthContext';
import { Edit3, Mail, Phone, ShieldCheck, UploadCloud, User as UserIcon, LogOut, Globe, History, CheckCircle, XCircle, Clock, RefreshCw } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { db, doc, updateDoc, collection, query, where, getDocs, orderBy, Timestamp } from '@/lib/firebase';
import type { Transaction, TransactionStatus } from '@/components/admin/TransactionsLogTab'; // Import Transaction type
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface EditableUserFields {
  name: string;
  email: string;
  phone: string;
  country: string;
}

export default function ProfilePage() {
  const { user, logout, login, loadingAuth } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [editableFields, setEditableFields] = useState<EditableUserFields>({
    name: '',
    email: '',
    phone: '',
    country: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userTransactions, setUserTransactions] = useState<Transaction[]>([]);
  const [loadingTransactions, setLoadingTransactions] = useState(false);

  const fetchUserTransactions = useCallback(async () => {
    if (!user) return;
    setLoadingTransactions(true);
    try {
      const q = query(
        collection(db, "transactions"),
        where("userId", "==", user.id),
        orderBy("requestedAt", "desc")
      );
      const querySnapshot = await getDocs(q);
      const fetchedTransactions: Transaction[] = [];
      querySnapshot.forEach((doc) => {
        fetchedTransactions.push({ id: doc.id, ...doc.data() } as Transaction);
      });
      setUserTransactions(fetchedTransactions);
    } catch (error: any) {
      console.error("Error fetching user transactions:", error);
      let description = "Could not fetch your transaction history.";
      if (error.message) {
        description += ` ${error.message}`;
      }
      if (error.code) {
        description += ` (Code: ${error.code})`;
      }
      // Check if the error message contains a link to create an index
      if (error.message && error.message.includes("https://console.firebase.google.com/project/")) {
        description += " This usually means a composite index is required. Please check the browser console for a link to create it, or create it manually in Firestore (Indexes tab) for 'transactions' collection with fields 'userId' (Ascending) and 'requestedAt' (Descending).";
      }
      toast({ title: "Error", description, variant: "destructive", duration: 10000 });
    } finally {
      setLoadingTransactions(false);
    }
  }, [user, toast]);

  useEffect(() => {
    if (!loadingAuth && !user) {
      router.push('/login');
    } else if (user) {
      setEditableFields({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        country: user.country || '',
      });
      fetchUserTransactions();
    }
  }, [user, router, loadingAuth, fetchUserTransactions]);

  if (loadingAuth) {
    return <AppLayout><div className="flex items-center justify-center min-h-screen"><div className="text-center p-10">Loading session...</div></div></AppLayout>;
  }

  if (!user) {
     return <AppLayout><div className="flex items-center justify-center min-h-screen"><div className="text-center p-10">Redirecting to login...</div></div></AppLayout>;
  }
  
  const handleEditToggle = () => setIsEditing(!isEditing);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditableFields(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveChanges = async () => {
    if (!user) return;
    setIsSubmitting(true);
    try {
      const userDocRef = doc(db, "users", user.id);
      await updateDoc(userDocRef, {
        name: editableFields.name,
        email: editableFields.email, // Email updates should be handled carefully due to Firebase Auth
        phone: editableFields.phone,
        country: editableFields.country,
      });
      const updatedUserForContext = {
        ...user,
        name: editableFields.name,
        email: editableFields.email,
        phone: editableFields.phone,
        country: editableFields.country,
      };
      await login(updatedUserForContext, false); // Re-login to update context
      toast({ title: "Profile Updated", description: "Your changes have been saved." });
      setIsEditing(false);
    } catch (error: any) {
      console.error("Error updating profile:", error);
      toast({ title: "Update Failed", description: `Could not save your changes. ${error.message}`, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = () => {
    logout();
    toast({ title: "Logged Out", description: "You have been successfully logged out." });
    router.push('/');
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && user) {
      toast({ title: "File Selected", description: `${file.name} ready for upload.` });
      setIsSubmitting(true);
      try {
        // This is a mock upload. In a real app, you'd upload to Firebase Storage
        // and then save the URL or reference to the user's document.
        await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate upload delay
        
        const userDocRef = doc(db, "users", user.id);
        await updateDoc(userDocRef, { isVerified: true, idDocumentStatus: 'pending_review' }); // Example status
        
        const verifiedUserForContext = { ...user, isVerified: true }; // Or reflect the new status
        await login(verifiedUserForContext, false); // Update context
        
        toast({ title: "Verification Submitted", description: "Your document has been submitted and is pending review (mocked as auto-verified for now)." });
      } catch (error: any) {
        toast({ title: "Upload Failed", description: `Could not submit document. ${error.message}`, variant: "destructive"});
      } finally {
        setIsSubmitting(false);
      }
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
      case 'approved': return <CheckCircle className="h-3.5 w-3.5 text-green-500" />;
      case 'pending': return <Clock className="h-3.5 w-3.5 text-yellow-500" />;
      case 'rejected': return <XCircle className="h-3.5 w-3.5 text-red-500" />;
      default: return null;
    }
  };

  const formatDate = (timestamp?: Timestamp) => {
    if (!timestamp) return 'N/A';
    try {
      return format(timestamp.toDate(), 'PPp'); 
    } catch (e) {
      console.error("Error formatting date:", e, "Timestamp:", timestamp);
      return 'Invalid Date';
    }
  };

  return (
    <AppLayout>
      <div className="space-y-8">
        <Card className="shadow-lg overflow-hidden">
          <CardHeader className="bg-card-foreground/5 p-6">
            <div className="flex items-center space-x-4">
              <Avatar className="h-20 w-20 border-2 border-primary">
                <AvatarImage src={user.avatarUrl || `https://placehold.co/80x80.png?text=${user.name ? user.name.charAt(0).toUpperCase() : 'U'}`} alt={user.name || 'User'} data-ai-hint="user avatar" />
                <AvatarFallback className="text-3xl">{user.name ? user.name.charAt(0).toUpperCase() : 'U'}</AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="font-headline text-2xl">{user.name || 'User Profile'}</CardTitle>
                <CardDescription className="flex items-center mt-1">
                  {user.isVerified ? (
                    <><ShieldCheck className="h-4 w-4 mr-1 text-green-500" /> Verified</>
                  ) : (
                    <><ShieldCheck className="h-4 w-4 mr-1 text-yellow-500" /> Not Verified</>
                  )}
                   <span className="mx-2">|</span> Currency: {user.currency}
                   <span className="mx-2">|</span> Balance: {user.balance?.toFixed(2) || '0.00'} {user.currency}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-headline text-xl">Personal Information</h3>
                <Button variant="ghost" size="icon" onClick={handleEditToggle} disabled={isSubmitting}>
                  <Edit3 className="h-5 w-5" />
                </Button>
              </div>
              {isEditing ? (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name">Full Name</Label>
                    <Input id="name" name="name" value={editableFields.name} onChange={handleInputChange} disabled={isSubmitting} />
                  </div>
                  <div>
                    <Label htmlFor="email">Email Address (Cannot change here)</Label>
                    <Input id="email" name="email" type="email" value={editableFields.email} disabled={true} title="Email cannot be changed here." />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input id="phone" name="phone" type="tel" value={editableFields.phone} onChange={handleInputChange} disabled={isSubmitting} />
                  </div>
                  <div>
                    <Label htmlFor="country">Country</Label>
                    <Input id="country" name="country" value={editableFields.country} onChange={handleInputChange} disabled={isSubmitting} />
                  </div>
                  <Button onClick={handleSaveChanges} disabled={isSubmitting}>
                    {isSubmitting ? 'Saving...' : 'Save Changes'}
                  </Button>
                  <Button variant="outline" onClick={handleEditToggle} className="ml-2" disabled={isSubmitting}>Cancel</Button>
                </div>
              ) : (
                <ul className="space-y-3 text-sm">
                  <li className="flex items-center"><UserIcon className="h-5 w-5 mr-3 text-primary" /> Name: {user.name || 'N/A'}</li>
                  <li className="flex items-center"><Mail className="h-5 w-5 mr-3 text-primary" /> Email: {user.email || 'N/A'}</li>
                  <li className="flex items-center"><Phone className="h-5 w-5 mr-3 text-primary" /> Phone: {user.phone || 'N/A'}</li>
                  <li className="flex items-center"><Globe className="h-5 w-5 mr-3 text-primary" /> Country: {user.country || 'N/A'}</li>
                </ul>
              )}
            </div>

            <Separator />

            <div>
              <h3 className="font-headline text-xl mb-4">Identity Verification</h3>
              {user.isVerified ? (
                 <p className="text-green-500 flex items-center"><ShieldCheck className="h-5 w-5 mr-2" /> Your identity is verified.</p>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Please upload a document (e.g., National ID, Passport) to verify your identity.
                  </p>
                  <div className="relative">
                    <Input type="file" id="documentUpload" className="opacity-0 absolute inset-0 w-full h-full cursor-pointer" onChange={handleFileUpload} disabled={isSubmitting || isEditing} accept="image/jpeg,image/png,application/pdf" />
                    <Button asChild variant="outline" className="w-full cursor-pointer" disabled={isSubmitting || isEditing}>
                      <label htmlFor="documentUpload" className="flex items-center justify-center cursor-pointer">
                        <UploadCloud className="h-5 w-5 mr-2" /> {isSubmitting ? 'Uploading...' : 'Upload Document'}
                      </label>
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">Supported formats: JPG, PNG, PDF. Max size: 5MB.</p>
                </div>
              )}
            </div>
            
            <Separator />

            <Card>
              <CardHeader className="flex flex-row justify-between items-center">
                <CardTitle className="font-headline text-xl flex items-center">
                  <History className="mr-2 h-5 w-5 text-primary" /> Transaction History
                </CardTitle>
                <Button variant="ghost" size="icon" onClick={fetchUserTransactions} disabled={loadingTransactions} aria-label="Refresh transactions">
                    <RefreshCw className={cn("h-4 w-4", {"animate-spin": loadingTransactions})} />
                </Button>
              </CardHeader>
              <CardContent>
                {loadingTransactions ? (
                  <div className="text-center py-4">Loading transaction history...</div>
                ) : userTransactions.length > 0 ? (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Type</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Method</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Requested</TableHead>
                          <TableHead>Processed</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {userTransactions.map((txn) => (
                          <TableRow key={txn.id}>
                            <TableCell className="capitalize">{txn.type}</TableCell>
                            <TableCell>{txn.amount.toFixed(2)} {txn.currency}</TableCell>
                            <TableCell>{txn.method}</TableCell>
                            <TableCell>
                              <Badge
                                variant={getStatusBadgeVariant(txn.status)}
                                className={cn("capitalize text-xs flex items-center gap-1", {
                                  'bg-green-500/20 text-green-700 border-green-500/30 dark:text-green-400 dark:border-green-700/50': txn.status === 'approved',
                                  'bg-yellow-500/20 text-yellow-700 border-yellow-500/30 dark:text-yellow-400 dark:border-yellow-700/50': txn.status === 'pending',
                                })}
                              >
                                {getStatusIcon(txn.status)}
                                {txn.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-xs">{formatDate(txn.requestedAt)}</TableCell>
                            <TableCell className="text-xs">{formatDate(txn.processedAt)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">No transactions found.</p>
                )}
              </CardContent>
            </Card>

            <Separator />
            
            <Button variant="destructive" onClick={handleLogout} className="w-full sm:w-auto" disabled={isSubmitting}>
              <LogOut className="mr-2 h-4 w-4" /> Logout
            </Button>

          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
