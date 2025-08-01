"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAccount } from "wagmi";
import { getUserBackedProjects, BackedProject } from "@/lib/api";
import { ManageBackedProjectModal } from "./ManageBackedProjectModal";
import NFTUpgradeModal from "./NFTUpgradeModal";
import RefundClaimModal from "./RefundClaimModal";
import {
  Calendar,
  Clock,
  Loader2,
  AlertCircle,
  ArrowUp,
  RotateCcw,
} from "lucide-react";

export function BackedProjects() {
  const { address, isConnected } = useAccount();
  const [backedProjects, setBackedProjects] = useState<BackedProject[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Modal state
  const [selectedProject, setSelectedProject] = useState<BackedProject | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // NFT Upgrade and Refund modal states
  const [nftUpgradeModalOpen, setNftUpgradeModalOpen] = useState(false);
  const [selectedNFTProject, setSelectedNFTProject] = useState<any>(null);
  const [refundModalOpen, setRefundModalOpen] = useState(false);
  const [selectedRefundProject, setSelectedRefundProject] = useState<any>(null);

  useEffect(() => {
    const fetchBackedProjects = async () => {
      if (!isConnected || !address) {
        setBackedProjects([]);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const projects = await getUserBackedProjects(address);
        setBackedProjects(projects);
      } catch (err) {
        console.error("Error fetching backed projects:", err);
        setError("Failed to load backed projects");
      } finally {
        setIsLoading(false);
      }
    };

    fetchBackedProjects();
  }, [address, isConnected]);

  const handleManageBacking = (project: BackedProject) => {
    setSelectedProject(project);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedProject(null);
  };

  const handleModalSuccess = () => {
    // Refresh the backed projects list
    const fetchBackedProjects = async () => {
      if (!isConnected || !address) return;
      
      try {
        const projects = await getUserBackedProjects(address);
        setBackedProjects(projects);
      } catch (err) {
        console.error("Error refreshing backed projects:", err);
      }
    };
    
    fetchBackedProjects();
  };

  const handleNFTUpgrade = (project: BackedProject) => {
    setSelectedNFTProject({
      id: project.id,
      title: project.title,
      raised: project.raised,
      status: project.status,
    });
    setNftUpgradeModalOpen(true);
  };

  const handleClaimRefund = (project: BackedProject) => {
    setSelectedRefundProject({
      id: project.id,
      title: project.title,
      raised: project.raised,
      status: project.status,
      deadline: project.createdAt, // Using createdAt as deadline for now
    });
    setRefundModalOpen(true);
  };

  if (!isConnected) {
    return (
      <div className="text-center py-8">
        <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">Connect Your Wallet</h3>
        <p className="text-muted-foreground">
          Connect your wallet to view your backed projects.
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
        <p className="text-muted-foreground">Loading your backed projects...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">Error Loading Projects</h3>
        <p className="text-muted-foreground">{error}</p>
      </div>
    );
  }

  if (backedProjects.length === 0) {
    return (
      <div className="text-center py-8">
        <h3 className="text-lg font-semibold mb-2">No Backed Projects</h3>
        <p className="text-muted-foreground">
          You haven't backed any projects yet. Start exploring and supporting creators!
        </p>
      </div>
    );
  }

  const formatEth = (amount: number) => {
    return `${amount.toFixed(3)} ETH`;
  };

  const getProgressPercent = (raised: number, goal: number) => {
    return Math.min((raised / goal) * 100, 100);
  };

  const getStatusBadge = (project: BackedProject) => {
    if (project.status === "completed") {
      return { label: "Deliverable Available", variant: "default" as const };
    }
    if (project.status === "Delivered") {
      return { label: "Delivered", variant: "default" as const };
    }
    if (project.status === "live") {
      return { label: "Active", variant: "outline" as const };
    }
    if (project.status === "cancelled") {
      return { label: "Cancelled", variant: "destructive" as const };
    }
    return { label: "Refundable", variant: "outline" as const };
  };

  const getDeadlineText = (project: BackedProject) => {
    if (project.status === "completed") return "Completed";
    if (project.status === "Delivered") return "Delivered";
    if (project.status === "cancelled") return "Cancelled";
    return "Active";
  };

  return (
    <>
      <div className="space-y-4">
        {backedProjects.map((project) => {
          const progressPercent = getProgressPercent(project.raised, project.goal);
          const statusBadge = getStatusBadge(project);
          const deadlineText = getDeadlineText(project);

          return (
            <div key={project.id} className="rounded-lg border p-6 bg-card">
              <div className="flex gap-6">
                <Image
                  src={project.image}
                  alt={project.title}
                  width={96}
                  height={96}
                  className="w-24 h-24 rounded-md object-cover"
                />
                <div className="flex-1 space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-xl font-semibold">{project.title}</h3>
                      <Badge variant={statusBadge.variant}>
                        {statusBadge.label}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>by {project.creatorAddress.slice(0, 6)}...{project.creatorAddress.slice(-4)}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <span>Backed: {formatEth(project.backedAmount)} ETH</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span>Status: {deadlineText}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      <span>Progress: {progressPercent.toFixed(0)}%</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Funding Progress</span>
                      <span>{formatEth(project.raised)} / {formatEth(project.goal)}</span>
                    </div>
                    <div className="relative h-4 w-full overflow-hidden rounded-full bg-secondary">
                      <div
                        className="h-full bg-primary transition-all"
                        style={{
                          width: `${progressPercent}%`,
                        }}
                      />
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Button 
                      variant="outline"
                      onClick={() => handleManageBacking(project)}
                    >
                      Manage Backing
                    </Button>
                    {project.status === "completed" && (
                      <Button 
                        variant="default"
                        onClick={() => handleNFTUpgrade(project)}
                      >
                        <ArrowUp className="mr-2 h-4 w-4" />
                        Upgrade NFT & Claim Rewards
                      </Button>
                    )}
                    {(project.status === "live" || project.status === "draft") && (
                      <Button 
                        variant="destructive"
                        onClick={() => handleClaimRefund(project)}
                      >
                        <RotateCcw className="mr-2 h-4 w-4" />
                        Claim Refund
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Manage Backed Project Modal */}
      {selectedProject && (
        <ManageBackedProjectModal
          isOpen={isModalOpen}
          onCloseAction={handleCloseModal}
          project={{
            id: selectedProject.id,
            title: selectedProject.title,
            goal: selectedProject.goal,
            raised: selectedProject.raised,
            status: selectedProject.status,
            creatorAddress: selectedProject.creatorAddress,
            deliverable: selectedProject.deliverable,
          }}
          onSuccess={handleModalSuccess}
        />
      )}

      {/* NFT Upgrade Modal */}
      {selectedNFTProject && (
        <NFTUpgradeModal
          isOpen={nftUpgradeModalOpen}
          onClose={() => {
            setNftUpgradeModalOpen(false);
            setSelectedNFTProject(null);
          }}
          project={selectedNFTProject}
          tokenId={1} // Placeholder - this should come from NFT ownership
          contribution={selectedNFTProject.backedAmount || 0}
          onSuccess={handleModalSuccess}
        />
      )}

      {/* Refund Claim Modal */}
      {selectedRefundProject && (
        <RefundClaimModal
          isOpen={refundModalOpen}
          onClose={() => {
            setRefundModalOpen(false);
            setSelectedRefundProject(null);
          }}
          project={selectedRefundProject}
          tokenId={1} // Placeholder - this should come from NFT ownership
          contribution={selectedRefundProject.backedAmount || 0}
          onSuccess={handleModalSuccess}
        />
      )}
    </>
  );
}
