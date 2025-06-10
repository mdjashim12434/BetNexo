'use client';

import AppLayout from '@/components/AppLayout';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/contexts/AuthContext';
import { Edit3, Mail, Phone, ShieldCheck, UploadCloud, User as UserIcon, LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';

// Mock data types, assuming User type is extended or similar
interface EditableUserFields {
  name: string;
  email: string;
  phone: string;
}

export default function ProfilePage() {
  const { user, logout, login } = useAuth(); // Using login for mock updates
  const router = useRouter();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [editableFields, setEditableFields] = useState<EditableUserFields>({
    name: '',
    email: '',
    phone: '',
  });

  useEffect(() => {
    if (!user) {
      router.push('/login');
    } else {
      setEditableFields({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
      });
    }
  }, [user, router]);

  if (!user) {
    return <AppLayout><div className="text-center">Loading profile or redirecting...</div></AppLayout>;
  }
  
  const handleEditToggle = () => setIsEditing(!isEditing);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditableFields(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveChanges = () => {
    // Mock save changes
    if (user) {
        const updatedUser = {
            ...user,
            name: editableFields.name,
            email: editableFields.email,
            phone: editableFields.phone,
        };
        login(updatedUser); // Using login to update context, replace with actual update logic
        toast({ title: "Profile Updated", description: "Your changes have been saved." });
        setIsEditing(false);
    }
  };

  const handleLogout = () => {
    logout();
    toast({ title: "Logged Out", description: "You have been successfully logged out." });
    router.push('/');
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      toast({ title: "File Selected", description: `${file.name} ready for upload.` });
      // Mock upload logic
      setTimeout(() => {
        if(user) {
            const verifiedUser = {...user, isVerified: true };
            login(verifiedUser); // Mock verification
            toast({ title: "Verification Submitted", description: "Your document is being reviewed." });
        }
      }, 2000);
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
                <Button variant="ghost" size="icon" onClick={handleEditToggle}>
                  <Edit3 className="h-5 w-5" />
                </Button>
              </div>
              {isEditing ? (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name">Full Name</Label>
                    <Input id="name" name="name" value={editableFields.name} onChange={handleInputChange} />
                  </div>
                  <div>
                    <Label htmlFor="email">Email Address</Label>
                    <Input id="email" name="email" type="email" value={editableFields.email} onChange={handleInputChange} />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input id="phone" name="phone" type="tel" value={editableFields.phone} onChange={handleInputChange} />
                  </div>
                  <Button onClick={handleSaveChanges}>Save Changes</Button>
                  <Button variant="outline" onClick={handleEditToggle} className="ml-2">Cancel</Button>
                </div>
              ) : (
                <ul className="space-y-3 text-sm">
                  <li className="flex items-center"><UserIcon className="h-5 w-5 mr-3 text-primary" /> Name: {user.name || 'N/A'}</li>
                  <li className="flex items-center"><Mail className="h-5 w-5 mr-3 text-primary" /> Email: {user.email || 'N/A'}</li>
                  <li className="flex items-center"><Phone className="h-5 w-5 mr-3 text-primary" /> Phone: {user.phone || 'N/A'}</li>
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
                    <Input type="file" id="documentUpload" className="opacity-0 absolute inset-0 w-full h-full cursor-pointer" onChange={handleFileUpload} />
                    <Button asChild variant="outline" className="w-full cursor-pointer">
                      <label htmlFor="documentUpload" className="flex items-center justify-center cursor-pointer">
                        <UploadCloud className="h-5 w-5 mr-2" /> Upload Document
                      </label>
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">Supported formats: JPG, PNG, PDF. Max size: 5MB.</p>
                </div>
              )}
            </div>
            
            <Separator />

            <Button variant="destructive" onClick={handleLogout} className="w-full sm:w-auto">
              <LogOut className="mr-2 h-4 w-4" /> Logout
            </Button>

          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
