
'use client';

import Link from 'next/link';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Mail, User as UserIcon, Lock, Globe, Phone, MessageSquare, Users as SocialUsersIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { auth, createUserWithEmailAndPassword, sendEmailVerification } from '@/lib/firebase';
import { useState, useEffect } from 'react';

const currencies = [
  { value: 'USD', label: 'USD - United States Dollar' },
  { value: 'EUR', label: 'EUR - Euro' },
  { value: 'GBP', label: 'GBP - British Pound Sterling' },
  { value: 'INR', label: 'INR - Indian Rupee' },
  { value: 'BDT', label: 'BDT - Bangladeshi Taka' },
];

const signupSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters' }),
  emailOrPhone: z.string().email({ message: 'Please enter a valid email address' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
  confirmPassword: z.string().min(6, { message: 'Please confirm your password' }),
  currency: z.string().min(1, { message: 'Please select a currency' }),
  country: z.string().min(2, { message: 'Country is required' }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

type SignupFormValues = z.infer<typeof signupSchema>;
type AuthMethod = 'email' | 'phone' | 'sms' | 'social';

export default function SignupPage() {
  const { login: loginToAppContext, user: appUser, loadingAuth } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [activeMethod, setActiveMethod] = useState<AuthMethod>('email');

  const form = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      name: '',
      emailOrPhone: '',
      password: '',
      confirmPassword: '',
      currency: '',
      country: '',
    },
  });
  
  useEffect(() => {
    if (!loadingAuth && appUser && appUser.emailVerified) {
      router.push('/');
    }
  }, [appUser, loadingAuth, router]);

  async function onSubmit(data: SignupFormValues) {
    form.clearErrors();
    form.setValue('emailOrPhone', data.emailOrPhone.trim());

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, data.emailOrPhone, data.password);
      const firebaseUser = userCredential.user;
      await sendEmailVerification(firebaseUser);
      
      toast({ 
        title: "Signup Successful!", 
        description: "A verification email has been sent. Please check your inbox to verify your account before logging in.",
        duration: 10000,
      });

      const newUserPayloadForAppContext = {
        id: firebaseUser.uid,
        name: data.name,
        email: firebaseUser.email,
        currency: data.currency,
        country: data.country,
        emailVerified: firebaseUser.emailVerified, // false at this point
      };
      
      await loginToAppContext(newUserPayloadForAppContext, true);
      router.push('/login'); 

    } catch (error: any) {
      console.error("Signup error on page:", error);
      let errorMessage = "Could not create your account. Please try again.";
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = "This email address is already in use. Please try another one or login.";
        form.setError("emailOrPhone", { type: "manual", message: errorMessage });
      } else if (error.code === 'auth/weak-password') {
        errorMessage = "The password is too weak. Please choose a stronger password.";
        form.setError("password", { type: "manual", message: errorMessage });
      } else if (error.message) {
        errorMessage = error.message;
      }
      toast({ title: "Signup Failed", description: errorMessage, variant: "destructive" });
    }
  }

  if (loadingAuth) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <div className="text-center text-muted-foreground">Loading session...</div>
      </div>
    );
  }

  if (appUser && appUser.emailVerified) {
     return <div className="flex min-h-screen items-center justify-center bg-background p-4"><div className="text-center text-muted-foreground">Redirecting...</div></div>;
  }

  const AuthMethodButton = ({ method, icon: Icon, label }: { method: AuthMethod, icon: React.ElementType, label: string }) => (
    <Button
      variant={activeMethod === method ? 'default' : 'outline'}
      onClick={() => setActiveMethod(method)}
      className={`flex-1 py-3 ${activeMethod === method ? 'bg-card text-foreground' : 'bg-background'}`}
      disabled={method !== 'email'} // Only email is active
    >
      <Icon className="mr-2 h-5 w-5" />
      {label}
    </Button>
  );

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted p-4">
      <header className="w-full max-w-lg rounded-t-lg bg-popover p-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-primary">BETBABU</h1>
          <div className="space-x-2">
            <Button variant="ghost" asChild className="px-3 py-2 rounded-md text-muted-foreground">
                <Link href="/login">Log in</Link>
            </Button>
            <Button variant="ghost" className="text-accent font-semibold px-3 py-2 rounded-md">
              Registration
            </Button>
          </div>
        </div>
      </header>

      <Card className="w-full max-w-lg shadow-xl rounded-t-none rounded-b-lg">
        <CardHeader className="bg-popover p-4">
          <CardTitle className="text-lg text-center text-foreground">REGISTRATION</CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <div className="flex space-x-2">
            <AuthMethodButton method="email" icon={Mail} label="By email" />
            <AuthMethodButton method="phone" icon={Phone} label="By phone" />
            {/* <AuthMethodButton method="sms" icon={MessageSquare} label="By SMS" />
            <AuthMethodButton method="social" icon={SocialUsersIcon} label="Social networks" /> */}
          </div>

          {activeMethod === 'email' && (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-muted-foreground">Full Name*</FormLabel>
                      <FormControl>
                        <Input placeholder="John Doe" {...field} className="bg-background border-border focus:border-primary" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="emailOrPhone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-muted-foreground">Email*</FormLabel>
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
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-muted-foreground">Confirm Password*</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="••••••••" {...field} className="bg-background border-border focus:border-primary" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="country"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-muted-foreground">Country*</FormLabel>
                      <FormControl>
                        <Input placeholder="Your Country" {...field} className="bg-background border-border focus:border-primary" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="currency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-muted-foreground">Preferred Currency*</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-background border-border focus:border-primary text-foreground">
                            <SelectValue placeholder="Select your currency" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {currencies.map((currency) => (
                            <SelectItem key={currency.value} value={currency.value}>
                              {currency.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full font-semibold bg-accent text-accent-foreground hover:bg-accent/90 py-3 text-base" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting ? 'CREATING ACCOUNT...' : 'REGISTER'}
                </Button>
              </form>
            </Form>
          )}
          {activeMethod !== 'email' && (
            <div className="text-center p-8 text-muted-foreground">
              <p>{activeMethod.charAt(0).toUpperCase() + activeMethod.slice(1)} registration method is coming soon.</p>
            </div>
          )}
          <div className="mt-4 text-center text-sm text-muted-foreground">
            Already have an account?{' '}
            <Button variant="link" className="p-0 text-accent h-auto font-semibold" asChild>
              <Link href="/login">Login</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
      <footer className="w-full max-w-lg bg-popover p-4 text-center text-sm text-muted-foreground rounded-b-lg mt-0 border-t border-border">
        BETBABU Create your account
      </footer>
    </div>
  );
}
