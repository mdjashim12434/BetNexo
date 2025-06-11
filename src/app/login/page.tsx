
'use client';

import Link from 'next/link';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { useAuth, type User } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Mail, Phone, MessageSquare, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { auth, signInWithEmailAndPassword, sendEmailVerification, type FirebaseUserType } from '@/lib/firebase';
import { useEffect, useState } from 'react';

const loginSchema = z.object({
  emailOrPhone: z.string().email({ message: 'Please enter a valid email address' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
  rememberMe: z.boolean().optional(),
});

type LoginFormValues = z.infer<typeof loginSchema>;

type AuthMethod = 'email' | 'phone' | 'sms' | 'social';

export default function LoginPage() {
  const { login: loginToAppContext, user: appUser, loadingAuth, firebaseUser } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [activeMethod, setActiveMethod] = useState<AuthMethod>('email');
  const [showVerificationMessage, setShowVerificationMessage] = useState(false);
  const [currentUserForVerification, setCurrentUserForVerification] = useState<FirebaseUserType | null>(null);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      emailOrPhone: '',
      password: '',
      rememberMe: false,
    },
  });

  // Effect to redirect if user is already logged in and verified
  useEffect(() => {
    if (!loadingAuth && appUser && appUser.emailVerified) {
      if (appUser.role === 'Admin') {
        router.push('/admin');
      } else {
        router.push('/user-dashboard');
      }
    }
  }, [appUser, loadingAuth, router]);

  async function onSubmit(data: LoginFormValues) {
    form.clearErrors();
    setShowVerificationMessage(false);
    setCurrentUserForVerification(null);
    form.setValue('emailOrPhone', data.emailOrPhone.trim());

    try {
      const userCredential = await signInWithEmailAndPassword(auth, data.emailOrPhone, data.password);
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
        // Do not proceed to loginToAppContext or redirect if email is not verified
        // The user context will remain null, and they will stay on the login page
        return;
      }
      
      // Email is verified, proceed to set app context and redirect
      const userPayloadForAppContext = {
        id: fbUser.uid,
        email: fbUser.email,
        // currency and role will be fetched by loginToAppContext
        emailVerified: fbUser.emailVerified,
      };
      
      const loggedInUser: User | null = await loginToAppContext(userPayloadForAppContext, false);
      
      if (loggedInUser) {
        toast({ title: "Login Successful", description: "Welcome back!" });
        // Redirection is handled by the useEffect hook once appUser is set
      } else {
         // This case implies loginToAppContext failed to retrieve/create user doc
         toast({ title: "Login Error", description: "Could not retrieve your user details after login. Please check if your account is fully set up or contact support.", variant: "destructive", duration: 7000 });
      }

    } catch (error: any) {
      console.error("Login failed on page:", error);
      let errorMessage = "Could not log in. Please check credentials or try again.";
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        errorMessage = "Invalid email or password. Please try again.";
        form.setError("emailOrPhone", { type: "manual", message: " " });
        form.setError("password", { type: "manual", message: "Invalid email or password." });
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = "Too many login attempts. Please try again later.";
      } else if (error.message) { // Catch errors from loginToAppContext like "User data not found"
        errorMessage = error.message;
      }
      toast({ title: "Login Failed", description: errorMessage, variant: "destructive" });
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


  if (loadingAuth) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <div className="text-center text-muted-foreground">Loading session...</div>
      </div>
    );
  }
  
  // If appUser is set and emailVerified, useEffect will redirect. Show a message.
  if (appUser && appUser.emailVerified) {
     const destination = appUser.role === 'Admin' ? 'Admin Dashboard' : 'User Dashboard';
     return <div className="flex min-h-screen items-center justify-center bg-background p-4"><div className="text-center text-muted-foreground">Redirecting to {destination}...</div></div>;
  }

  // If user is not logged in, or logged in but email not verified, show the form.
  const AuthMethodButton = ({ method, icon: Icon, label }: { method: AuthMethod, icon: React.ElementType, label:string }) => (
    <Button
      variant={activeMethod === method ? 'default' : 'outline'}
      onClick={() => setActiveMethod(method)}
      className={`flex-1 py-3 ${activeMethod === method ? 'bg-card text-foreground' : 'bg-background'}`}
      disabled={method !== 'email'} 
    >
      <Icon className="mr-2 h-5 w-5" />
      {label}
    </Button>
  );

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted p-4">
      <header className="w-full max-w-md rounded-t-lg bg-popover p-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-primary">BETBABU</h1>
          <div className="space-x-2">
            <Button variant="ghost" className="text-accent font-semibold px-3 py-2 rounded-md">
              Log in
            </Button>
            <Button variant="ghost" asChild className="px-3 py-2 rounded-md text-muted-foreground">
              <Link href="/signup">Registration</Link>
            </Button>
          </div>
        </div>
      </header>

      <Card className="w-full max-w-md shadow-xl rounded-t-none rounded-b-lg">
        <CardHeader className="bg-popover p-4">
          <CardTitle className="text-lg text-center text-foreground">LOG IN</CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div className="flex space-x-2">
            <AuthMethodButton method="email" icon={Mail} label="By email" />
            <AuthMethodButton method="phone" icon={Phone} label="By phone" />
            <AuthMethodButton method="sms" icon={MessageSquare} label="By SMS" />
            <AuthMethodButton method="social" icon={Users} label="Social networks" />
          </div>

          {activeMethod === 'email' && (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="emailOrPhone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-muted-foreground">E-mail or ID*</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="your@email.com" {...field} className="bg-background border-border focus:border-primary" />
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
                      <FormLabel className="text-muted-foreground">Password*</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="••••••••" {...field} className="bg-background border-border focus:border-primary" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="rememberMe"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          className="border-primary data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel className="text-muted-foreground">
                          Remember me
                        </FormLabel>
                      </div>
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full font-semibold bg-accent text-accent-foreground hover:bg-accent/90 py-3 text-base" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting ? 'LOGGING IN...' : 'LOG IN'}
                </Button>
              </form>
            </Form>
          )}
          {activeMethod !== 'email' && (
            <div className="text-center p-8 text-muted-foreground">
              <p>{activeMethod.charAt(0).toUpperCase() + activeMethod.slice(1)} login method is coming soon.</p>
            </div>
          )}
           {showVerificationMessage && (
            <div className="mt-4 p-4 border border-yellow-500 rounded-md bg-yellow-500/10 text-center">
              <p className="text-sm text-yellow-700 dark:text-yellow-300">
                Your email is not verified. Please check your inbox (and spam folder) for the verification link.
              </p>
              {currentUserForVerification && (
                <Button
                  variant="link"
                  className="mt-2 text-accent h-auto p-0"
                  onClick={handleResendVerificationEmail}
                  disabled={form.formState.isSubmitting}
                >
                  Resend Verification Email
                </Button>
              )}
            </div>
          )}

          <div className="text-center text-sm">
            <Button variant="link" className="p-0 text-accent h-auto" asChild>
              <Link href="#">Forgot your password?</Link>
            </Button>
          </div>
          <div className="text-center text-sm text-muted-foreground">
            Don&apos;t have an account?{' '}
            <Button variant="link" className="p-0 text-accent h-auto font-semibold" asChild>
              <Link href="/signup">Register</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
      <footer className="w-full max-w-md bg-popover p-4 text-center text-sm text-muted-foreground rounded-b-lg mt-0 border-t border-border">
        BETBABU Log in to your account
      </footer>
    </div>
  );
}

