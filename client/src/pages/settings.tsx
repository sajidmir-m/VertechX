import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Settings as SettingsIcon, Shield, Bell, Download, Trash2 } from "lucide-react";
import { Label } from "@/components/ui/label";

export default function Settings() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Settings</h1>
        <p className="text-muted-foreground">
          Manage your identity vault preferences and security settings
        </p>
      </div>

      {/* Security Settings */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <Shield className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold">Security & Privacy</h3>
            <p className="text-xs text-muted-foreground">Configure security preferences</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between py-3 border-b">
            <div className="space-y-0.5">
              <Label htmlFor="auto-lock">Auto-lock Wallet</Label>
              <p className="text-xs text-muted-foreground">
                Automatically lock after 15 minutes of inactivity
              </p>
            </div>
            <Switch id="auto-lock" defaultChecked data-testid="switch-auto-lock" />
          </div>

          <div className="flex items-center justify-between py-3 border-b">
            <div className="space-y-0.5">
              <Label htmlFor="biometric">Biometric Authentication</Label>
              <p className="text-xs text-muted-foreground">
                Use fingerprint or face ID to unlock
              </p>
            </div>
            <Switch id="biometric" data-testid="switch-biometric" />
          </div>

          <div className="flex items-center justify-between py-3 border-b">
            <div className="space-y-0.5">
              <Label htmlFor="backup">Automatic Backup</Label>
              <p className="text-xs text-muted-foreground">
                Backup encrypted keys to IPFS
              </p>
            </div>
            <Switch id="backup" defaultChecked data-testid="switch-backup" />
          </div>
        </div>
      </Card>

      {/* Notifications */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <Bell className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold">Notifications</h3>
            <p className="text-xs text-muted-foreground">Manage notification preferences</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between py-3 border-b">
            <div className="space-y-0.5">
              <Label htmlFor="credential-issued">New Credentials</Label>
              <p className="text-xs text-muted-foreground">
                Notify when you receive new credentials
              </p>
            </div>
            <Switch id="credential-issued" defaultChecked data-testid="switch-new-credentials" />
          </div>

          <div className="flex items-center justify-between py-3 border-b">
            <div className="space-y-0.5">
              <Label htmlFor="verification">Verification Requests</Label>
              <p className="text-xs text-muted-foreground">
                Alert on credential verification attempts
              </p>
            </div>
            <Switch id="verification" defaultChecked data-testid="switch-verification" />
          </div>

          <div className="flex items-center justify-between py-3 border-b">
            <div className="space-y-0.5">
              <Label htmlFor="expiring">Expiring Credentials</Label>
              <p className="text-xs text-muted-foreground">
                Warn before credentials expire
              </p>
            </div>
            <Switch id="expiring" defaultChecked data-testid="switch-expiring" />
          </div>
        </div>
      </Card>

      {/* Data Management */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <Download className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold">Data Management</h3>
            <p className="text-xs text-muted-foreground">Export or delete your data</p>
          </div>
        </div>

        <div className="space-y-3">
          <Button variant="outline" className="w-full justify-start" data-testid="button-export-data">
            <Download className="mr-2 h-4 w-4" />
            Export All Data
          </Button>
          <Button
            variant="outline"
            className="w-full justify-start text-destructive hover:bg-destructive hover:text-destructive-foreground"
            data-testid="button-delete-account"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete Account
          </Button>
        </div>
      </Card>

      {/* Network Info */}
      <Card className="p-6 bg-muted/30">
        <h3 className="font-semibold mb-4">Network Information</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-sm text-muted-foreground mb-1">Network</p>
            <Badge variant="outline">Ethereum Mainnet</Badge>
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-1">DID Method</p>
            <Badge variant="outline">did:key</Badge>
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-1">IPFS Gateway</p>
            <p className="text-sm font-mono">ipfs.io</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-1">Version</p>
            <p className="text-sm font-mono">v1.0.0</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
