import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Copy, Key, QrCode, Shield, Plus, CheckCircle } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { Did } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { DidDisplay } from "@/components/did-display";

export default function Wallet() {
  const { toast } = useToast();
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const { data: did, isLoading } = useQuery<Did>({
    queryKey: ["/api/did/current"],
  });

  const createDidMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", "/api/did/create", {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/did/current"] });
      queryClient.invalidateQueries({ queryKey: ["/api/activities"] });
      setShowCreateDialog(false);
      toast({
        title: "DID Created Successfully",
        description: "Your decentralized identifier has been generated.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create DID. Please try again.",
        variant: "destructive",
      });
    },
  });

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: `${label} copied to clipboard.`,
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-8">
        <Skeleton className="h-12 w-64" />
        <Card className="p-8">
          <Skeleton className="h-64 w-full" />
        </Card>
      </div>
    );
  }

  if (!did) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Identity Wallet</h1>
          <p className="text-muted-foreground">
            Create your decentralized identifier to get started
          </p>
        </div>

        <Card className="p-12 text-center max-w-2xl mx-auto">
          <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 mx-auto">
            <Key className="h-10 w-10 text-primary" />
          </div>
          <h2 className="text-2xl font-bold mb-4">No Identity Found</h2>
          <p className="text-muted-foreground mb-8 max-w-md mx-auto">
            You haven't created a decentralized identifier yet. Create one now to start 
            managing your credentials securely.
          </p>
          <Button
            size="lg"
            onClick={() => setShowCreateDialog(true)}
            data-testid="button-create-did"
          >
            <Plus className="mr-2 h-5 w-5" />
            Create My DID
          </Button>
        </Card>

        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Decentralized Identifier</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <p className="text-sm text-muted-foreground">
                This will generate a unique decentralized identifier (DID) with cryptographic 
                keys. Your private key will be securely stored.
              </p>
              <div className="rounded-lg border bg-muted/50 p-4 space-y-2">
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium text-sm">Blockchain-Anchored</p>
                    <p className="text-xs text-muted-foreground">Registered on Ethereum</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium text-sm">Cryptographically Secure</p>
                    <p className="text-xs text-muted-foreground">ECDSA key pair generation</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium text-sm">Self-Sovereign</p>
                    <p className="text-xs text-muted-foreground">You own and control it</p>
                  </div>
                </div>
              </div>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setShowCreateDialog(false)}
                  className="flex-1"
                  data-testid="button-cancel-create"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => createDidMutation.mutate()}
                  disabled={createDidMutation.isPending}
                  className="flex-1"
                  data-testid="button-confirm-create"
                >
                  {createDidMutation.isPending ? "Creating..." : "Create DID"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Identity Wallet</h1>
        <p className="text-muted-foreground">
          Manage your decentralized identifier and cryptographic keys
        </p>
      </div>

      {/* DID Display */}
      <DidDisplay did={did} />

      {/* Key Information */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Key className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold">Public Key</h3>
              <p className="text-xs text-muted-foreground">Share with verifiers</p>
            </div>
          </div>
          <div className="rounded-md border bg-muted/50 p-3">
            <p className="font-mono text-xs break-all" data-testid="text-public-key">
              {did.publicKey}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="mt-3 w-full"
            onClick={() => copyToClipboard(did.publicKey, "Public key")}
            data-testid="button-copy-public-key"
          >
            <Copy className="mr-2 h-4 w-4" />
            Copy Public Key
          </Button>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-destructive/10">
              <Shield className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <h3 className="font-semibold">Private Key</h3>
              <p className="text-xs text-muted-foreground">Keep secure, never share</p>
            </div>
          </div>
          <div className="rounded-md border bg-destructive/5 p-3">
            <p className="font-mono text-xs break-all blur-sm hover:blur-none transition-all" data-testid="text-private-key">
              {did.privateKey}
            </p>
          </div>
          <div className="mt-3 rounded-md border-destructive/50 bg-destructive/5 border p-2">
            <p className="text-xs text-destructive font-medium">
              ⚠️ Never share your private key with anyone
            </p>
          </div>
        </Card>
      </div>

      {/* Metadata */}
      <Card className="p-6">
        <h3 className="font-semibold mb-4">Identity Information</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-sm text-muted-foreground mb-1">Method</p>
            <Badge variant="outline" data-testid="badge-method">
              {did.method}
            </Badge>
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-1">Created</p>
            <p className="text-sm font-medium" data-testid="text-created-date">
              {new Date(did.createdAt).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
