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
import Image from 'next/image';

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
  country: z.string().min(1, { message: 'Please select a country' }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

type SignupFormValues = z.infer<typeof signupSchema>;
type AuthMethod = 'email' | 'phone' | 'sms' | 'social';

// --- New interfaces for country data ---
interface Country {
    id: number;
    name: string;
}

interface Continent {
    id: number;
    name: string;
    countries: {
        data: Country[];
    }
}


export default function SignupPage() {
  const { login: loginToAppContext, user: appUser, loadingAuth } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [activeMethod, setActiveMethod] = useState<AuthMethod>('email');

  // --- New state for countries ---
  const [countries, setCountries] = useState<Country[]>([]);
  const [loadingCountries, setLoadingCountries] = useState(true);

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
  
  // --- New useEffect to fetch countries ---
  useEffect(() => {
    async function fetchCountries() {
        setLoadingCountries(true);
        try {
            const response = await fetch('/api/core/continents');
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to fetch countries');
            }
            const data: { data: Continent[] } = await response.json();
            const allCountries = data.data.flatMap(continent => continent.countries.data);
            const sortedCountries = allCountries.sort((a, b) => a.name.localeCompare(b.name));
            setCountries(sortedCountries);
        } catch (error: any) {
            console.error("Error fetching countries:", error);
            toast({
                title: "Could not load countries",
                description: "There was an error fetching the list of countries. Please try again later.",
                variant: "destructive"
            });
        } finally {
            setLoadingCountries(false);
        }
    }

    fetchCountries();
  }, [toast]);


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
      
      const customUserId = Math.floor(100000000 + Math.random() * 900000000);

      toast({ 
        title: "Signup Successful!", 
        description: `Your new User ID is ${customUserId}. A verification email has been sent. Please verify your account before logging in.`,
        duration: 10000,
      });

      const newUserPayloadForAppContext = {
        id: firebaseUser.uid,
        name: data.name,
        email: firebaseUser.email,
        currency: data.currency,
        country: data.country,
        emailVerified: firebaseUser.emailVerified, // false at this point
        customUserId: customUserId,
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

  if (loadingAuth || (appUser && appUser.emailVerified)) {
    return null; 
  }

  const AuthMethodButton = ({ method, icon: Icon, label }: { method: AuthMethod, icon: React.ElementType, label: string }) => (
    <Button
      type="button"
      variant={activeMethod === method ? 'default' : 'outline'}
      onClick={() => setActiveMethod(method)}
      className={`flex-1 py-3 ${activeMethod === method ? 'bg-primary/80 text-white' : 'bg-white/10 border-white/20 text-white hover:bg-white/20'}`}
      disabled={method !== 'email'}
    >
      <Icon className="mr-2 h-5 w-5" />
      {label}
    </Button>
  );

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center p-4">
       <Image
        src="/__media__/942c75a0-0b61-4177-8c76-5a415a770020.png"
        alt="Signup background with sports figures"
        layout="fill"
        objectFit="cover"
        className="z-0"
        data-ai-hint="sports collage"
      />
      <div className="absolute inset-0 bg-gradient-to-br from-blue-900/70 via-black/60 to-purple-900/70 z-10" />

      <div className="relative z-20 w-full max-w-lg">
        <Card className="bg-card/10 backdrop-blur-lg border-white/20 text-white shadow-2xl rounded-lg">
          <CardHeader className="p-4">
             <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold text-white">BETBABU</h1>
              <div className="space-x-2">
                <Button variant="ghost" asChild className="px-3 py-2 rounded-md text-white/70 hover:text-white hover:bg-white/10">
                    <Link href="/login">Log in</Link>
                </Button>
                <Button variant="ghost" className="text-white font-semibold px-3 py-2 rounded-md bg-white/20">
                  Registration
                </Button>
              </div>
            </div>
            <CardTitle className="text-lg text-center text-white/90 pt-4">REGISTRATION</CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="flex space-x-2">
              <AuthMethodButton method="email" icon={Mail} label="By email" />
              <AuthMethodButton method="phone" icon={Phone} label="By phone" />
            </div>

            {activeMethod === 'email' && (
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white/80">Full Name*</FormLabel>
                        <FormControl>
                          <Input placeholder="John Doe" {...field} className="bg-white/5 border-white/20 focus:border-primary text-white placeholder:text-slate-300" />
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
                        <FormLabel className="text-white/80">Email*</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="your@email.com" {...field} className="bg-white/5 border-white/20 focus:border-primary text-white placeholder:text-slate-300" />
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
                        <FormLabel className="text-white/80">Password*</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="••••••••" {...field} className="bg-white/5 border-white/20 focus:border-primary text-white placeholder:text-slate-300" />
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
                        <FormLabel className="text-white/80">Confirm Password*</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="••••••••" {...field} className="bg-white/5 border-white/20 focus:border-primary text-white placeholder:text-slate-300" />
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
                        <FormLabel className="text-white/80">Country*</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value} disabled={loadingCountries}>
                          <FormControl>
                            <SelectTrigger className="bg-white/5 border-white/20 focus:border-primary text-white">
                              <SelectValue placeholder={loadingCountries ? "Loading countries..." : "Select your country"} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {countries.length > 0 ? (
                                countries.map((country) => (
                                    <SelectItem key={country.id} value={country.name}>
                                        {country.name}
                                    </SelectItem>
                                ))
                            ) : (
                                !loadingCountries && <SelectItem value="none" disabled>No countries found</SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="currency"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white/80">Preferred Currency*</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="bg-white/5 border-white/20 focus:border-primary text-white">
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
                  <Button type="submit" className="w-full font-semibold bg-primary/80 hover:bg-primary py-3 text-base" disabled={form.formState.isSubmitting}>
                    {form.formState.isSubmitting ? 'CREATING ACCOUNT...' : 'REGISTER'}
                  </Button>
                </form>
              </Form>
            )}
            {activeMethod !== 'email' && (
              <div className="text-center p-8 text-white/70">
                <p>{activeMethod.charAt(0).toUpperCase() + activeMethod.slice(1)} registration method is coming soon.</p>
              </div>
            )}
            <div className="mt-4 text-center text-sm text-white/80">
              Already have an account?{' '}
              <Button variant="link" className="p-0 text-primary h-auto font-semibold" asChild>
                <Link href="/login">Login</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
