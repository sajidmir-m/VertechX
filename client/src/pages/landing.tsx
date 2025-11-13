import { Link } from "wouter";
import { Shield, Fingerprint, FileCheck, Network, CheckCircle, Lock, Key, Database } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import heroImage from "@assets/generated_images/Hero_blockchain_vault_illustration_6f406574.png";
import didIcon from "@assets/generated_images/DID_feature_icon_80ba7929.png";
import vcIcon from "@assets/generated_images/Verifiable_credential_icon_cc5dc0fb.png";
import ipfsIcon from "@assets/generated_images/IPFS_network_icon_d66c4c9c.png";

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div
          className="absolute inset-0 z-0 opacity-10"
          style={{
            backgroundImage: `url(${heroImage})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-background/95 to-background/80" />
        </div>
        
        <div className="relative z-10 mx-auto max-w-7xl px-6 py-24 sm:py-32 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-2" data-testid="badge-blockchain-powered">
              <Shield className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-primary">Blockchain-Powered Identity</span>
            </div>
            
            <h1 className="text-4xl font-bold tracking-tight sm:text-6xl mb-6" data-testid="heading-hero">
              Your Identity,{" "}
              <span className="text-primary">Your Control</span>
            </h1>
            
            <p className="text-lg leading-8 text-muted-foreground mb-10 max-w-2xl mx-auto" data-testid="text-hero-description">
              Decentralized digital identity vault for secure, private, and self-sovereign data ownership. 
              Manage your credentials with blockchain-based DIDs and verifiable credentials.
            </p>
            
            <div className="flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center sm:gap-4">
              <Link href="/login?redirect=/wallet">
                <Button size="lg" className="h-12 w-full px-8 sm:w-auto" data-testid="button-create-wallet">
                  <Key className="mr-2 h-5 w-5" />
                  Create Your Wallet
                </Button>
              </Link>
              <Link href="/verify">
                <Button
                  variant="outline"
                  size="lg"
                  className="h-12 w-full px-8 sm:w-auto"
                  data-testid="button-verify"
                >
                  <CheckCircle className="mr-2 h-5 w-5" />
                  Verify Credentials
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
              Built on Web3 Standards
            </h2>
            <p className="text-lg text-muted-foreground">
              Industry-leading technology for secure identity management
            </p>
          </div>

          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            <Card className="p-8 hover-elevate" data-testid="card-feature-did">
              <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-xl bg-primary/10">
                <img src={didIcon} alt="DID" className="h-12 w-12" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Decentralized Identifiers</h3>
              <p className="text-muted-foreground">
                Create unique, blockchain-anchored digital identities that you fully control. 
                No central authority required.
              </p>
            </Card>

            <Card className="p-8 hover-elevate" data-testid="card-feature-vc">
              <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-xl bg-primary/10">
                <img src={vcIcon} alt="Verifiable Credentials" className="h-12 w-12" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Verifiable Credentials</h3>
              <p className="text-muted-foreground">
                Store and share tamper-proof credentials with cryptographic verification. 
                Trusted by institutions globally.
              </p>
            </Card>

            <Card className="p-8 hover-elevate" data-testid="card-feature-ipfs">
              <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-xl bg-primary/10">
                <img src={ipfsIcon} alt="IPFS" className="h-12 w-12" />
              </div>
              <h3 className="text-xl font-semibold mb-3">IPFS Storage</h3>
              <p className="text-muted-foreground">
                Decentralized file storage ensures your credentials are permanent, 
                transparent, and censorship-resistant.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 sm:py-32 bg-muted/30">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
              How It Works
            </h2>
            <p className="text-lg text-muted-foreground">
              Four simple steps to complete digital identity sovereignty
            </p>
          </div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: Key, title: "Create DID", desc: "Generate your unique decentralized identifier with cryptographic keys" },
              { icon: FileCheck, title: "Receive Credentials", desc: "Get verifiable credentials from trusted issuers and institutions" },
              { icon: Lock, title: "Secure Storage", desc: "Store credentials encrypted on IPFS with blockchain anchoring" },
              { icon: Shield, title: "Share Selectively", desc: "Share only necessary proofs without exposing full documents" },
            ].map((step, idx) => (
              <div key={idx} className="relative" data-testid={`step-${idx + 1}`}>
                <div className="flex flex-col items-center text-center">
                  <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-2xl">
                    {idx + 1}
                  </div>
                  <step.icon className="h-8 w-8 text-primary mb-3" />
                  <h3 className="text-lg font-semibold mb-2">{step.title}</h3>
                  <p className="text-sm text-muted-foreground">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust Indicators */}
      <section className="py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center mb-12">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
              Built on Trusted Standards
            </h2>
            <p className="text-lg text-muted-foreground">
              Compliant with W3C and blockchain industry specifications
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-8">
            {["W3C DID", "Verifiable Credentials", "IPFS Protocol", "Ethereum"].map((standard) => (
              <div
                key={standard}
                className="rounded-lg border bg-card px-8 py-4 text-center"
                data-testid={`standard-${standard.toLowerCase().replace(/\s+/g, '-')}`}
              >
                <span className="font-mono text-sm font-medium">{standard}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 sm:py-32 bg-primary/5">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-6">
              Ready to Own Your Identity?
            </h2>
            <p className="text-lg text-muted-foreground mb-10">
              Join the decentralized identity revolution. Create your wallet in seconds.
            </p>
            <Link href="/login?redirect=/wallet">
              <Button size="lg" className="h-12 px-8" data-testid="button-get-started">
                <Key className="mr-2 h-5 w-5" />
                Get Started Now
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
