"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  CTASection,
  FeaturesSection,
  ProblemSection,
  TransformationSection,
} from "@/components/landing";
import { ArrowRight04Icon, Download01Icon } from "@hugeicons/core-free-icons";
import { motion } from "motion/react";

import { Button } from "@turbo/ui/button";
import { Icon } from "@turbo/ui/icon";
import { ThemeToggle } from "@turbo/ui/theme";

const SUPPORTED_EDITORS = [
  {
    name: "VS Code",
    logo: "/editors/vscode.svg",
    url: "https://code.visualstudio.com/",
  },
  {
    name: "Cursor",
    logo: "/editors/cursor.svg",
    url: "https://cursor.sh/",
  },
  {
    name: "Antigravity",
    logo: "/editors/antigravity.svg",
    url: "https://antigravity.google.com/",
  },
  {
    name: "Windsurf",
    logo: "/editors/windsurf.svg",
    url: "https://codeium.com/windsurf",
  },
];

const Page = () => {
  const [titleNumber, setTitleNumber] = useState(0);
  const titles = useMemo(
    () => ["story.", "journey.", "purpose.", "moment."],
    [],
  );

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (titleNumber === titles.length - 1) {
        setTitleNumber(0);
      } else {
        setTitleNumber(titleNumber + 1);
      }
    }, 2000);
    return () => clearTimeout(timeoutId);
  }, [titleNumber, titles]);

  return (
    <>
      <div className="w-full">
        <div className="container mx-auto px-4">
          {/* Hero Section */}
          <div className="flex flex-col items-center justify-center gap-8 py-20 lg:py-40">
            <div>
              <Button variant="secondary" size="sm" className="gap-2">
                Focus. Flow. Impact.
              </Button>
            </div>
            <div className="flex flex-col gap-4">
              <h1 className="font-regular max-w-3xl text-center text-5xl tracking-tighter md:text-7xl">
                <span>Every session tells a</span>
                <span className="relative flex w-full justify-center overflow-hidden text-center md:pt-1 md:pb-4">
                  &nbsp;
                  {titles.map((title, index) => (
                    <motion.span
                      key={index}
                      className="text-primary absolute font-semibold"
                      initial={{ opacity: 0, y: "-100" }}
                      transition={{ type: "spring", stiffness: 50 }}
                      animate={
                        titleNumber === index
                          ? {
                              y: 0,
                              opacity: 1,
                            }
                          : {
                              y: titleNumber > index ? -150 : 150,
                              opacity: 0,
                            }
                      }
                    >
                      {title}
                    </motion.span>
                  ))}
                </span>
              </h1>

              <p className="text-muted-foreground max-w-2xl text-center text-lg leading-relaxed tracking-tight md:text-xl">
                Track your coding journey with meaningful context—not just
                hours. Smart sessions that understand your work.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button size="lg" className="gap-2" variant="outline" asChild>
                <Link
                  target="_blank"
                  href={
                    "https://marketplace.visualstudio.com/items?itemName=usmangurowa.kodo"
                  }
                >
                  Install Extension <Icon icon={Download01Icon} />
                </Link>
              </Button>
              <Button size="lg" className="gap-2" variant={"gradient"} asChild>
                <Link href={"/create-account"}>
                  Get Started <Icon icon={ArrowRight04Icon} />
                </Link>
              </Button>
            </div>
          </div>

          {/* Supported Editors Section */}
          <div className="border-border/50 flex flex-col items-center gap-8 border-t py-16">
            <p className="text-muted-foreground text-sm tracking-widest uppercase">
              Works with your favorite editors
            </p>
            <div className="flex flex-wrap justify-center gap-6 sm:gap-8 md:gap-12">
              {SUPPORTED_EDITORS.map((editor) => (
                <Link
                  key={editor.name}
                  href={editor.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex flex-col items-center gap-3 transition-opacity hover:opacity-80"
                >
                  <div className="bg-card ring-foreground/10 relative size-12 rounded-xl p-3 ring-1 transition-transform group-hover:scale-105 md:size-20">
                    <Image
                      src={editor.logo}
                      alt={editor.name}
                      fill
                      className="object-contain p-4 md:p-5 aria-[label='Windsurf']:dark:invert"
                      aria-label={editor.name}
                    />
                  </div>
                  <span className="text-muted-foreground group-hover:text-foreground text-sm transition-colors">
                    {editor.name}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* New Sections */}
      <ProblemSection />
      <FeaturesSection />
      <TransformationSection />
      <CTASection />

      <footer className="border-border/50 bg-card/30 border-t py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col items-center justify-between gap-8 md:flex-row">
            <div className="flex flex-col items-center gap-2 text-center md:items-start md:text-left">
              <span className="text-foreground text-lg font-bold tracking-tight">
                Kodo
              </span>
              <p className="text-muted-foreground text-sm">
                Focus, Flow, and Sustainable Engineering Habits.
              </p>
              <p className="text-muted-foreground mt-4 text-xs">
                © {new Date().getFullYear()} Kodo HQ. All rights reserved.
              </p>
            </div>

            <div className="flex flex-col gap-4">
              <span className="text-foreground text-center text-sm font-medium md:text-right">
                Install Extension
              </span>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Link
                  href="https://marketplace.visualstudio.com/items?itemName=usmangurowa.kodo"
                  target="_blank"
                  className="text-muted-foreground hover:text-primary text-sm transition-colors"
                >
                  VS Code Marketplace
                </Link>
                <span className="text-muted-foreground hidden sm:inline">
                  •
                </span>
                <Link
                  href="https://open-vsx.org/extension/usmangurowa/kodo"
                  target="_blank"
                  className="text-muted-foreground hover:text-primary text-sm transition-colors"
                >
                  Open VSX Registry
                </Link>
              </div>
            </div>
          </div>
        </div>
      </footer>

      <div className="fixed right-4 bottom-4 z-50">
        <ThemeToggle />
      </div>
    </>
  );
};

export default Page;
