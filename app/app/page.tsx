"use client";

import Link from "next/link";
import { ArrowRight, Film, Book, Music } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Projects } from "@/components/projects";
import { HeroFeatured } from "@/components/hero-featured";
import { sdk } from "@farcaster/frame-sdk";
import { useFarcasterAutoConnect } from "@/hooks/use-farcaster-auto-connect";

export default function Home() {
  // Use the auto-connect hook
  const { isConnected, address, isInitialized, isInFrame } = useFarcasterAutoConnect();

  const handleAddMiniApp = async () => {
    try {
      await sdk.actions.addMiniApp();
      console.log("Mini app added successfully");
    } catch (error) {
      console.error("Failed to add mini app:", error);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Hero Section */}
      <HeroFeatured />

      {/* Featured Projects */}
      <section className="mb-16 mt-12">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold">Projects</h2>
          <Button variant="ghost" asChild>
            <Link href="/projects">View all projects</Link>
          </Button>
        </div>
        <Projects />
      </section>
    </div>
  );
}
