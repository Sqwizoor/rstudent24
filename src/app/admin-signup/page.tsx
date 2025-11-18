"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { signUp, confirmSignUp, autoSignIn } from "aws-amplify/auth";
import Image from "next/image";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Lock, Mail, User, Check } from "lucide-react";
import { configureAdminAuth } from "../admin/adminAuth";

// Admin signup uses the same user pool but sets the admin role

export default function AdminSignup() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showVerification, setShowVerification] = useState(false);
  const router = useRouter();
  
  // Configure admin authentication on component mount and handle URL parameters
  useEffect(() => {
    configureAdminAuth();
    
    // Check for URL parameters that might indicate a verification redirect
    const params = new URLSearchParams(window.location.search);
    const emailParam = params.get('email');
    const needsVerification = params.get('needsVerification');
    
    if (emailParam && needsVerification === 'true') {
      setEmail(emailParam);
      setShowVerification(true);
      toast.info("Please enter the verification code sent to your email");
    }
  }, []);

  // Function to validate password against common Cognito requirements
  const validatePassword = (password: string) => {
    const errors = [];
    
    if (password.length < 8) {
      errors.push("Password must be at least 8 characters long");
    }
    
    if (!/[0-9]/.test(password)) {
      errors.push("Password must include at least one number");
    }
    
    if (!/[A-Z]/.test(password)) {
      errors.push("Password must include at least one uppercase letter");
    }
    
    if (!/[a-z]/.test(password)) {
      errors.push("Password must include at least one lowercase letter");
    }
    
    if (!/[^A-Za-z0-9]/.test(password)) {
      errors.push("Password must include at least one special character");
    }
    
    return errors;
  };
  
  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password || !confirmPassword || !name) {
      toast.error("Please fill in all fields");
      return;
    }
    
    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    
    // Validate password against Cognito requirements
    const passwordErrors = validatePassword(password);
    if (passwordErrors.length > 0) {
      // Show all password errors
      passwordErrors.forEach(error => toast.error(error));
      return;
    }
    
    setIsLoading(true);
    
    try {
      // We need to use a non-email format for username when the pool has email alias
      // Create a unique admin username with timestamp to ensure uniqueness
      const timestamp = Date.now();
      const uniqueUsername = `admin_${timestamp}`;
      
      // Sign up with AWS Cognito
      const signUpResult = await signUp({
        username: uniqueUsername,
        password,
        options: {
          userAttributes: {
            email,
            name,
            // Set admin role directly during signup - ensure it's properly formatted
            'custom:role': 'admin'
          },
          // Ensure autoSignIn is enabled for better user experience
          autoSignIn: true
        }
      });
      
      // Log the signup details to verify the admin role is set
      console.log("Admin signup details:", {
        username: uniqueUsername,
        email,
        role: 'admin',
        autoSignIn: true
      });
      
      console.log("Sign up result:", signUpResult);
      
      // Store the username for the verification step
      setUsername(uniqueUsername);
      
      // Check if signup is complete or needs confirmation
      if (signUpResult.isSignUpComplete) {
        // Signup is complete (rare case with auto sign-in)
        toast.success("Admin account created successfully");
        router.push("/admin");
      } else {
        // Most common case: need to confirm signup with verification code
        if (signUpResult.nextStep && signUpResult.nextStep.signUpStep === "CONFIRM_SIGN_UP") {
          setShowVerification(true);
          
          // Show more detailed message about verification
          const destination = signUpResult.nextStep.codeDeliveryDetails?.destination;
          if (destination) {
            toast.success(`Verification code sent to ${destination}. Please check your email.`);
          } else {
            toast.success("Please check your email for a verification code");
          }
        } else {
          // Fallback for any other case
          toast.info("Please complete the signup process");
          setShowVerification(true);
        }
      }
    } catch (error: any) {
      console.error("Admin signup error:", error);
      
      // Handle specific Cognito error types with user-friendly messages
      if (error.name === "UsernameExistsException") {
        toast.error("An account with this email already exists");
      } else if (error.name === "InvalidPasswordException") {
        // Extract specific requirements from the error message
        if (error.message) {
          toast.error(error.message);
        } else {
          toast.error("Password does not meet requirements");
        }
      } else if (error.name === "InvalidParameterException") {
        if (error.message.includes("email")) {
          toast.error("Please provide a valid email address");
        } else {
          toast.error(error.message);
        }
      } else if (error.name === "LimitExceededException") {
        toast.error("Too many attempts. Please try again later");
      } else {
        toast.error(error.message || "Failed to create account. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  // Store the username for verification
  const handleVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!verificationCode) {
      toast.error("Please enter the verification code");
      return;
    }
    
    if (!username) {
      toast.error("Session expired. Please try signing up again.");
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Confirm sign up with verification code
      const confirmResult = await confirmSignUp({
        username: username,
        confirmationCode: verificationCode
      });
      
      console.log("Confirm result:", confirmResult);
      
      if (confirmResult.isSignUpComplete) {
        // Try auto sign-in after confirmation
        try {
          const signInResult = await autoSignIn();
          if (signInResult.isSignedIn) {
            toast.success("Admin account verified and logged in successfully");
            
            // Set admin authentication flag
            localStorage.setItem('isAdminAuthenticated', 'true');
            
            // Use replace to avoid navigation history issues
            router.replace("/admin");
            return;
          }
        } catch (autoSignInError) {
          console.log("Auto sign-in failed, redirecting to login", autoSignInError);
        }
        
        // If auto sign-in fails, redirect to login
        toast.success("Account verified! Please log in");
        router.push("/admin-login");
      }
    } catch (error: any) {
      console.error("Verification error:", error);
      
      if (error.name === "CodeMismatchException") {
        toast.error("Invalid verification code");
      } else if (error.name === "ExpiredCodeException") {
        toast.error("Verification code has expired. Please request a new one");
      } else {
        toast.error(error.message || "Failed to verify account. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-900 dark:to-slate-800 p-4">
      <Card className="w-full max-w-md shadow-lg border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
        <CardHeader className="space-y-1 flex flex-col items-center">
          <div className="mb-4">
            <picture>
              <source srcSet="/student24-logo.avif" type="image/avif" />
              <source srcSet="/student24-logo.webp" type="image/webp" />
              <Image 
                src="/student24-logo-optimized.png" 
                alt="Student24 Logo" 
                width={120} 
                height={28} 
                priority
              />
            </picture>
          </div>
          <CardTitle className="text-2xl font-bold text-center">Admin Registration</CardTitle>
          <CardDescription className="text-center">
            Create a new administrator account
          </CardDescription>
        </CardHeader>
        
        {!showVerification ? (
          <form onSubmit={handleSignup}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <Input
                    id="name"
                    type="text"
                    placeholder="Full Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="Admin Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <div className="relative">
                  <Check className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Confirm Password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter className="mt-4">
              <Button 
                type="submit" 
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <div className="mr-2 h-4 w-4 bg-white/30 rounded animate-pulse"></div>
                    Creating Account...
                  </>
                ) : (
                  "Create Admin Account"
                )}
              </Button>
            </CardFooter>
          </form>
        ) : (
          <form onSubmit={handleVerification}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">
                  We&apos;ve sent a verification code to your email. Please enter it below.
                </p>
                <Input
                  id="verificationCode"
                  type="text"
                  placeholder="Verification Code"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  required
                />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-2">
              <Button 
                type="submit" 
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <div className="mr-2 h-4 w-4 bg-white/30 rounded animate-pulse"></div>
                    Verifying...
                  </>
                ) : (
                  "Verify Account"
                )}
              </Button>
              <Button 
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => router.push("/admin-login")}
              >
                Back to Login
              </Button>
            </CardFooter>
          </form>
        )}
        
        <div className="p-4 text-center text-sm text-slate-500 dark:text-slate-400">
          <p>Already have an admin account? <a href="/admin-login" className="text-blue-600 hover:underline">Login</a></p>
          <div className="mt-4 flex justify-center">
            <picture>
              <source srcSet="/student24-logo.avif" type="image/avif" />
              <source srcSet="/student24-logo.webp" type="image/webp" />
              <Image 
                src="/student24-logo-optimized.png" 
                alt="Student24 Logo" 
                width={120} 
                height={28} 
                className="opacity-70 dark:opacity-50"
                loading="lazy" 
              />
            </picture>
          </div>
        </div>
      </Card>
    </div>
  );
}
