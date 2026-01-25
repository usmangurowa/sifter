"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft01Icon,
  CheckmarkCircle02Icon,
  Copy01Icon,
} from "@hugeicons/core-free-icons";

import { Button } from "@turbo/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@turbo/ui/card";
import { Icon } from "@turbo/ui/icon";
import { Kbd } from "@turbo/ui/kbd";
import { ThemeToggle } from "@turbo/ui/theme";

const CodeBlock = ({ code }: { code: string }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    void navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-muted flex items-center justify-between rounded-lg px-4 py-3 font-mono text-sm">
      <code>{code}</code>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleCopy}
        className="h-8 w-8 p-0"
      >
        <Icon icon={copied ? CheckmarkCircle02Icon : Copy01Icon} />
      </Button>
    </div>
  );
};

const EXTENSION_LINKS = [
  {
    name: "VS Code Marketplace",
    url: "https://marketplace.visualstudio.com/items?itemName=usmangurowa.kodo",
  },
  {
    name: "Open VSX Registry",
    url: "https://open-vsx.org/extension/usmangurowa/kodo",
  },
];

const INSTALLATION_STEPS = [
  {
    title: "Install the Extension",
    description:
      "Download and install the Kodo extension for your favorite editor.",
    content: (
      <div className="space-y-4">
        <p className="text-muted-foreground text-sm">
          Search for <strong>&quot;Kodo&quot;</strong> in your editor&apos;s
          extension marketplace, or use one of the links below:
        </p>
        <div className="flex flex-wrap gap-3">
          {EXTENSION_LINKS.map((link) => (
            <Button key={link.name} variant="outline" size="sm" asChild>
              <Link href={link.url} target="_blank" rel="noopener noreferrer">
                {link.name}
              </Link>
            </Button>
          ))}
        </div>
        <p className="text-muted-foreground text-sm">
          Works with VS Code, Cursor, Antigravity, Windsurf, and other VS
          Code-compatible editors.
        </p>
      </div>
    ),
  },
  {
    title: "Generate Your API Key",
    description: "Create an API key to connect your editor to Kodo.",
    content: (
      <div className="space-y-4">
        <p className="text-muted-foreground text-sm">
          Go to your{" "}
          <Link href="/dashboard" className="text-primary underline">
            Dashboard
          </Link>{" "}
          and click &quot;Generate API Key&quot; to create a new key. Copy the
          key — you&apos;ll need it in the next step.
        </p>
        <div className="bg-muted/50 rounded-lg p-4">
          <p className="text-muted-foreground text-sm">
            <strong>Important:</strong> Your API key will only be shown once.
            Store it somewhere safe!
          </p>
        </div>
      </div>
    ),
  },
  {
    title: "Configure the Extension",
    description: "Add your API key to the Kodo extension settings.",
    content: (
      <div className="space-y-4">
        <ol className="text-muted-foreground list-inside list-decimal space-y-3 text-sm">
          <li className="flex flex-wrap items-center gap-1">
            <span>Open the command palette with</span>
            <Kbd>⌘</Kbd>
            <Kbd>Shift</Kbd>
            <Kbd>P</Kbd>
            <span className="text-muted-foreground/70">(Mac)</span>
            <span>or</span>
            <Kbd>Ctrl</Kbd>
            <Kbd>Shift</Kbd>
            <Kbd>P</Kbd>
            <span className="text-muted-foreground/70">(Windows/Linux)</span>
          </li>
          <li>
            Search for:
            <div className="mt-2">
              <CodeBlock code="Kodo: Set API Key" />
            </div>
          </li>
          <li>Paste your API key when prompted</li>
        </ol>
        <p className="text-muted-foreground text-sm">
          The extension will validate and save your key automatically.
        </p>
      </div>
    ),
  },
  {
    title: "Start Coding!",
    description: "You're all set. Start coding and watch your stats grow.",
    content: (
      <div className="space-y-4">
        <p className="text-muted-foreground text-sm">
          Once configured, Kodo will automatically track your coding sessions in
          the background. You&apos;ll see:
        </p>
        <ul className="text-muted-foreground list-inside list-disc space-y-1 text-sm">
          <li>Real-time coding time in the status bar</li>
          <li>Session tracking with flow state detection</li>
          <li>Heartbeats synced to your dashboard</li>
        </ul>
        <p className="text-muted-foreground text-sm">
          Check your{" "}
          <Link href="/dashboard" className="text-primary underline">
            Dashboard
          </Link>{" "}
          to see your coding activity!
        </p>
      </div>
    ),
  },
];

export default function DocsPage() {
  const router = useRouter();

  return (
    <div className="min-h-dvh">
      {/* Header */}
      <header className="border-border/50 sticky top-0 z-50 border-b backdrop-blur-sm">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="gap-2"
          >
            <Icon icon={ArrowLeft01Icon} size={18} />
            Back
          </Button>
          <ThemeToggle />
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto flex flex-1 flex-col gap-8 px-4 py-8">
        <div className="mx-auto w-full max-w-4xl text-center">
          <h1 className="text-3xl font-bold">Get Started with Kodo</h1>
          <p className="text-muted-foreground mt-2">
            Follow these steps to connect your editor and start tracking your
            coding journey.
          </p>
        </div>

        <div className="mx-auto w-full max-w-4xl space-y-6">
          {INSTALLATION_STEPS.map((step, index) => (
            <Card key={step.title}>
              <CardHeader>
                <div className="flex items-start gap-4">
                  <div className="bg-primary text-primary-foreground flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold">
                    {index + 1}
                  </div>
                  <div>
                    <CardTitle className="text-lg">{step.title}</CardTitle>
                    <CardDescription>{step.description}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pl-16">{step.content}</CardContent>
            </Card>
          ))}
        </div>

        {/* Back to Dashboard CTA */}
        <div className="mx-auto w-full max-w-4xl text-center">
          <Button asChild size="lg">
            <Link href="/dashboard">Go to Dashboard</Link>
          </Button>
        </div>
      </main>
    </div>
  );
}
