import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Copy, Download, Share2, Ban, Shield, FileText, Clock } from "lucide-react";
import type { Credential } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

interface CredentialDetailModalProps {
  credential: Credential;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CredentialDetailModal({
  credential,
  open,
  onOpenChange,
}: CredentialDetailModalProps) {
  const { toast } = useToast();

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: `${label} copied to clipboard.`,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <Shield className="h-5 w-5 text-primary" />
            Credential Details
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview" data-testid="tab-overview">Overview</TabsTrigger>
            <TabsTrigger value="proof" data-testid="tab-proof">Cryptographic Proof</TabsTrigger>
            <TabsTrigger value="history" data-testid="tab-history">History</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <Card className="p-6">
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold mb-2" data-testid="text-detail-title">
                    {credential.title}
                  </h3>
                  <div className="flex gap-2">
                    <Badge variant="outline">{credential.type}</Badge>
                    <Badge>{credential.status}</Badge>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Issuer</p>
                    <p className="font-medium" data-testid="text-detail-issuer">{credential.issuer}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Issued Date</p>
                    <p className="font-medium" data-testid="text-detail-issued">
                      {new Date(credential.issuedAt).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                  {credential.expiresAt && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Expiration Date</p>
                      <p className="font-medium" data-testid="text-detail-expires">
                        {new Date(credential.expiresAt).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </p>
                    </div>
                  )}
                  {credential.issuerDid && (
                    <div className="col-span-2">
                      <p className="text-sm text-muted-foreground mb-1">Issuer DID</p>
                      <p className="font-mono text-xs break-all" data-testid="text-detail-issuer-did">
                        {credential.issuerDid}
                      </p>
                    </div>
                  )}
                </div>

                {credential.credentialSubject && (
                  <div className="pt-4 border-t">
                    <p className="text-sm font-medium mb-3">Credential Data</p>
                    <div className="rounded-md border bg-muted/50 p-4">
                      <pre className="text-xs font-mono whitespace-pre-wrap" data-testid="text-credential-subject">
                        {JSON.stringify(credential.credentialSubject, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            </Card>

            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" data-testid="button-detail-download">
                <Download className="mr-2 h-4 w-4" />
                Download
              </Button>
              <Button className="flex-1" data-testid="button-detail-share">
                <Share2 className="mr-2 h-4 w-4" />
                Share
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="proof" className="space-y-4">
            <Card className="p-6">
              <div className="space-y-4">
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Shield className="h-5 w-5 text-primary" />
                    <h3 className="font-semibold">Cryptographic Proof</h3>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">
                    This credential is secured with cryptographic signatures and blockchain anchoring.
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="rounded-md border bg-muted/50 p-4">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-medium">Proof Type</p>
                      <Badge variant="outline">ECDSA Signature</Badge>
                    </div>
                  </div>

                  <div className="rounded-md border bg-muted/50 p-4">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-medium">Signature</p>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          copyToClipboard(
                            JSON.stringify(credential.proof),
                            "Signature"
                          )
                        }
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                    <pre className="font-mono text-xs break-all whitespace-pre-wrap" data-testid="text-proof-signature">
                      {JSON.stringify(credential.proof, null, 2)}
                    </pre>
                  </div>

                  {credential.ipfsCid && (
                    <div className="rounded-md border bg-muted/50 p-4">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-medium">IPFS Content ID</p>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            copyToClipboard(credential.ipfsCid!, "IPFS CID")
                          }
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                      <p className="font-mono text-xs break-all" data-testid="text-proof-ipfs">
                        {credential.ipfsCid}
                      </p>
                      <a
                        href={`https://ipfs.io/ipfs/${credential.ipfsCid}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-primary hover:underline mt-2 inline-block"
                      >
                        View on IPFS Gateway →
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="history" className="space-y-4">
            <Card className="p-6">
              <div className="space-y-4">
                <h3 className="font-semibold mb-4">Credential Timeline</h3>
                <div className="space-y-4">
                  <div className="flex gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                      <FileText className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Credential Issued</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(credential.issuedAt).toLocaleString()}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Issued by {credential.issuer}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-status-online/10">
                      <Shield className="h-4 w-4 text-status-online" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Status: {credential.status}</p>
                      <p className="text-xs text-muted-foreground">
                        Verified and blockchain-anchored
                      </p>
                    </div>
                  </div>

                  {credential.expiresAt && (
                    <div className="flex gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">Expiration</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(credential.expiresAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
