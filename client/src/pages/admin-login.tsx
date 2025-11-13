import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, getQueryFn, queryClient } from "@/lib/queryClient";
import { Building2, Shield, Lock, CheckCircle } from "lucide-react";

export default function AdminLogin() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Check if already logged in as admin
  const { data: org } = useQuery({
    queryKey: ["/api/admin/me"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    retry: false,
  });

  useEffect(() => {
    if (org) {
      // Already logged in, redirect to admin dashboard
      setLocation("/admin/dashboard");
    }
  }, [org, setLocation]);

  const loginMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/admin/login", {
        email,
        password,
      });
      return await res.json();
    },
    onSuccess: (org) => {
      // Clear any user session data to prevent conflicts
      queryClient.setQueryData(["/api/auth/me"], null);
      queryClient.setQueryData(["/api/admin/me"], org);
      toast({
        title: "Welcome!",
        description: "You have successfully logged in to the admin portal.",
      });
      // Use setTimeout to ensure session is set before redirect
      setTimeout(() => {
        setLocation("/admin/dashboard");
      }, 100);
    },
    onError: (error: any) => {
      toast({
        title: "Login failed",
        description: error.message || "Invalid email or password. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast({
        title: "Error",
        description: "Please enter your email and password.",
        variant: "destructive",
      });
      return;
    }
    loginMutation.mutate();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 p-4">
      <div className="w-full max-w-md">
        {/* Header Banner */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-900 dark:to-indigo-900 text-white rounded-t-xl p-6 shadow-lg">
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mb-4">
              <Shield className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-bold text-center">Organization Portal</h1>
            <p className="text-blue-100 text-center mt-2 text-sm">
              Credential Verification System
            </p>
          </div>
        </div>

        <Card className="border-t-0 rounded-t-none shadow-xl">
          <div className="p-8">

            <div className="mb-6 space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCircle className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span>Secure verification system</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCircle className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span>Distributed credential validation</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCircle className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span>Organization access only</span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-base font-semibold">Organization Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@organization.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loginMutation.isPending}
                  className="border-2 focus:border-blue-500"
                  data-testid="input-admin-email"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-base font-semibold">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loginMutation.isPending}
                  className="border-2 focus:border-blue-500"
                  data-testid="input-admin-password"
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white h-11 text-base font-semibold"
                disabled={loginMutation.isPending}
                data-testid="button-admin-login"
              >
                <Lock className="w-4 h-4 mr-2" />
                {loginMutation.isPending ? "Logging in..." : "Access Verification Portal"}
              </Button>
            </form>

            <div className="mt-6 space-y-3 text-center">
              <p className="text-sm text-muted-foreground">
                Need to verify credentials?{" "}
                <button
                  type="button"
                  className="text-blue-600 dark:text-blue-400 hover:underline font-medium p-0"
                  onClick={() => setLocation("/verify")}
                  data-testid="link-public-verify"
                >
                  Public Verification
                </button>
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

