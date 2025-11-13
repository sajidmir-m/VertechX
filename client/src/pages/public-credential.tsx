import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { downloadCredentialAsPdf, getCredentialShareUrl } from "@/lib/credentialActions";
import type { Credential } from "@shared/schema";
import { Shield, CheckCircle, XCircle, Download, Share2, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface VerificationResponse {
  credential: Credential;
  isValid: boolean;
  verification: {
    verified: boolean;
    notExpired: boolean;
    issuer: string;
    issuedAt: string;
  };
}

interface PublicCredentialProps {
  params: {
    shareToken: string;
  };
}

export default function PublicCredential({ params }: PublicCredentialProps) {
  const { shareToken } = params;
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<VerificationResponse | null>(null);

  const loadCredential = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/verify/${shareToken}`);
      if (!response.ok) {
        const message = (await response.json())?.message || "Verification failed";
        throw new Error(message);
      }
      const payload: VerificationResponse = await response.json();
      setData(payload);
    } catch (err: any) {
      setError(err?.message || "Could not load credential.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadCredential();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shareToken]);

  const handleDownload = () => {
    if (!data?.credential) return;
    downloadCredentialAsPdf(data.credential);
    toast({
      title: "Download started",
      description: "Your credential PDF is being generated.",
    });
  };

  const handleCopyLink = () => {
    if (!data?.credential) return;
    const url = getCredentialShareUrl(data.credential);
    if (!url) {
      toast({
        title: "No share link available",
        description: "This credential does not expose a public share link.",
        variant: "destructive",
      });
      return;
    }
    navigator.clipboard.writeText(url);
    toast({
      title: "Link copied",
      description: "Share link copied to clipboard.",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/20 px-4">
        <Card className="p-8 w-full max-w-xl text-center space-y-4">
          <div className="flex justify-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <Shield className="h-6 w-6 text-primary animate-spin" />
            </div>
          </div>
          <h1 className="text-xl font-semibold">Verifying credential...</h1>
          <p className="text-sm text-muted-foreground">
            Please wait while we fetch and verify the credential details.
          </p>
        </Card>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/20 px-4">
        <Card className="p-8 w-full max-w-xl text-center space-y-4">
          <div className="flex justify-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
              <XCircle className="h-6 w-6 text-destructive" />
            </div>
          </div>
          <h1 className="text-xl font-semibold">Credential unavailable</h1>
          <p className="text-sm text-muted-foreground">{error}</p>
          <Button onClick={loadCredential} variant="outline" className="inline-flex items-center gap-2">
            <RefreshCw className="h-4 w-4" />
            Try again
          </Button>
        </Card>
      </div>
    );
  }

  const { credential, isValid, verification } = data;
  const statusIcon = isValid ? (
    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-status-online/10">
      <CheckCircle className="h-6 w-6 text-status-online" />
    </div>
  ) : (
    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
      <XCircle className="h-6 w-6 text-destructive" />
    </div>
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/20 px-4 py-10">
      <div className="w-full max-w-3xl space-y-6">
        <Card className="p-8 space-y-6">
          <div className="flex items-center gap-4">
            {statusIcon}
            <div>
              <h1 className="text-2xl font-semibold">
                {isValid ? "Credential Verified" : "Credential Invalid"}
              </h1>
              <p className="text-sm text-muted-foreground">
                {isValid
                  ? "This credential passed the automated verification checks."
                  : "This credential failed verification checks."}
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline">{credential.type}</Badge>
              <Badge>{credential.status}</Badge>
            </div>
            <div>
              <p className="text-xs uppercase text-muted-foreground">Title</p>
              <p className="text-lg font-semibold">{credential.title}</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <p className="text-xs uppercase text-muted-foreground mb-1">Issuer</p>
                <p className="font-medium">{credential.issuer}</p>
              </div>
              <div>
                <p className="text-xs uppercase text-muted-foreground mb-1">Issued</p>
                <p className="font-medium">
                  {new Date(credential.issuedAt).toLocaleString()}
                </p>
              </div>
              {credential.expiresAt && (
                <div>
                  <p className="text-xs uppercase text-muted-foreground mb-1">Expires</p>
                  <p className="font-medium">
                    {new Date(credential.expiresAt).toLocaleString()}
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
            <h2 className="text-sm font-semibold">Credential Subject</h2>
            <pre className="text-xs font-mono whitespace-pre-wrap">
              {JSON.stringify(credential.credentialSubject, null, 2)}
            </pre>
          </div>

          <div className="rounded-lg border bg-muted/30 p-4 space-y-2 text-sm">
            <p className="font-semibold">Verification Checks</p>
            <div className="flex items-center justify-between">
              <span>Signature</span>
              <Badge variant={verification.verified ? "default" : "destructive"}>
                {verification.verified ? "Valid" : "Invalid"}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>Expiration</span>
              <Badge variant={verification.notExpired ? "default" : "destructive"}>
                {verification.notExpired ? "Active" : "Expired"}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>Issuer</span>
              <Badge variant="outline">{verification.issuer}</Badge>
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <Button onClick={handleDownload} className="flex-1 inline-flex items-center justify-center gap-2">
              <Download className="h-4 w-4" />
              Download PDF
            </Button>
            <Button
              onClick={handleCopyLink}
              variant="outline"
              className="flex-1 inline-flex items-center justify-center gap-2"
            >
              <Share2 className="h-4 w-4" />
              Copy Share Link
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}

