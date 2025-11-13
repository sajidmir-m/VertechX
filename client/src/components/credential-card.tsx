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
import { MoreVertical, Eye, Share2, Download, Ban, CheckCircle, Clock, XCircle, AlertTriangle } from "lucide-react";
import type { Credential } from "@shared/schema";
import { CredentialDetailModal } from "./credential-detail-modal";
import { SelectiveDisclosureDialog } from "./selective-disclosure-dialog";

interface CredentialCardProps {
  credential: Credential;
  compact?: boolean;
}

export function CredentialCard({ credential, compact = false }: CredentialCardProps) {
  const [showDetails, setShowDetails] = useState(false);
  const [showShare, setShowShare] = useState(false);

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
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline" className="text-xs" data-testid="badge-credential-type">
                  {credential.type}
                </Badge>
                <Badge variant={status.badgeVariant} className="text-xs" data-testid="badge-credential-status">
                  <StatusIcon className="mr-1 h-3 w-3" />
                  {status.label}
                </Badge>
              </div>
              <h3 className="font-semibold text-lg mb-1" data-testid="text-credential-title">
                {credential.title}
              </h3>
              <p className="text-sm text-muted-foreground" data-testid="text-credential-issuer">
                Issued by {credential.issuer}
              </p>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" data-testid="button-credential-menu">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setShowDetails(true)} data-testid="menu-view-details">
                  <Eye className="mr-2 h-4 w-4" />
                  View Details
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setShowShare(true)} data-testid="menu-share">
                  <Share2 className="mr-2 h-4 w-4" />
                  Share
                </DropdownMenuItem>
                <DropdownMenuItem data-testid="menu-download">
                  <Download className="mr-2 h-4 w-4" />
                  Download
                </DropdownMenuItem>
                <DropdownMenuItem className="text-destructive" data-testid="menu-revoke">
                  <Ban className="mr-2 h-4 w-4" />
                  Revoke
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Body */}
          {!compact && (
            <div className="space-y-3 mb-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
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
            <div className="flex gap-2">
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
                onClick={() => setShowShare(true)}
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
    </>
  );
}
