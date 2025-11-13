import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Filter, Shield } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import type { Credential } from "@shared/schema";
import { CredentialCard } from "@/components/credential-card";
import { RequestCredentialDialog } from "@/components/request-credential-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import emptyStateImage from "@assets/generated_images/Empty_credentials_state_illustration_15ea9afc.png";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function Credentials() {
  const [showRequestDialog, setShowRequestDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const { data: credentials, isLoading } = useQuery<Credential[]>({
    queryKey: ["/api/credentials"],
  });

  const filteredCredentials = credentials?.filter((cred) => {
    const matchesSearch =
      cred.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cred.issuer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cred.type.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesFilter =
      filterStatus === "all" || cred.status === filterStatus;

    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Credential Vault</h1>
          <p className="text-muted-foreground">
            Manage your verifiable credentials securely
          </p>
        </div>
        <Button
          onClick={() => setShowRequestDialog(true)}
          data-testid="button-request-credential"
        >
          <Plus className="mr-2 h-5 w-5" />
          Request Credential
        </Button>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search credentials..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
              data-testid="input-search"
            />
          </div>
          <div className="flex gap-2">
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[160px]" data-testid="select-filter">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="verified">Verified</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
                <SelectItem value="revoked">Revoked</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* Credentials Grid */}
      {isLoading ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="p-6">
              <Skeleton className="h-48 w-full" />
            </Card>
          ))}
        </div>
      ) : filteredCredentials && filteredCredentials.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-2">
          {filteredCredentials.map((credential) => (
            <CredentialCard key={credential.id} credential={credential} />
          ))}
        </div>
      ) : credentials && credentials.length === 0 ? (
        <Card className="p-16 text-center">
          <img
            src={emptyStateImage}
            alt="No credentials"
            className="h-48 w-48 mx-auto mb-6 opacity-50"
          />
          <h3 className="text-xl font-semibold mb-2">No Credentials Yet</h3>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            Request your first verifiable credential from a trusted issuer to get started.
          </p>
          <Button
            onClick={() => setShowRequestDialog(true)}
            data-testid="button-request-first"
          >
            <Plus className="mr-2 h-5 w-5" />
            Request Your First Credential
          </Button>
        </Card>
      ) : (
        <Card className="p-16 text-center">
          <Shield className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">No credentials match your search criteria.</p>
        </Card>
      )}

      <RequestCredentialDialog
        open={showRequestDialog}
        onOpenChange={setShowRequestDialog}
      />
    </div>
  );
}
