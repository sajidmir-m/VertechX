import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Upload, CheckCircle, XCircle, Shield, AlertTriangle } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";

interface VerificationResult {
  isValid: boolean;
  credential?: any;
  details: {
    signatureValid: boolean;
    notExpired: boolean;
    issuerTrusted: boolean;
    proofVerified: boolean;
  };
  timestamp: string;
}

export default function Verify() {
  const { toast } = useToast();
  const [credentialData, setCredentialData] = useState("");
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null);

  const verifyMutation = useMutation({
    mutationFn: async (data: string) => {
      const res = await apiRequest("POST", "/api/verify", { credentialData: data });
      const json = await res.json();
      // Normalize isValid to boolean
      return {
        ...json,
        isValid: json.isValid === true || json.isValid === "true",
      };
    },
    onSuccess: (result: VerificationResult) => {
      setVerificationResult(result);
      toast({
        title: result.isValid ? "Verification Successful" : "Verification Failed",
        description:
          result.isValid
            ? "The credential is valid and verified."
            : "The credential could not be verified.",
        variant: result.isValid ? "default" : "destructive",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to verify credential. Please check the format and try again.",
        variant: "destructive",
      });
    },
  });

  const handleVerify = () => {
    const trimmed = credentialData.trim();
    if (!trimmed) {
      toast({
        title: "Error",
        description: "Please paste credential data to verify.",
        variant: "destructive",
      });
      return;
    }
    setVerificationResult(null);
    verifyMutation.mutate(trimmed);
  };

  const handleReset = () => {
    setCredentialData("");
    setVerificationResult(null);
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Credential Verification</h1>
        <p className="text-muted-foreground">
          Verify the authenticity of verifiable credentials using cryptographic proofs
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Input Section */}
        <div className="space-y-4">
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Upload className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">Credential Data</h3>
                <p className="text-xs text-muted-foreground">Paste JSON or credential string</p>
              </div>
            </div>

            <div className="mb-4 rounded-lg border bg-muted/40 p-4 text-xs text-muted-foreground space-y-1">
              <p className="text-sm font-semibold text-foreground">Accepted formats</p>
              <ul className="list-disc pl-4 space-y-1">
                <li>Public share link (e.g. <span className="font-mono">https://your-app/verify/abcd-1234</span>)</li>
                <li>Share token alone (UUID such as <span className="font-mono">abcd-1234-ef56</span>)</li>
                <li>Raw credential JSON copied from the credential detail modal</li>
              </ul>
            </div>

            <Textarea
              placeholder="Paste share link, token, or raw credential JSON..."
              value={credentialData}
              onChange={(e) => setCredentialData(e.target.value)}
              className="font-mono text-xs min-h-[300px]"
              data-testid="input-credential-data"
            />

            <div className="flex gap-3 mt-4">
              <Button
                onClick={handleVerify}
                disabled={verifyMutation.isPending || !credentialData.trim()}
                className="flex-1"
                data-testid="button-verify"
              >
                {verifyMutation.isPending ? (
                  <>Verifying...</>
                ) : (
                  <>
                    <Shield className="mr-2 h-4 w-4" />
                    Verify Credential
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={handleReset}
                data-testid="button-reset"
              >
                Reset
              </Button>
            </div>
          </Card>

          {/* Verification Progress */}
          {verifyMutation.isPending && (
            <Card className="p-6">
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Verifying signature...</span>
                  <Progress value={33} className="w-24" />
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Checking expiration...</span>
                  <Progress value={66} className="w-24" />
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Validating proof...</span>
                  <Progress value={100} className="w-24" />
                </div>
              </div>
            </Card>
          )}
        </div>

        {/* Results Section */}
        <div className="space-y-4">
          {verificationResult ? (
            <>
              <Card className="p-6">
                <div className="flex items-center gap-3 mb-6">
                  {verificationResult.isValid ? (
                    <>
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-status-online/10">
                        <CheckCircle className="h-6 w-6 text-status-online" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">Verification Successful</h3>
                        <p className="text-sm text-muted-foreground">
                          Credential is valid and verified
                        </p>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
                        <XCircle className="h-6 w-6 text-destructive" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">Verification Failed</h3>
                        <p className="text-sm text-muted-foreground">
                          Credential could not be verified
                        </p>
                      </div>
                    </>
                  )}
                </div>

                <div className="space-y-3">
                {(verificationResult.details
                  ? [
                      { label: "Signature Valid", value: verificationResult.details.signatureValid },
                      { label: "Not Expired", value: verificationResult.details.notExpired },
                      { label: "Issuer Trusted", value: verificationResult.details.issuerTrusted },
                      { label: "Proof Verified", value: verificationResult.details.proofVerified },
                    ]
                  : []
                ).map((check) => (
                    <div
                      key={check.label}
                      className="flex items-center justify-between py-2 border-b last:border-0"
                      data-testid={`check-${check.label.toLowerCase().replace(/\s+/g, '-')}`}
                    >
                      <span className="text-sm font-medium">{check.label}</span>
                      {check.value ? (
                        <CheckCircle className="h-5 w-5 text-status-online" />
                      ) : (
                        <XCircle className="h-5 w-5 text-destructive" />
                      )}
                    </div>
                  ))}
                </div>
              </Card>

              {verificationResult.credential && (
                <Card className="p-6">
                  <h3 className="font-semibold mb-4">Credential Details</h3>
                  <div className="space-y-3 text-sm">
                    <div>
                      <p className="text-muted-foreground mb-1">Type</p>
                      <Badge variant="outline" data-testid="badge-credential-type">
                        {verificationResult.credential.type}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-muted-foreground mb-1">Issuer</p>
                      <p className="font-medium" data-testid="text-issuer">
                        {verificationResult.credential.issuer}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground mb-1">Verified At</p>
                      <p className="font-mono text-xs" data-testid="text-verified-time">
                        {new Date(verificationResult.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </Card>
              )}

              <Card className="p-4 border-primary/50 bg-primary/5">
                <div className="flex gap-3">
                  <Shield className="h-5 w-5 text-primary mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-primary mb-1">Cryptographic Verification</p>
                    <p className="text-muted-foreground">
                      This credential has been verified using blockchain-anchored cryptographic proofs.
                    </p>
                  </div>
                </div>
              </Card>
            </>
          ) : (
            <Card className="p-16 text-center h-full flex flex-col items-center justify-center">
              <Shield className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="font-semibold mb-2">No Verification Yet</h3>
              <p className="text-sm text-muted-foreground max-w-sm">
                Paste credential data on the left and click verify to check its authenticity.
              </p>
            </Card>
          )}
        </div>
      </div>

      {/* Info Section */}
      <Card className="p-6 bg-muted/30">
        <div className="flex gap-3">
          <AlertTriangle className="h-5 w-5 text-primary mt-0.5" />
          <div className="text-sm">
            <p className="font-medium mb-1">How Verification Works</p>
            <ul className="text-muted-foreground space-y-1 list-disc list-inside">
              <li>Cryptographic signature validation using public key cryptography</li>
              <li>Timestamp verification to ensure credential hasn't expired</li>
              <li>Issuer trust verification against blockchain registry</li>
              <li>Zero-knowledge proof validation for selective disclosure</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
}
