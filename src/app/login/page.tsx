
'use client';

import Link from 'next/link';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Mail, Phone } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { auth, signInWithEmailAndPassword, sendEmailVerification } from '@/lib/firebase';
import { useEffect } from 'react';


// Ensure emailOrPhone is a valid email for this flow
const loginSchema = z.object({
  emailOrPhone: z.string().email({ message: 'Please enter a valid email address' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const { login: loginToAppContext, user: appUser, loadingAuth, firebaseUser } = useAuth(); // Renamed to avoid confusion
  const router = useRouter();
  const { toast } = useToast();

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      emailOrPhone: '',
      password: '',
    },
  });

  useEffect(() => {
    if (!loadingAuth && appUser) {
      router.push('/');
    }
  }, [appUser, loadingAuth, router]);


  async function onSubmit(data: LoginFormValues) {
    form.clearErrors();
    form.setValue('emailOrPhone', data.emailOrPhone.trim());

    try {
      // 1. Sign in with Firebase Auth
      const userCredential = await signInWithEmailAndPassword(auth, data.emailOrPhone, data.password);
      const fbUser = userCredential.user;

      // 2. Check email verification
      if (!fbUser.emailVerified) {
        toast({
          title: "Email Not Verified",
          description: "Please check your inbox to verify your email. You can request a new verification email if needed.",
          variant: "destructive",
          duration: 10000,
          action: (
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                try {
                  await sendEmailVerification(fbUser);
                  toast({ title: "Verification Email Sent", description: "A new verification email has been sent to your address." });
                } catch (resendError) {
                  console.error("Error resending verification email:", resendError);
                  toast({ title: "Error", description: "Could not resend verification email. Please try again later.", variant: "destructive" });
                }
              }}
            >
              Resend Email
            </Button>
          )
        });
        return; // Stop login process
      }

      // 3. Email is verified, proceed to log into app context (fetches/creates Firestore doc)
      const userPayloadForAppContext = {
        id: fbUser.uid,
        email: fbUser.email,
        // Other fields like name, phone, currency, country will be fetched from Firestore by loginToAppContext
        // For now, we only need enough to identify the user and confirm email verification status
        currency: 'USD', // Dummy, will be overwritten by Firestore if doc exists
        emailVerified: fbUser.emailVerified,
      };
      
      await loginToAppContext(userPayloadForAppContext, false); // false for isNewUser
      
      toast({ title: "Login Successful", description: "Welcome back!" });
      router.push('/');

    } catch (error: any) {
      console.error("Login failed on page:", error);
      let errorMessage = "Could not log in. Please check credentials or try again.";
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        errorMessage = "Invalid email or password. Please try again.";
        form.setError("emailOrPhone", { type: "manual", message: " " }); // Clearer indication
        form.setError("password", { type: "manual", message: "Invalid email or password." });
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = "Too many login attempts. Please try again later.";
      } else if (error.message) {
        errorMessage = error.message;
      }
      toast({ title: "Login Failed", description: errorMessage, variant: "destructive" });
    }
  }
  
  // If auth is still loading, show a generic loading message
  if (loadingAuth) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md shadow-xl">
          <CardHeader className="text-center">
            <CardTitle className="font-headline text-3xl text-primary">Loading...</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center text-muted-foreground">Checking your session...</p>
          </CardContent>
        </Card>
      </div>
    );
  }


  // If user is already logged in (and verified), redirect from login page
  // This check is now mostly handled by onAuthStateChanged, but as a fallback
  if (appUser && appUser.emailVerified) {
     router.push('/'); // Should ideally be caught by useEffect, but good to have
     return <div className="text-center p-10">Redirecting...</div>; // Or a loading spinner
  }


  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <CardTitle className="font-headline text-3xl text-primary">BETBABU Login</CardTitle>
          <CardDescription>Access your account to start playing</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="emailOrPhone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                        <Input type="email" placeholder="your@email.com" {...field} className="pl-10" />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full font-semibold" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? 'Logging In...' : 'Login'}
              </Button>
            </form>
          </Form>
          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">Or login with</p>
            <div className="mt-2 flex justify-center space-x-3">
              <Button variant="outline" className="w-full" disabled>
                <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24" fill="currentColor" data-ai-hint="google logo">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  <path d="M1 1h22v22H1z" fill="none" />
                </svg>
                Google (Coming Soon)
              </Button>
            </div>
          </div>
        </CardContent>
        <CardFooter className="text-center text-sm">
          <p className="w-full">
            Don&apos;t have an account?{' '}
            <Button variant="link" className="p-0 text-primary" asChild>
              <Link href="/signup">Sign up</Link>
            </Button>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
