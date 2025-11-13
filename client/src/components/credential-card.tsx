import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  MoreVertical,
  Eye,
  Share2,
  Download,
  Ban,
  CheckCircle,
  Clock,
  XCircle,
  AlertTriangle,
  Shield,
} from "lucide-react";
import type { Credential } from "@shared/schema";
import { CredentialDetailModal } from "./credential-detail-modal";
import { SelectiveDisclosureDialog } from "./selective-disclosure-dialog";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  downloadCredentialAsPdf,
  shareCredentialLink,
} from "@/lib/credentialActions";

interface CredentialCardProps {
  credential: Credential;
  compact?: boolean;
}

export function CredentialCard({ credential, compact = false }: CredentialCardProps) {
  const [showDetails, setShowDetails] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [showRevokeDialog, setShowRevokeDialog] = useState(false);
  const { toast } = useToast();

  const handleDownload = () => {
    try {
      downloadCredentialAsPdf(credential);
      toast({
        title: "Download started",
        description: "Your credential PDF is being generated.",
      });
    } catch (error) {
      console.error(error);
      toast({
        title: "Download failed",
        description: "We couldn't generate the PDF. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleShare = async () => {
    try {
      const result = await shareCredentialLink(credential);
      toast({
        title: "Share link ready",
        description:
          result.method === "web-share"
            ? "Shared via your device's share dialog."
            : "Share link copied to clipboard.",
      });
    } catch (error: any) {
      toast({
        title: "Share unavailable",
        description:
          error?.message ||
          "Unable to share this credential. Ensure it has a share token.",
        variant: "destructive",
      });
    }
  };

  const revokeMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("PATCH", `/api/credentials/${credential.id}/revoke`);
      return await res.json();
    },
    onSuccess: () => {
      // Invalidate credentials query to refresh the list
      queryClient.invalidateQueries({ queryKey: ["/api/credentials"] });
      queryClient.invalidateQueries({ queryKey: ["/api/activities"] });
      toast({
        title: "Credential revoked",
        description: `"${credential.title}" has been successfully revoked.`,
      });
      setShowRevokeDialog(false);
    },
    onError: (error: any) => {
      toast({
        title: "Revoke failed",
        description: error.message || "Failed to revoke credential. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleRevoke = () => {
    if (credential.status === "revoked") {
      toast({
        title: "Already revoked",
        description: "This credential is already revoked.",
        variant: "destructive",
      });
      return;
    }
    setShowRevokeDialog(true);
  };

  const statusConfig = {
    verified: {
      icon: CheckCircle,
      label: "Verified",
      color: "text-status-online",
      badgeVariant: "default" as const,
    },
    pending: {
      icon: Clock,
      label: "Pending",
      color: "text-status-away",
      badgeVariant: "secondary" as const,
    },
    expired: {
      icon: AlertTriangle,
      label: "Expired",
      color: "text-status-away",
      badgeVariant: "secondary" as const,
    },
    revoked: {
      icon: XCircle,
      label: "Revoked",
      color: "text-destructive",
      badgeVariant: "destructive" as const,
    },
  };

  const status = statusConfig[credential.status as keyof typeof statusConfig] || statusConfig.verified;
  const StatusIcon = status.icon;

  return (
    <>
      <Card className="hover-elevate overflow-hidden" data-testid={`credential-card-${credential.id}`}>
        <div className={compact ? "p-4" : "p-6"}>
          {/* Header */}
          <div className="flex flex-col gap-3 mb-4 md:flex-row md:items-start md:justify-between">
            <div className="flex-1 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline" className="text-xs" data-testid="badge-credential-type">
                  {credential.type}
                </Badge>
                <Badge variant={status.badgeVariant} className="text-xs" data-testid="badge-credential-status">
                  <StatusIcon className="mr-1 h-3 w-3" />
                  {status.label}
                </Badge>
              </div>
              <h3 className="font-semibold text-lg leading-snug" data-testid="text-credential-title">
                {credential.title}
              </h3>
              <p className="text-sm text-muted-foreground" data-testid="text-credential-issuer">
                Issued by {credential.issuer}
              </p>
            </div>
            <div className="self-start md:self-auto">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="ml-auto" data-testid="button-credential-menu">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setShowDetails(true)} data-testid="menu-view-details">
                    <Eye className="mr-2 h-4 w-4" />
                    View Details
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleShare} data-testid="menu-share">
                    <Share2 className="mr-2 h-4 w-4" />
                    Share Link
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setShowShare(true)}
                    data-testid="menu-selective-disclosure"
                  >
                    <Shield className="mr-2 h-4 w-4" />
                    Selective Disclosure
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleDownload} data-testid="menu-download">
                    <Download className="mr-2 h-4 w-4" />
                    Download
                  </DropdownMenuItem>
                  {credential.status !== "revoked" && (
                    <DropdownMenuItem 
                      className="text-destructive" 
                      data-testid="menu-revoke"
                      onClick={handleRevoke}
                    >
                      <Ban className="mr-2 h-4 w-4" />
                      Revoke
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Body */}
          {!compact && (
            <div className="space-y-3 mb-4">
              <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
                <div>
                  <p className="text-muted-foreground mb-1">Issued</p>
                  <p className="font-medium" data-testid="text-issued-date">
                    {new Date(credential.issuedAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1">
                    {credential.expiresAt ? "Expires" : "Valid"}
                  </p>
                  <p className="font-medium" data-testid="text-expiry-date">
                    {credential.expiresAt
                      ? new Date(credential.expiresAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })
                      : "No expiration"}
                  </p>
                </div>
              </div>

              {credential.ipfsCid && (
                <div className="rounded-md border bg-muted/50 p-2">
                  <p className="text-xs text-muted-foreground mb-1">IPFS CID</p>
                  <p className="font-mono text-xs break-all" data-testid="text-ipfs-cid">
                    {credential.ipfsCid}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Footer */}
          {!compact && (
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => setShowDetails(true)}
                data-testid="button-view-details"
              >
                <Eye className="mr-2 h-4 w-4" />
                View
              </Button>
              <Button
                size="sm"
                className="flex-1"
                onClick={handleShare}
                data-testid="button-share-credential"
              >
                <Share2 className="mr-2 h-4 w-4" />
                Share
              </Button>
            </div>
          )}
        </div>
      </Card>

      <CredentialDetailModal
        credential={credential}
        open={showDetails}
        onOpenChange={setShowDetails}
      />

      <SelectiveDisclosureDialog
        credential={credential}
        open={showShare}
        onOpenChange={setShowShare}
      />

      <AlertDialog open={showRevokeDialog} onOpenChange={setShowRevokeDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke Credential</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to revoke "{credential.title}"? This action cannot be undone.
              Once revoked, this credential will no longer be valid for verification.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={revokeMutation.isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => revokeMutation.mutate()}
              disabled={revokeMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {revokeMutation.isPending ? "Revoking..." : "Revoke"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
