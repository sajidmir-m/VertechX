import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, AlertTriangle, Copy, QrCode } from "lucide-react";
import type { Credential } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface SelectiveDisclosureDialogProps {
  credential: Credential;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SelectiveDisclosureDialog({
  credential,
  open,
  onOpenChange,
}: SelectiveDisclosureDialogProps) {
  const { toast } = useToast();
  const [selectedFields, setSelectedFields] = useState<string[]>([]);
  const [generatedProof, setGeneratedProof] = useState<string | null>(null);

  const credentialFields =
    typeof credential.credentialSubject === "object" && credential.credentialSubject !== null
      ? Object.keys(credential.credentialSubject)
      : [];

  const generateProofMutation = useMutation({
    mutationFn: async (fields: string[]) => {
      return await apiRequest("POST", "/api/credentials/selective-disclosure", {
        credentialId: credential.id,
        fields,
      });
    },
    onSuccess: (data: { proof: string }) => {
      setGeneratedProof(data.proof);
      toast({
        title: "Proof Generated",
        description: "Your selective disclosure proof has been created.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to generate proof. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleFieldToggle = (field: string) => {
    setSelectedFields((prev) =>
      prev.includes(field)
        ? prev.filter((f) => f !== field)
        : [...prev, field]
    );
  };

  const handleGenerateProof = () => {
    if (selectedFields.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one field to share.",
        variant: "destructive",
      });
      return;
    }
    generateProofMutation.mutate(selectedFields);
  };

  const handleCopyProof = () => {
    if (generatedProof) {
      navigator.clipboard.writeText(generatedProof);
      toast({
        title: "Copied!",
        description: "Proof copied to clipboard.",
      });
    }
  };

  const handleReset = () => {
    setSelectedFields([]);
    setGeneratedProof(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Selective Disclosure
          </DialogTitle>
          <DialogDescription>
            Share only specific attributes without revealing your entire credential
          </DialogDescription>
        </DialogHeader>

        {!generatedProof ? (
          <div className="space-y-4">
            <Card className="p-4 border-primary/50 bg-primary/5">
              <div className="flex gap-3">
                <AlertTriangle className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                <div className="text-sm">
                  <p className="font-medium text-primary mb-1">Privacy Protection</p>
                  <p className="text-muted-foreground">
                    Only selected attributes will be shared. Unselected fields remain private and
                    hidden from the verifier.
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="font-semibold mb-4">Select Fields to Share</h3>
              <div className="space-y-3">
                {credentialFields.map((field) => {
                  const value = (credential.credentialSubject as any)[field];
                  return (
                    <div
                      key={field}
                      className="flex items-start gap-3 p-3 rounded-lg border hover-elevate"
                    >
                      <Checkbox
                        id={field}
                        checked={selectedFields.includes(field)}
                        onCheckedChange={() => handleFieldToggle(field)}
                        data-testid={`checkbox-${field}`}
                      />
                      <div className="flex-1">
                        <Label
                          htmlFor={field}
                          className="text-sm font-medium cursor-pointer"
                        >
                          {field}
                        </Label>
                        <p className="text-xs text-muted-foreground mt-1">
                          {typeof value === "object"
                            ? JSON.stringify(value)
                            : String(value)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>

            <Card className="p-4 bg-muted/50">
              <h4 className="text-sm font-medium mb-2">Preview: What Will Be Shared</h4>
              {selectedFields.length > 0 ? (
                <div className="space-y-1">
                  {selectedFields.map((field) => (
                    <Badge key={field} variant="outline" className="mr-2">
                      {field}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">
                  No fields selected yet
                </p>
              )}
            </Card>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="flex-1"
                data-testid="button-cancel-disclosure"
              >
                Cancel
              </Button>
              <Button
                onClick={handleGenerateProof}
                disabled={
                  generateProofMutation.isPending || selectedFields.length === 0
                }
                className="flex-1"
                data-testid="button-generate-proof"
              >
                {generateProofMutation.isPending
                  ? "Generating..."
                  : "Generate Proof"}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <Card className="p-6 border-status-online/50 bg-status-online/5">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-status-online/10">
                  <Shield className="h-5 w-5 text-status-online" />
                </div>
                <div>
                  <h3 className="font-semibold">Proof Generated Successfully</h3>
                  <p className="text-sm text-muted-foreground">
                    Share this proof with verifiers
                  </p>
                </div>
              </div>

              <div className="rounded-md border bg-background p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium">Zero-Knowledge Proof</p>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleCopyProof}
                      data-testid="button-copy-proof"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" data-testid="button-qr-proof">
                      <QrCode className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <pre className="font-mono text-xs break-all whitespace-pre-wrap max-h-48 overflow-y-auto" data-testid="text-generated-proof">
                  {generatedProof}
                </pre>
              </div>
            </Card>

            <Card className="p-4 bg-muted/50">
              <h4 className="text-sm font-medium mb-2">Shared Fields</h4>
              <div className="space-y-1">
                {selectedFields.map((field) => (
                  <Badge key={field} variant="outline" className="mr-2">
                    {field}
                  </Badge>
                ))}
              </div>
            </Card>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={handleReset}
                className="flex-1"
                data-testid="button-reset-disclosure"
              >
                Create Another
              </Button>
              <Button
                onClick={() => onOpenChange(false)}
                className="flex-1"
                data-testid="button-close-disclosure"
              >
                Done
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
