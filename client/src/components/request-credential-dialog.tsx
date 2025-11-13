import { useEffect, useMemo, useState, useRef } from "react";
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
import {
  Shield,
  GraduationCap,
  Briefcase,
  CreditCard,
  PlusCircle,
  Trash2,
  Code,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";

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
  const [issuer, setIssuer] = useState("");
  const [issuedDate, setIssuedDate] = useState("");
  const [expiresDate, setExpiresDate] = useState("");
  const [useCustomData, setUseCustomData] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const createEmptyField = () => ({
    id: Math.random().toString(36).slice(2, 10),
    key: "",
    value: "",
  });
  const [customFields, setCustomFields] = useState<Array<{ id: string; key: string; value: string }>>([
    createEmptyField(),
  ]);
  const [showAdvancedJson, setShowAdvancedJson] = useState(false);
  const [customJson, setCustomJson] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [documentUrl, setDocumentUrl] = useState("");

  const scrollUp = () => {
    const scrollContainer = scrollAreaRef.current?.querySelector('[data-radix-scroll-area-viewport]');
    if (scrollContainer) {
      scrollContainer.scrollBy({ top: -200, behavior: 'smooth' });
    }
  };

  const scrollDown = () => {
    const scrollContainer = scrollAreaRef.current?.querySelector('[data-radix-scroll-area-viewport]');
    if (scrollContainer) {
      scrollContainer.scrollBy({ top: 200, behavior: 'smooth' });
    }
  };

  const addCustomField = () => {
    setCustomFields((prev) => [...prev, createEmptyField()]);
  };

  const updateCustomField = (id: string, field: "key" | "value", value: string) => {
    setCustomFields((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  const removeCustomField = (id: string) => {
    setCustomFields((prev) => (prev.length === 1 ? prev : prev.filter((item) => item.id !== id)));
  };

  const coerceFieldValue = (rawValue: string): unknown => {
    const value = rawValue.trim();
    if (value === "") return "";

    if (/^-?\d+(\.\d+)?$/.test(value)) {
      return Number(value);
    }

    if (value.toLowerCase() === "true" || value.toLowerCase() === "false") {
      return value.toLowerCase() === "true";
    }

    if (
      (value.startsWith("{") && value.endsWith("}")) ||
      (value.startsWith("[") && value.endsWith("]"))
    ) {
      try {
        return JSON.parse(value);
      } catch {
        return value;
      }
    }

    return value;
  };

  const customDataPreview = useMemo(() => {
    return customFields.reduce<Record<string, unknown>>((acc, field) => {
      const key = field.key.trim();
      if (!key) return acc;
      acc[key] = coerceFieldValue(field.value);
      return acc;
    }, {});
  }, [customFields]);

  useEffect(() => {
    if (!open) {
      // Reset all fields when dialog closes
      setSelectedType("");
      setTitle("");
      setIssuer("");
      setIssuedDate("");
      setExpiresDate("");
      setUseCustomData(false);
      setShowAdvancedJson(false);
      setCustomJson("");
      setCustomFields([createEmptyField()]);
      setImageUrl("");
      setDocumentUrl("");
    }
  }, [open]);

  useEffect(() => {
    if (useCustomData && customFields.length === 0) {
      setCustomFields([createEmptyField()]);
    }
    if (!useCustomData) {
      setShowAdvancedJson(false);
      setCustomJson("");
      setCustomFields([createEmptyField()]);
      setImageUrl("");
      setDocumentUrl("");
    }
  }, [useCustomData]);

  useEffect(() => {
    if (showAdvancedJson && customJson.trim() === "") {
      if (Object.keys(customDataPreview).length > 0) {
        setCustomJson(JSON.stringify(customDataPreview, null, 2));
      }
    }
  }, [showAdvancedJson, customDataPreview, customJson]);

  const requestMutation = useMutation({
    mutationFn: async (payload: {
      mode: "template" | "custom";
      data: Record<string, unknown>;
    }) => {
      if (payload.mode === "custom") {
        return await apiRequest("POST", "/api/credentials/custom", payload.data);
      }
      return await apiRequest("POST", "/api/credentials/request", payload.data);
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
      setUseCustomData(false);
      setCustomFields([createEmptyField()]);
      setShowAdvancedJson(false);
      setCustomJson("");
      setImageUrl("");
      setDocumentUrl("");
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
    
    if (!issuer.trim()) {
      toast({
        title: "Error",
        description: "Please enter an issuer name.",
        variant: "destructive",
      });
      return;
    }
    
    const selected = credentialTypes.find((t) => t.value === selectedType);
    const credentialTitle = title || selected?.label || "Credential";

    if (useCustomData) {
      let credentialData: Record<string, unknown> = {};

      if (showAdvancedJson) {
        if (!customJson.trim()) {
          toast({
            title: "Missing data",
            description: "Paste your credential JSON data before submitting.",
            variant: "destructive",
          });
          return;
        }

        let parsedData: unknown;
        try {
          parsedData = JSON.parse(customJson);
        } catch (error: any) {
          toast({
            title: "Invalid JSON",
            description: error?.message || "Please provide valid JSON for your credential data.",
            variant: "destructive",
          });
          return;
        }

        if (typeof parsedData !== "object" || parsedData === null || Array.isArray(parsedData)) {
          toast({
            title: "Invalid structure",
            description: "Credential data must be a JSON object (key-value pairs).",
            variant: "destructive",
          });
          return;
        }

        credentialData = parsedData as Record<string, unknown>;
      } else {
        const simpleData = customDataPreview;
        if (Object.keys(simpleData).length === 0) {
          toast({
            title: "Missing fields",
            description: "Add at least one field when using the simple form.",
            variant: "destructive",
          });
          return;
        }
        credentialData = simpleData;
      }

      requestMutation.mutate({
        mode: "custom",
        data: {
          type: selectedType,
          title: credentialTitle,
          issuer: issuer.trim(),
          issuedDate: issuedDate || undefined,
          expiresDate: expiresDate || undefined,
          credentialData,
          imageUrl: imageUrl.trim() || undefined,
          documentUrl: documentUrl.trim() || undefined,
        },
      });
      return;
    }

    requestMutation.mutate({
      mode: "template",
      data: {
        type: selectedType,
        title: credentialTitle,
        issuer: issuer.trim(),
        issuedDate: issuedDate || undefined,
        expiresDate: expiresDate || undefined,
      },
    });
  };

  const selectedCredential = credentialTypes.find((t) => t.value === selectedType);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={useCustomData ? "max-h-[90vh] max-w-[95vw] sm:max-w-[90vw] md:max-w-[85vw] lg:max-w-4xl flex flex-col p-0 overflow-hidden" : "max-w-md"}>
        <DialogHeader className={useCustomData ? "px-4 sm:px-6 pt-4 sm:pt-6 pb-3 sm:pb-4 flex-shrink-0" : ""}>
          <DialogTitle>Request Credential</DialogTitle>
          <DialogDescription>
            Request a verifiable credential from a trusted issuer
          </DialogDescription>
        </DialogHeader>

        {useCustomData ? (
          <>
          <div className="flex flex-1 min-h-0 relative">
            <ScrollArea ref={scrollAreaRef} className="flex-1 px-4 sm:px-6 pr-12 sm:pr-16">
              <div className="space-y-4 pb-4">
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
                  <Label htmlFor="issuer">Issuer *</Label>
                  <Input
                    id="issuer"
                    placeholder="e.g., University of Blockchain, Company Name, Government Authority"
                    value={issuer}
                    onChange={(e) => setIssuer(e.target.value)}
                    disabled={requestMutation.isPending}
                    data-testid="input-issuer"
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Enter the name of the organization or authority issuing this credential
                  </p>
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

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="issuedDate">Issued Date (Optional)</Label>
                    <Input
                      id="issuedDate"
                      type="date"
                      value={issuedDate}
                      onChange={(e) => setIssuedDate(e.target.value)}
                      disabled={requestMutation.isPending}
                      data-testid="input-issued-date"
                    />
                    <p className="text-xs text-muted-foreground">
                      Date when the credential was issued
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="expiresDate">Expires Date (Optional)</Label>
                    <Input
                      id="expiresDate"
                      type="date"
                      value={expiresDate}
                      onChange={(e) => setExpiresDate(e.target.value)}
                      disabled={requestMutation.isPending}
                      data-testid="input-expires-date"
                      min={issuedDate || undefined}
                    />
                    <p className="text-xs text-muted-foreground">
                      Date when the credential expires
                    </p>
                  </div>
                </div>

                {selectedCredential && (
                  <div className="rounded-lg border bg-muted/50 p-4">
                    <div className="flex items-center gap-3 mb-2">
                      <selectedCredential.icon className="h-5 w-5 text-primary" />
                      <div>
                        <p className="font-medium text-sm">{selectedCredential.label}</p>
                        {issuer && (
                          <p className="text-xs text-muted-foreground">
                            Issuer: {issuer}
                          </p>
                        )}
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      This credential will be cryptographically signed and stored on IPFS.
                    </p>
                  </div>
                )}

                <div className="space-y-2 pt-2">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <Label htmlFor="custom-data-switch">Provide custom credential data</Label>
                    <Switch
                      id="custom-data-switch"
                      checked={useCustomData}
                      onCheckedChange={setUseCustomData}
                      data-testid="switch-custom-data"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Enable this to input real credential fields (simple form or JSON) plus optional media links.
                  </p>
                </div>

                <div className="rounded-2xl border bg-card/70 shadow-xl overflow-hidden">
                  <div className="space-y-4 sm:space-y-6 p-3 sm:p-4 lg:p-6">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-foreground">Credential Attributes</p>
                      <p className="text-xs text-muted-foreground max-w-md">
                        Capture each real-world data point. We'll format it into valid JSON for the credential record.
                      </p>
                    </div>
                    <div className="flex items-center gap-2 self-start rounded-full border bg-background px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:self-auto">
                      <Switch
                        id="advanced-json-toggle"
                        checked={showAdvancedJson}
                        onCheckedChange={setShowAdvancedJson}
                        data-testid="switch-advanced-json"
                      />
                      <Label htmlFor="advanced-json-toggle" className="flex items-center gap-1 text-muted-foreground">
                        <Code className="h-3 w-3" />
                        <span className="hidden sm:inline">JSON editor</span>
                      </Label>
                    </div>
                  </div>

                  <div className="grid gap-4 sm:gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
                    <div className="space-y-4">
                      {showAdvancedJson ? (
                        <div className="space-y-2">
                          <Textarea
                            id="customJson"
                            value={customJson}
                            onChange={(e) => setCustomJson(e.target.value)}
                            placeholder={`{
  "studentName": "Aisha Shah",
  "degree": "Bachelor of Science",
  "major": "Physics",
  "graduationYear": 2022
}`}
                            className="font-mono text-[10px] sm:text-xs min-h-[200px] sm:min-h-[260px] rounded-md border bg-background p-2 sm:p-3"
                            data-testid="textarea-custom-json"
                          />
                          <p className="text-xs text-muted-foreground">
                            Paste or edit raw JSON. We’ll validate the structure before submission.
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <div className="grid gap-3">
                            {customFields.map((field, index) => (
                              <div
                                key={field.id}
                                className="grid gap-2 sm:gap-3 rounded-xl border bg-background/80 p-2 sm:p-3 shadow-sm sm:grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)_auto]"
                              >
                                <div className="space-y-1">
                                  <Label className="text-xs font-medium text-muted-foreground">Field Name</Label>
                                  <Input
                                    value={field.key}
                                    onChange={(e) => updateCustomField(field.id, "key", e.target.value)}
                                    placeholder="e.g., studentName"
                                    data-testid={`input-custom-key-${index}`}
                                  />
                                </div>
                                <div className="space-y-1">
                                  <Label className="text-xs font-medium text-muted-foreground">Field Value</Label>
                                  <Input
                                    value={field.value}
                                    onChange={(e) => updateCustomField(field.id, "value", e.target.value)}
                                    placeholder='e.g., "Aisha Shah"'
                                    data-testid={`input-custom-value-${index}`}
                                  />
                                  <p className="text-[10px] text-muted-foreground">
                                    Numbers, booleans, arrays, and objects are auto-detected. Use valid JSON for complex values.
                                  </p>
                                </div>
                                <div className="flex items-start justify-end pt-1 sm:pt-5">
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="text-muted-foreground hover:text-destructive"
                                    onClick={() => removeCustomField(field.id)}
                                    disabled={customFields.length === 1}
                                    data-testid={`button-remove-field-${index}`}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            className="inline-flex items-center gap-2"
                            onClick={addCustomField}
                            data-testid="button-add-custom-field"
                          >
                            <PlusCircle className="h-4 w-4" />
                            Add field
                          </Button>
                        </div>
                      )}
                    </div>

                    <div className="rounded-lg border bg-background/80 p-2 sm:p-3">
                      <p className="text-xs font-semibold text-muted-foreground mb-2">
                        JSON Preview
                      </p>
                      <pre className="max-h-48 sm:max-h-64 overflow-auto whitespace-pre-wrap break-all text-[10px] sm:text-xs font-mono p-2">
                        {showAdvancedJson && customJson.trim()
                          ? customJson
                          : JSON.stringify(customDataPreview, null, 2)}
                      </pre>
                    </div>
                  </div>

                  <div className="grid gap-3 sm:gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="imageUrl">Credential Image URL (optional)</Label>
                      <Input
                        id="imageUrl"
                        type="url"
                        placeholder="https://your-storage.com/credential-photo.jpg"
                        value={imageUrl}
                        onChange={(e) => setImageUrl(e.target.value)}
                        data-testid="input-image-url"
                      />
                      <p className="text-[11px] text-muted-foreground">
                        Provide a publicly accessible image (PNG, JPG, etc.) for quick visual verification.
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="documentUrl">Supporting Document URL (optional)</Label>
                      <Input
                        id="documentUrl"
                        type="url"
                        placeholder="https://your-storage.com/credential-document.pdf"
                        value={documentUrl}
                        onChange={(e) => setDocumentUrl(e.target.value)}
                        data-testid="input-document-url"
                      />
                      <p className="text-[11px] text-muted-foreground">
                        Link to the underlying PDF or notarized document. Ideal for external auditors.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            </ScrollArea>
            
            {/* Scroll Buttons */}
            <div className="flex flex-col gap-2 pr-2 sm:pr-4 py-2 absolute right-0 top-1/2 -translate-y-1/2 z-10">
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-8 w-8 rounded-full shadow-md bg-background/95 backdrop-blur"
                onClick={scrollUp}
                aria-label="Scroll up"
              >
                <ChevronUp className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-8 w-8 rounded-full shadow-md bg-background/95 backdrop-blur"
                onClick={scrollDown}
                aria-label="Scroll down"
              >
                <ChevronDown className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          <div className="flex gap-3 px-4 sm:px-6 pb-4 sm:pb-6 pt-3 sm:pt-4 border-t bg-background flex-shrink-0">
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
              disabled={requestMutation.isPending || !selectedType || !issuer.trim()}
              className="flex-1"
              data-testid="button-submit-request"
            >
              {requestMutation.isPending ? "Requesting..." : "Request Credential"}
            </Button>
          </div>
          </>
        ) : (
          <div className="space-y-4 py-4 px-6">
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
            <Label htmlFor="issuer">Issuer *</Label>
            <Input
              id="issuer"
              placeholder="e.g., University of Blockchain, Company Name, Government Authority"
              value={issuer}
              onChange={(e) => setIssuer(e.target.value)}
              disabled={requestMutation.isPending}
              data-testid="input-issuer"
              required
            />
            <p className="text-xs text-muted-foreground">
              Enter the name of the organization or authority issuing this credential
            </p>
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

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="issuedDate">Issued Date (Optional)</Label>
              <Input
                id="issuedDate"
                type="date"
                value={issuedDate}
                onChange={(e) => setIssuedDate(e.target.value)}
                disabled={requestMutation.isPending}
                data-testid="input-issued-date"
              />
              <p className="text-xs text-muted-foreground">
                Date when the credential was issued
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="expiresDate">Expires Date (Optional)</Label>
              <Input
                id="expiresDate"
                type="date"
                value={expiresDate}
                onChange={(e) => setExpiresDate(e.target.value)}
                disabled={requestMutation.isPending}
                data-testid="input-expires-date"
                min={issuedDate || undefined}
              />
              <p className="text-xs text-muted-foreground">
                Date when the credential expires
              </p>
            </div>
          </div>

          {selectedCredential && (
            <div className="rounded-lg border bg-muted/50 p-4">
              <div className="flex items-center gap-3 mb-2">
                <selectedCredential.icon className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-medium text-sm">{selectedCredential.label}</p>
                  {issuer && (
                  <p className="text-xs text-muted-foreground">
                      Issuer: {issuer}
                  </p>
                  )}
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                This credential will be cryptographically signed and stored on IPFS.
              </p>
            </div>
          )}

            <div className="space-y-2 pt-2">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <Label htmlFor="custom-data-switch">Provide custom credential data</Label>
                <Switch
                  id="custom-data-switch"
                  checked={useCustomData}
                  onCheckedChange={setUseCustomData}
                  data-testid="switch-custom-data"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Enable this to input real credential fields (simple form or JSON) plus optional media links.
              </p>
            </div>

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
              disabled={requestMutation.isPending || !selectedType || !issuer.trim()}
              className="flex-1"
              data-testid="button-submit-request"
            >
              {requestMutation.isPending ? "Requesting..." : "Request Credential"}
            </Button>
          </div>
        </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
