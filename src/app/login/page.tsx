
'use client';

import Link from 'next/link';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Phone, Eye, EyeOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { auth, signInWithEmailAndPassword, sendEmailVerification, findUserByCustomId, type FirebaseUserType } from '@/lib/firebase';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import { Separator } from '@/components/ui/separator';

import { GoogleIcon } from '@/components/icons/GoogleIcon';
import { VkIcon } from '@/components/icons/VkIcon';
import { XIcon } from '@/components/icons/XIcon';
import { DiscordIcon } from '@/components/icons/DiscordIcon';
import { MoreIcon } from '@/components/icons/MoreIcon';


const loginSchema = z.object({
  emailOrUserId: z.string().min(1, { message: 'Email or User ID is required.' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
});

type LoginFormValues = z.infer<typeof loginSchema>;


export default function LoginPage() {
  const { user: appUser, loadingAuth, login } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  
  const [showVerificationMessage, setShowVerificationMessage] = useState(false);
  const [currentUserForVerification, setCurrentUserForVerification] = useState<FirebaseUserType | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      emailOrUserId: '',
      password: '',
    },
  });

  async function onSubmit(data: LoginFormValues) {
    form.clearErrors();
    setShowVerificationMessage(false);
    setCurrentUserForVerification(null);
    form.setValue('emailOrUserId', data.emailOrUserId.trim());

    let emailToLogin = data.emailOrUserId.trim();
    const isCustomId = /^\d{9}$/.test(emailToLogin);

    try {
      if (isCustomId) {
        const userDoc = await findUserByCustomId(emailToLogin);
        if (userDoc && userDoc.email) {
          emailToLogin = userDoc.email;
        } else {
          toast({ title: "Login Failed", description: "User ID not found.", variant: "destructive", duration: 7000 });
          form.setError("emailOrUserId", { type: "manual", message: "User ID not found." });
          return;
        }
      }

      if (!z.string().email().safeParse(emailToLogin).success) {
          toast({ title: "Invalid Input", description: "Please enter a valid email address or a 9-digit User ID.", variant: "destructive" });
          form.setError("emailOrUserId", { type: "manual", message: "Invalid email format." });
          return;
      }
        
      const userCredential = await signInWithEmailAndPassword(auth, emailToLogin, data.password);
      const fbUser = userCredential.user;

      if (!fbUser.emailVerified) {
        setCurrentUserForVerification(fbUser);
        setShowVerificationMessage(true);
        toast({
          title: "Email Not Verified",
          description: "Please check your inbox to verify your email. You can request a new verification email below.",
          variant: "destructive",
          duration: 10000,
        });
        return; 
      }
      
      await login({ id: fbUser.uid, email: fbUser.email, emailVerified: fbUser.emailVerified });
      
      toast({ title: "Login Successful", description: "Welcome back! Redirecting..." });

    } catch (error: any) {
      console.error("Login failed on page:", error);
      let errorMessage = "Could not log in. Please check credentials or try again.";
      
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        errorMessage = "Invalid credentials. Please try again.";
        form.setError("password", { type: "manual", message: " " });
        form.setError("emailOrUserId", { type: "manual", message: "Invalid email/User ID or password." });
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = "Too many login attempts. Please try again later.";
      }
      
      toast({ title: "Login Failed", description: errorMessage, variant: "destructive", duration: 7000 });
    }
  }

  const handleResendVerificationEmail = async () => {
    if (!currentUserForVerification) {
      toast({ title: "Error", description: "No user context for resending email.", variant: "destructive" });
      return;
    }
    try {
      await sendEmailVerification(currentUserForVerification);
      toast({ title: "Verification Email Sent", description: "A new verification email has been sent. Please check your inbox (and spam folder)." });
    } catch (resendError) {
      console.error("Error resending verification email:", resendError);
      toast({ title: "Error", description: "Could not resend verification email. Please try again later.", variant: "destructive" });
    }
  };


  // If auth state is loading, or a user is already logged in,
  // the AuthProvider will show a loader or handle the redirect.
  // This component should render nothing to prevent a flash of content.
  if (loadingAuth || appUser) {
    return null;
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900">
      <div className="flex-shrink-0 p-4">
         <Button variant="ghost" size="icon" className="rounded-full bg-slate-200 hover:bg-slate-300" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5 text-slate-600" />
            <span className="sr-only">Back</span>
         </Button>
      </div>

      <div className="relative h-48 flex-shrink-0">
          <Image src="https://placehold.co/800x400.png" alt="Volleyballs" layout="fill" objectFit="cover" data-ai-hint="volleyball sport" />
      </div>

      <div className="flex-grow p-6 sm:p-8">
        <h1 className="text-3xl font-bold text-slate-800 mb-8">Log in</h1>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="relative">
              <Input 
                {...form.register("emailOrUserId")} 
                placeholder="Email, ID, or username"
                className="h-12 border-0 border-b-2 border-slate-200 rounded-none bg-transparent px-0 focus:ring-0 focus:border-primary"
              />
              <Button type="button" variant="ghost" size="icon" className="absolute right-0 top-1/2 -translate-y-1/2 h-10 w-10 text-slate-500">
                <Phone className="h-5 w-5"/>
              </Button>
              {form.formState.errors.emailOrUserId && <p className="text-sm text-red-500 mt-1">{form.formState.errors.emailOrUserId.message}</p>}
            </div>

            <div className="relative">
              <Input 
                {...form.register("password")} 
                type={showPassword ? 'text' : 'password'}
                placeholder="Password"
                className="h-12 border-0 border-b-2 border-slate-200 rounded-none bg-transparent px-0 focus:ring-0 focus:border-primary"
              />
              <Button type="button" variant="ghost" size="icon" onClick={() => setShowPassword(!showPassword)} className="absolute right-0 top-1/2 -translate-y-1/2 h-10 w-10 text-slate-500">
                {showPassword ? <EyeOff className="h-5 w-5"/> : <Eye className="h-5 w-5"/>}
              </Button>
              {form.formState.errors.password && <p className="text-sm text-red-500 mt-1">{form.formState.errors.password.message}</p>}
            </div>
            
            <Button type="submit" className="w-full h-12 text-base font-semibold" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? 'Logging in...' : 'Log in'}
            </Button>
          </form>
        </Form>
        
        {showVerificationMessage && (
          <div className="mt-4 p-4 border border-yellow-500 rounded-md bg-yellow-500/10 text-center">
            <p className="text-sm text-yellow-700">
              Your email is not verified. Please check your inbox (and spam folder) for the verification link.
            </p>
            {currentUserForVerification && (
              <Button
                variant="link"
                className="mt-2 text-primary h-auto p-0"
                onClick={handleResendVerificationEmail}
                disabled={form.formState.isSubmitting}
              >
                Resend Verification Email
              </Button>
            )}
          </div>
        )}

        <div className="text-center mt-4">
          <Button variant="link" className="p-0 text-primary h-auto font-semibold text-sm">
            Forgot password?
          </Button>
        </div>
      </div>
      
      <div className="px-6 sm:px-8 pb-8">
        <div className="flex items-center justify-center gap-4 my-6">
            <Button variant="outline" size="icon" className="h-12 w-12 rounded-full border-slate-300 text-slate-600">
                <VkIcon className="h-6 w-6" />
            </Button>
            <Button variant="outline" size="icon" className="h-12 w-12 rounded-full border-slate-300 text-slate-600">
                <GoogleIcon className="h-6 w-6" />
            </Button>
             <Button variant="outline" size="icon" className="h-12 w-12 rounded-full border-slate-300 text-slate-600">
                <XIcon className="h-6 w-6" />
            </Button>
             <Button variant="outline" size="icon" className="h-12 w-12 rounded-full border-slate-300 text-slate-600">
                <DiscordIcon className="h-6 w-6" />
            </Button>
             <Button variant="outline" size="icon" className="h-12 w-12 rounded-full border-slate-300 text-slate-600">
                <MoreIcon className="h-6 w-6" />
            </Button>
        </div>

        <div className="text-center text-sm text-slate-600">
          Don&apos;t have an account?{' '}
          <Button variant="link" className="p-0 text-primary h-auto font-semibold" asChild>
            <Link href="/signup">Register</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
