import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Copy, QrCode, CheckCircle } from "lucide-react";
import type { Did } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

interface DidDisplayProps {
  did: Did;
}

export function DidDisplay({ did }: DidDisplayProps) {
  const { toast } = useToast();
  const [showQR, setShowQR] = useState(false);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: "DID copied to clipboard.",
    });
  };

  return (
    <>
      <Card className="p-6 bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge className="bg-primary text-primary-foreground">
                Active Identity
              </Badge>
              <Badge variant="outline" className="text-xs">
                {did.method}
              </Badge>
            </div>
            <h2 className="text-xl font-semibold mb-1">Decentralized Identifier</h2>
            <p className="text-sm text-muted-foreground">
              Created {new Date(did.createdAt).toLocaleDateString()}
            </p>
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setShowQR(true)}
            data-testid="button-show-qr"
          >
            <QrCode className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-3">
          <div className="rounded-lg border bg-background/50 p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium">DID String</p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard(did.didString)}
                data-testid="button-copy-did"
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <p className="font-mono text-sm break-all" data-testid="text-did-string">
              {did.didString}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-lg border bg-background/50 p-3">
              <p className="text-muted-foreground mb-1">Key Type</p>
              <p className="font-medium">ECDSA</p>
            </div>
            <div className="rounded-lg border bg-background/50 p-3">
              <p className="text-muted-foreground mb-1">Blockchain</p>
              <p className="font-medium">Ethereum</p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <CheckCircle className="h-4 w-4 text-status-online" />
            <span>Identity verified and blockchain-anchored</span>
          </div>
        </div>
      </Card>

      <Dialog open={showQR} onOpenChange={setShowQR}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>DID QR Code</DialogTitle>
            <DialogDescription>
              Scan this QR code to share your decentralized identifier
            </DialogDescription>
          </DialogHeader>
          <div className="py-6">
            <div className="flex items-center justify-center p-8 bg-white rounded-lg">
              <div className="text-center">
                <div className="h-64 w-64 bg-muted rounded-lg mb-4 flex items-center justify-center">
                  <p className="text-sm text-muted-foreground">QR Code Placeholder</p>
                </div>
                <p className="text-xs text-muted-foreground font-mono break-all">
                  {did.didString}
                </p>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
