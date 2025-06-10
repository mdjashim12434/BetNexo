
'use client';

import AppLayout from '@/components/AppLayout';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/contexts/AuthContext';
import { Edit3, Mail, Phone, ShieldCheck, UploadCloud, User as UserIcon, LogOut, Globe } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { db, doc, updateDoc } from '@/lib/firebase'; // Import Firestore

interface EditableUserFields {
  name: string;
  email: string;
  phone: string;
  country: string;
}

export default function ProfilePage() {
  const { user, logout, login, loadingAuth, updateBalance } = useAuth(); // login for mock updates, updateBalance for firestore
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
    }
  }, [user, router, loadingAuth]);

  if (loadingAuth || !user) {
    return <AppLayout><div className="text-center">Loading profile or redirecting...</div></AppLayout>;
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
        email: editableFields.email, // Be cautious updating email if it's used for Firebase Auth login
        phone: editableFields.phone,
        country: editableFields.country,
      });
      // Re-fetch or update user context. For simplicity, we'll mock update via login.
      // A better way would be to refetch user data or have AuthContext update from Firestore snapshot listener.
      const updatedUserForContext = {
        ...user,
        name: editableFields.name,
        email: editableFields.email,
        phone: editableFields.phone,
        country: editableFields.country,
      };
      await login(updatedUserForContext); // This will re-fetch from Firestore in the new AuthContext
      toast({ title: "Profile Updated", description: "Your changes have been saved." });
      setIsEditing(false);
    } catch (error) {
      console.error("Error updating profile:", error);
      toast({ title: "Update Failed", description: "Could not save your changes.", variant: "destructive" });
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
      // Mock upload logic
      // In real app: upload file to Firebase Storage, then update user doc with file URL and set verification pending
      setIsSubmitting(true);
      try {
        // Simulate backend processing
        await new Promise(resolve => setTimeout(resolve, 2000));
        const userDocRef = doc(db, "users", user.id);
        await updateDoc(userDocRef, { isVerified: true }); // Mock: directly verify
         const verifiedUserForContext = { ...user, isVerified: true };
        await login(verifiedUserForContext); // Update context
        toast({ title: "Verification Submitted", description: "Your document is being reviewed (mock verified)." });
      } catch (error) {
        toast({ title: "Upload Failed", description: "Could not submit document.", variant: "destructive"});
      } finally {
        setIsSubmitting(false);
      }
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
                    <Label htmlFor="email">Email Address</Label>
                    <Input id="email" name="email" type="email" value={editableFields.email} onChange={handleInputChange} disabled={isSubmitting} />
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
                    <Input type="file" id="documentUpload" className="opacity-0 absolute inset-0 w-full h-full cursor-pointer" onChange={handleFileUpload} disabled={isSubmitting} />
                    <Button asChild variant="outline" className="w-full cursor-pointer" disabled={isSubmitting}>
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

            <Button variant="destructive" onClick={handleLogout} className="w-full sm:w-auto" disabled={isSubmitting}>
              <LogOut className="mr-2 h-4 w-4" /> Logout
            </Button>

          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
