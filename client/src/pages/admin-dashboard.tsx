import { useState } from "react";
import { useLocation } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, getQueryFn, queryClient } from "@/lib/queryClient";
import { CheckCircle2, XCircle, Search, LogOut, FileText, Shield, AlertCircle, Clock, UserCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

export default function AdminDashboard() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [verificationInput, setVerificationInput] = useState("");
  const [verificationResult, setVerificationResult] = useState<any>(null);

  const { data: org, isLoading: orgLoading, refetch: refetchOrg } = useQuery({
    queryKey: ["/api/admin/me"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    retry: false,
    refetchOnMount: true,
  });

  const verifyMutation = useMutation({
    mutationFn: async (data: string) => {
      try {
        const res = await apiRequest("POST", "/api/admin/verify", { credentialData: data });
        const json = await res.json();
        return {
          ...json,
          isValid: json.isValid === true || json.isValid === "true",
        };
      } catch (error: any) {
        // Re-throw with more context
        const errorMessage = error.message || "Failed to verify credential";
        if (errorMessage.includes("401")) {
          throw new Error("Session expired. Please login again to the admin portal.");
        }
        throw error;
      }
    },
    onSuccess: (result) => {
      setVerificationResult(result);
      toast({
        title: result.isValid ? "Verification Successful" : "Verification Failed",
        description: result.isValid
          ? "The credential has been verified successfully."
          : "The credential could not be verified.",
        variant: result.isValid ? "default" : "destructive",
      });
    },
    onError: async (error: any) => {
      let errorMessage = "Failed to verify credential. Please try again.";
      
      // Try to extract error message from response
      if (error.message) {
        errorMessage = error.message;
      } else if (error.response) {
        try {
          const errorData = await error.response.json();
          errorMessage = errorData.message || errorData.details || errorMessage;
        } catch {
          errorMessage = error.response.statusText || errorMessage;
        }
      }
      
      // If it's a 401, suggest re-login
      if (errorMessage.includes("401") || errorMessage.includes("authentication")) {
        errorMessage = "Session expired. Please login again.";
        setTimeout(() => {
          setLocation("/admin/login");
        }, 2000);
      }
      
      toast({
        title: "Verification Error",
        description: errorMessage,
        variant: "destructive",
      });
      setVerificationResult(null);
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", "/api/admin/logout");
    },
    onSuccess: () => {
      queryClient.setQueryData(["/api/admin/me"], null);
      toast({
        title: "Logged out",
        description: "You have been logged out successfully.",
      });
      setLocation("/admin/login");
    },
  });

  const handleVerify = () => {
    if (!verificationInput.trim()) {
      toast({
        title: "Error",
        description: "Please enter a share link, token, or credential JSON.",
        variant: "destructive",
      });
      return;
    }
    verifyMutation.mutate(verificationInput.trim());
  };

  if (orgLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!org) {
    setLocation("/admin/login");
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      {/* Admin Header Bar */}
      <div className="border-b bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-900 dark:to-indigo-900 text-white shadow-lg">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/20 backdrop-blur-sm">
                <Shield className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-lg font-bold">Organization Verification Portal</h1>
                <p className="text-xs text-blue-100">{org.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                <UserCheck className="w-3 h-3 mr-1" />
                {org.role}
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => logoutMutation.mutate()}
                disabled={logoutMutation.isPending}
                className="text-white hover:bg-white/20"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid gap-6 lg:grid-cols-[1fr_350px]">
          {/* Main Verification Area */}
          <Card className="border-2 border-blue-200 dark:border-blue-800 shadow-xl bg-white dark:bg-slate-900">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-800 dark:to-indigo-800 text-white p-6 rounded-t-lg">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/20 backdrop-blur-sm">
                  <Search className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">Credential Verification</h2>
                  <p className="text-sm text-blue-100">
                    Verify credentials using share links, tokens, or JSON data
                  </p>
                </div>
              </div>
            </div>
            <div className="p-6">

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="verification-input" className="text-base font-semibold">Credential Data</Label>
                  <div className="flex gap-2">
                    <Input
                      id="verification-input"
                      placeholder="Paste share link, token, or JSON data here..."
                      value={verificationInput}
                      onChange={(e) => setVerificationInput(e.target.value)}
                      disabled={verifyMutation.isPending}
                      className="flex-1 border-2 focus:border-blue-500"
                    />
                    <Button
                      onClick={handleVerify}
                      disabled={verifyMutation.isPending || !verificationInput.trim()}
                      className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6"
                    >
                      <Search className="w-4 h-4 mr-2" />
                      {verifyMutation.isPending ? "Verifying..." : "Verify"}
                    </Button>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <AlertCircle className="w-3 h-3" />
                    <span>Accepted formats: Share link (e.g., /verify/abc123), Share token, or Raw JSON</span>
                  </div>
                </div>

              {verificationResult && (
                <div className="mt-6 space-y-4">
                  <Separator className="my-6" />
                  <div className={`flex items-center gap-3 p-4 rounded-lg border-2 ${
                    verificationResult.isValid 
                      ? "bg-green-50 dark:bg-green-950/30 border-green-500 dark:border-green-800" 
                      : "bg-red-50 dark:bg-red-950/30 border-red-500 dark:border-red-800"
                  }`}>
                    {verificationResult.isValid ? (
                      <>
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-500 text-white">
                          <CheckCircle2 className="w-6 h-6" />
                        </div>
                        <div>
                          <span className="font-bold text-lg text-green-700 dark:text-green-400">Verification Successful</span>
                          <p className="text-sm text-green-600 dark:text-green-500">Credential is valid and authentic</p>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-500 text-white">
                          <XCircle className="w-6 h-6" />
                        </div>
                        <div>
                          <span className="font-bold text-lg text-red-700 dark:text-red-400">Verification Failed</span>
                          <p className="text-sm text-red-600 dark:text-red-500">Credential could not be verified</p>
                        </div>
                      </>
                    )}
                  </div>

                  {verificationResult.credential && (
                    <div className="space-y-4 rounded-lg border-2 border-blue-200 dark:border-blue-800 bg-gradient-to-br from-blue-50/50 to-indigo-50/50 dark:from-blue-950/30 dark:to-indigo-950/30 p-6 shadow-md">
                      <div>
                        <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-blue-900 dark:text-blue-100">
                          <FileText className="w-5 h-5" />
                          Credential Details
                        </h3>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Title:</span>
                            <span className="font-medium">{verificationResult.credential.title}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Type:</span>
                            <span className="font-medium">{verificationResult.credential.type}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Issuer:</span>
                            <span className="font-medium">{verificationResult.credential.issuer}</span>
                          </div>
                          {verificationResult.credential.issuedAt && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Issued:</span>
                              <span className="font-medium">
                                {new Date(verificationResult.credential.issuedAt).toLocaleDateString()}
                              </span>
                            </div>
                          )}
                          {verificationResult.credential.expiresAt && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Expires:</span>
                              <span className="font-medium">
                                {new Date(verificationResult.credential.expiresAt).toLocaleDateString()}
                              </span>
                            </div>
                          )}
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Status:</span>
                            <Badge variant={verificationResult.credential.status === "verified" ? "default" : "secondary"}>
                              {verificationResult.credential.status}
                            </Badge>
                          </div>
                        </div>
                      </div>

                      {verificationResult.details && (
                        <div className="mt-4 pt-4 border-t">
                          <h4 className="font-semibold mb-2 text-sm">Verification Details</h4>
                          <div className="space-y-1 text-xs">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Signature:</span>
                              <span>{verificationResult.details.signatureValid ? "✓ Valid" : "✗ Invalid"}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Not Expired:</span>
                              <span>{verificationResult.details.notExpired ? "✓ Valid" : "✗ Expired"}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Issuer Trusted:</span>
                              <span>{verificationResult.details.issuerTrusted ? "✓ Trusted" : "✗ Not Trusted"}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Proof Verified:</span>
                              <span>{verificationResult.details.proofVerified ? "✓ Valid" : "✗ Invalid"}</span>
                            </div>
                          </div>
                        </div>
                      )}

                      {verificationResult.credential.credentialSubject && (
                        <div className="mt-4 pt-4 border-t">
                          <h4 className="font-bold mb-3 text-base flex items-center gap-2 text-blue-900 dark:text-blue-100">
                            <FileText className="w-4 h-4" />
                            Document Data (Credential Subject)
                          </h4>
                          <div className="bg-white dark:bg-slate-800 p-4 rounded-lg border-2 border-blue-200 dark:border-blue-800">
                            <div className="space-y-3">
                              {Object.entries(verificationResult.credential.credentialSubject).map(([key, value]) => (
                                <div key={key} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 pb-2 border-b last:border-0">
                                  <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wide">
                                    {key.replace(/([A-Z])/g, ' $1').trim()}:
                                  </span>
                                  <span className="text-sm font-medium text-foreground break-words text-right sm:text-left">
                                    {typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                          <div className="mt-3">
                            <h5 className="text-xs font-semibold text-muted-foreground mb-2">Raw JSON:</h5>
                            <pre className="text-xs bg-slate-50 dark:bg-slate-900 p-3 rounded border overflow-auto max-h-48 font-mono">
                              {JSON.stringify(verificationResult.credential.credentialSubject, null, 2)}
                            </pre>
                          </div>
                        </div>
                      )}

                      {(verificationResult.credential.imageUrl || verificationResult.credential.documentUrl) && (
                        <div className="mt-4 pt-4 border-t">
                          <h4 className="font-bold mb-3 text-base flex items-center gap-2 text-blue-900 dark:text-blue-100">
                            <FileText className="w-4 h-4" />
                            Document Links
                          </h4>
                          <div className="space-y-2">
                            {verificationResult.credential.imageUrl && (
                              <div className="p-3 bg-white dark:bg-slate-800 rounded-lg border">
                                <p className="text-xs font-semibold text-muted-foreground mb-1">Credential Image:</p>
                                <a 
                                  href={verificationResult.credential.imageUrl} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-sm text-blue-600 dark:text-blue-400 hover:underline break-all"
                                >
                                  {verificationResult.credential.imageUrl}
                                </a>
                              </div>
                            )}
                            {verificationResult.credential.documentUrl && (
                              <div className="p-3 bg-white dark:bg-slate-800 rounded-lg border">
                                <p className="text-xs font-semibold text-muted-foreground mb-1">Supporting Document:</p>
                                <a 
                                  href={verificationResult.credential.documentUrl} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-sm text-blue-600 dark:text-blue-400 hover:underline break-all"
                                >
                                  {verificationResult.credential.documentUrl}
                                </a>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
              </div>
            </div>
          </Card>

          {/* Sidebar Info */}
          <div className="space-y-4">
            <Card className="border-2 border-indigo-200 dark:border-indigo-800 bg-gradient-to-br from-indigo-50 to-purple-50/50 dark:from-indigo-950/30 dark:to-purple-950/30 shadow-lg">
              <div className="bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-800 dark:to-purple-800 text-white p-4 rounded-t-lg">
                <h3 className="font-bold flex items-center gap-2 text-sm">
                  <Clock className="w-4 h-4" />
                  How to Verify
                </h3>
              </div>
              <div className="p-4 space-y-3 text-xs">
                <div>
                  <p className="font-semibold text-foreground mb-1">1. Share Link</p>
                  <p className="text-muted-foreground">Paste full URL: /verify/abc-123</p>
                </div>
                <div>
                  <p className="font-semibold text-foreground mb-1">2. Share Token</p>
                  <p className="text-muted-foreground">Enter just the token</p>
                </div>
                <div>
                  <p className="font-semibold text-foreground mb-1">3. Raw JSON</p>
                  <p className="text-muted-foreground">Paste complete credential JSON</p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

