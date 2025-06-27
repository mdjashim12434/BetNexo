
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
import { auth, signInWithEmailAndPassword, sendEmailVerification, findUserByCustomId, type FirebaseUserType } from '@/lib/firebase';
import { useEffect, useState } from 'react';

// Loader components
const SoccerBallIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    className="h-7 w-7 animate-spin text-primary"
  >
    <path
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.5"
      d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10Z"
    />
    <path
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.5"
      d="M12 8.333V3.5m0 17v-4.833m-7.275-2.408L2.73 12m18.54 0-4.425-.009M7.05 7.05l-3.4 3.4M16.95 16.95l3.4-3.4m-13.3.05 3.4 3.4M13.55 7.05l3.4-3.4"
      opacity=".4"
    />
    <path
      fill="currentColor"
      d="m12.383 12.755-2.288-1.442.87-2.602 2.706.492.001.002 1.41 2.262-2.7 1.29Zm-3.15-.316-.002-.002-2.707-.49-1.428 2.296 2.28 1.45.002.002 2.724-1.258-.87-1.998ZM12 14.4l-2.723 1.258.006 3.003L12 20l2.717-1.34-.006-3.002L12 14.4Z"
    />
  </svg>
);

const PageLoader = () => (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4 text-primary">
       <div className="flex flex-col items-center justify-center gap-8">
            <h1 className="text-6xl font-black italic" style={{fontFamily: "'Poppins', sans-serif"}}>
                <span className="text-foreground">BET</span><span className="text-primary">BABU</span>
            </h1>
            <div className="flex items-center gap-4">
                <SoccerBallIcon />
                <div className="flex items-center gap-2.5">
                    {[...Array(6)].map((_, i) => (
                        <span key={i} className="h-3 w-3 rounded-full bg-muted animate-loader-dot" style={{ animationDelay: `${i * 0.1}s` }}></span>
                    ))}
                </div>
            </div>
        </div>
    </div>
);

const loginSchema = z.object({
  emailOrUserId: z.string().min(1, { message: 'Email or User ID is required.' }),
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
      emailOrUserId: '',
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
        router.push('/');
      }
    }
  }, [appUser, loadingAuth, router]);

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
          toast({ title: "Login Failed", description: "User ID not found. Please check the ID or try logging in with your email.", variant: "destructive", duration: 7000 });
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
      
      const userPayloadForAppContext = {
        id: fbUser.uid,
        email: fbUser.email,
        emailVerified: fbUser.emailVerified,
      };
      
      // Update the auth context. The useEffect will handle the redirect.
      await loginToAppContext(userPayloadForAppContext, false);
      
      toast({ title: "Login Successful", description: "Welcome back! Redirecting..." });

    } catch (error: any) {
      console.error("Login failed on page:", error);
      let errorMessage = "Could not log in. Please check credentials or try again.";
      
      if (error.code === 'permission-denied' || error.code === 'PERMISSION_DENIED') {
        errorMessage = "You do not have permission to access your user data. This is a Firestore Security Rule issue. Please ensure the rules allow an authenticated user to read their own document in the 'users' collection.";
      } else if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        errorMessage = "Invalid credentials. Please try again.";
        form.setError("emailOrUserId", { type: "manual", message: " " });
        form.setError("password", { type: "manual", message: "Invalid email/User ID or password." });
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = "Too many login attempts. Please try again later.";
      } else if (error.message && error.message.toLowerCase().includes('firestore')) {
         errorMessage = "There was a problem accessing user data. It's possible a database index is required. Please check the browser console for a Firebase link to create it.";
      } else if (error.message) { 
        errorMessage = error.message;
      }
      
      toast({ title: "Login Failed", description: errorMessage, variant: "destructive", duration: 10000 });
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
    return <PageLoader />;
  }
  
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
                  name="emailOrUserId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-muted-foreground">Email or User ID*</FormLabel>
                      <FormControl>
                        <Input type="text" placeholder="your@email.com or 123456789" {...field} className="bg-background border-border focus:border-primary" />
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
