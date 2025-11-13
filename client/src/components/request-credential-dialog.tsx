import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Shield, Building2, GraduationCap, Briefcase, CreditCard } from "lucide-react";

interface RequestCredentialDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const credentialTypes = [
  {
    value: "EducationalCredential",
    label: "Educational Credential",
    icon: GraduationCap,
    issuer: "University of Blockchain",
  },
  {
    value: "GovernmentID",
    label: "Government ID",
    icon: Shield,
    issuer: "Digital Government Authority",
  },
  {
    value: "EmploymentCredential",
    label: "Employment Verification",
    icon: Briefcase,
    issuer: "Tech Corp Inc.",
  },
  {
    value: "ProfessionalLicense",
    label: "Professional License",
    icon: CreditCard,
    issuer: "Licensing Board",
  },
];

export function RequestCredentialDialog({ open, onOpenChange }: RequestCredentialDialogProps) {
  const { toast } = useToast();
  const [selectedType, setSelectedType] = useState("");
  const [title, setTitle] = useState("");

  const requestMutation = useMutation({
    mutationFn: async () => {
      const selected = credentialTypes.find((t) => t.value === selectedType);
      const credentialTitle = title || selected?.label || "Credential";
      return await apiRequest("POST", "/api/credentials/request", {
        type: selectedType,
        title: credentialTitle,
        issuer: selected?.issuer || "Unknown Issuer",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/credentials"] });
      queryClient.invalidateQueries({ queryKey: ["/api/activities"] });
      toast({
        title: "Credential Requested",
        description: "Your credential request has been submitted to the issuer.",
      });
      onOpenChange(false);
      setSelectedType("");
      setTitle("");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to request credential. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = () => {
    if (!selectedType) {
      toast({
        title: "Error",
        description: "Please select a credential type.",
        variant: "destructive",
      });
      return;
    }
    requestMutation.mutate();
  };

  const selectedCredential = credentialTypes.find((t) => t.value === selectedType);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Request Credential</DialogTitle>
          <DialogDescription>
            Request a verifiable credential from a trusted issuer
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="credential-type">Credential Type</Label>
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger id="credential-type" data-testid="select-credential-type">
                <SelectValue placeholder="Select credential type" />
              </SelectTrigger>
              <SelectContent>
                {credentialTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    <div className="flex items-center gap-2">
                      <type.icon className="h-4 w-4" />
                      {type.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Title (Optional)</Label>
            <Input
              id="title"
              placeholder="e.g., Bachelor of Science in Computer Science"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              data-testid="input-credential-title"
            />
          </div>

          {selectedCredential && (
            <div className="rounded-lg border bg-muted/50 p-4">
              <div className="flex items-center gap-3 mb-2">
                <selectedCredential.icon className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-medium text-sm">{selectedCredential.label}</p>
                  <p className="text-xs text-muted-foreground">
                    Issuer: {selectedCredential.issuer}
                  </p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                This credential will be cryptographically signed and stored on IPFS.
              </p>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
              data-testid="button-cancel-request"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={requestMutation.isPending || !selectedType}
              className="flex-1"
              data-testid="button-submit-request"
            >
              {requestMutation.isPending ? "Requesting..." : "Request Credential"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
