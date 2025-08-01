"use client";

import { useEffect, useState } from 'react';
import { Upload, Users, Calendar, Loader2, DollarSign, ArrowUp, RotateCcw } from 'lucide-react';
import { useAccount } from 'wagmi';
import { Project, getUserProjects, requestProjectExtension } from '@/lib/api';
import { ManageBackedProjectModal } from './ManageBackedProjectModal';
import UpfrontPaymentModal from './UpfrontPaymentModal';
import ProjectDeliveryModal from './ProjectDeliveryModal';
import RemainingFundsModal from './RemainingFundsModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const ProjectCard = ({
  image,
  title,
  ethRaised,
  thresholdPercent,
  thresholdTarget,
  deliveryDate,
  status,
  projectId,
  raised,
  goal,
  creatorAddress,
  onExtensionRequest,
  onUploadDeliverable,
  onClaimUpfront,
  onDeliverProject,
  onClaimRemaining,
}: {
  image: string;
  title: string;
  ethRaised: string;
  thresholdPercent: string;
  thresholdTarget: string;
  deliveryDate: string;
  status: string;
  projectId: string;
  raised: number;
  goal: number;
  creatorAddress: string;
  onExtensionRequest: (projectId: string) => void;
  onUploadDeliverable: (projectId: string) => void;
  onClaimUpfront: (project: any) => void;
  onDeliverProject: (project: any) => void;
  onClaimRemaining: (project: any) => void;
}) => (
  <div className="rounded-lg border overflow-hidden bg-card text-card-foreground shadow-sm">
    <div className="relative">
      <img src={image || "/placeholder.png"} alt={title} className="w-full aspect-video object-cover" />
      <div className="absolute top-2 right-2">
        <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-green-500 text-primary-foreground">
          {status}
        </div>
      </div>
    </div>
    
    <div className="p-4">
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <div className="space-y-3 mb-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">ETH Raised</span>
          <span className="font-medium">{ethRaised}</span>
        </div>
        <div className="space-y-1">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Threshold Progress</span>
            <span className="font-medium">{thresholdPercent}</span>
          </div>
          <div className="relative h-4 overflow-hidden rounded-full bg-secondary w-full">
            <div className="h-full w-full bg-primary transition-all" />
          </div>
          <div className="text-xs text-muted-foreground">{thresholdTarget}</div>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Delivery Date</span>
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            <span>{deliveryDate}</span>
          </div>
        </div>
      </div>
      <div className="space-y-2">
        <button 
          onClick={() => onUploadDeliverable(projectId)}
          className="inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 w-full"
        >
          <Upload className="mr-2 h-4 w-4" />
          Upload Deliverable
        </button>
        <button 
          onClick={() => onExtensionRequest(projectId)}
          className="inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium border bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2 w-full"
        >
          <Users className="mr-2 h-4 w-4" />
          Request Extension
        </button>
        <button 
          onClick={() => onClaimUpfront({ id: projectId, title, raised, goal, creatorAddress })}
          className="inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium border bg-green-600 text-white hover:bg-green-700 h-10 px-4 py-2 w-full"
        >
          <DollarSign className="mr-2 h-4 w-4" />
          Claim Upfront (30%)
        </button>
        <button 
          onClick={() => onDeliverProject({ id: projectId, title, status, creatorAddress })}
          className="inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium border bg-blue-600 text-white hover:bg-blue-700 h-10 px-4 py-2 w-full"
        >
          <ArrowUp className="mr-2 h-4 w-4" />
          Deliver Project
        </button>
        <button 
          onClick={() => onClaimRemaining({ id: projectId, title, raised, status, creatorAddress })}
          className="inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium border bg-purple-600 text-white hover:bg-purple-700 h-10 px-4 py-2 w-full"
        >
          <RotateCcw className="mr-2 h-4 w-4" />
          Claim Remaining (70%)
        </button>
      </div>
    </div>
  </div>
);

export const MyProjects = () => {
  const { address } = useAccount();
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  
  // Extension modal state
  const [extensionModalOpen, setExtensionModalOpen] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [extensionDays, setExtensionDays] = useState("");
  const [extensionReason, setExtensionReason] = useState("");
  const [isRequestingExtension, setIsRequestingExtension] = useState(false);

  // Manage project modal state
  const [manageModalOpen, setManageModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  // New modal states
  const [upfrontModalOpen, setUpfrontModalOpen] = useState(false);
  const [selectedUpfrontProject, setSelectedUpfrontProject] = useState<any>(null);
  const [deliveryModalOpen, setDeliveryModalOpen] = useState(false);
  const [selectedDeliveryProject, setSelectedDeliveryProject] = useState<any>(null);
  const [remainingFundsModalOpen, setRemainingFundsModalOpen] = useState(false);
  const [selectedRemainingProject, setSelectedRemainingProject] = useState<any>(null);

  useEffect(() => {
    const fetchProjects = async () => {
      if (!address) {
        setIsLoading(false);
        return;
      }

      try {
        const data = await getUserProjects(address);
        setProjects(data);
      } catch (err) {
        setError("Failed to load your projects");
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProjects();
  }, [address]);

  const handleExtensionRequest = (projectId: string) => {
    setSelectedProjectId(projectId);
    setExtensionModalOpen(true);
  };

  const handleUploadDeliverable = (projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    if (project) {
      setSelectedProject(project);
      setManageModalOpen(true);
    }
  };

  const handleClaimUpfront = (project: any) => {
    setSelectedUpfrontProject(project);
    setUpfrontModalOpen(true);
  };

  const handleDeliverProject = (project: any) => {
    setSelectedDeliveryProject(project);
    setDeliveryModalOpen(true);
  };

  const handleClaimRemaining = (project: any) => {
    setSelectedRemainingProject(project);
    setRemainingFundsModalOpen(true);
  };

  const handleSubmitExtension = async () => {
    if (!extensionDays || parseInt(extensionDays) <= 0) {
      setError("Please enter a valid number of days");
      return;
    }

    setIsRequestingExtension(true);
    setError("");

    try {
      await requestProjectExtension(selectedProjectId, {
        extensionDays: parseInt(extensionDays),
        reason: extensionReason,
      });

      // Refresh projects to get updated data
      const updatedProjects = await getUserProjects(address!);
      setProjects(updatedProjects);

      // Close modal and reset form
      setExtensionModalOpen(false);
      setExtensionDays("");
      setExtensionReason("");
      setSelectedProjectId("");
    } catch (err: any) {
      setError(err.message || "Failed to request extension");
    } finally {
      setIsRequestingExtension(false);
    }
  };

  const handleCloseExtensionModal = () => {
    setExtensionModalOpen(false);
    setExtensionDays("");
    setExtensionReason("");
    setSelectedProjectId("");
  };

  const handleCloseManageModal = () => {
    setManageModalOpen(false);
    setSelectedProject(null);
  };

  const handleManageModalSuccess = () => {
    // Refresh projects to get updated data
    const fetchProjects = async () => {
      if (!address) return;
      
      try {
        const data = await getUserProjects(address);
        setProjects(data);
      } catch (err) {
        console.error("Error refreshing projects:", err);
      }
    };
    
    fetchProjects();
  };

  if (!address) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Please connect your wallet to view your projects</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="rounded-lg border overflow-hidden bg-card text-card-foreground shadow-sm animate-pulse">
            <div className="aspect-video bg-muted" />
            <div className="p-4 space-y-4">
              <div className="h-4 bg-muted rounded w-3/4" />
              <div className="h-4 bg-muted rounded w-1/2" />
              <div className="h-4 bg-muted rounded w-2/3" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-destructive">{error}</p>
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">You haven't created any projects yet</p>
      </div>
    );
  }

  return (
    <>
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-4">My Projects ({projects.length})</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <ProjectCard
              key={project.id}
              image={project.image || "/placeholder.png"}
              title={project.title}
              ethRaised={`${project.raised} ETH`}
              thresholdPercent={`${Math.round((project.raised / project.goal) * 100)}%`}
              thresholdTarget={`${project.raised} / ${project.goal} ETH`}
              deliveryDate={new Date(project.createdAt).toLocaleDateString()}
              status={project.status}
              projectId={project.id}
              raised={project.raised}
              goal={project.goal}
              creatorAddress={project.creatorAddress}
              onExtensionRequest={handleExtensionRequest}
              onUploadDeliverable={handleUploadDeliverable}
              onClaimUpfront={handleClaimUpfront}
              onDeliverProject={handleDeliverProject}
              onClaimRemaining={handleClaimRemaining}
            />
          ))}
        </div>
      </div>

      {/* Extension Request Modal */}
      <Dialog open={extensionModalOpen} onOpenChange={setExtensionModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Request Project Extension</DialogTitle>
            <DialogDescription>
              Request additional time to complete your project delivery.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="extensionDays">Extension Days</Label>
              <Input
                id="extensionDays"
                type="number"
                min="1"
                max="365"
                placeholder="30"
                value={extensionDays}
                onChange={(e) => setExtensionDays(e.target.value)}
                disabled={isRequestingExtension}
              />
              <p className="text-xs text-muted-foreground">
                Enter the number of additional days you need (1-365)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="extensionReason">Reason for Extension</Label>
              <Textarea
                id="extensionReason"
                placeholder="Please explain why you need an extension..."
                value={extensionReason}
                onChange={(e) => setExtensionReason(e.target.value)}
                disabled={isRequestingExtension}
                rows={3}
              />
            </div>

            {error && (
              <div className="rounded-md bg-destructive/10 p-3">
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleCloseExtensionModal}
                disabled={isRequestingExtension}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleSubmitExtension}
                disabled={isRequestingExtension || !extensionDays}
                className="flex-1"
              >
                {isRequestingExtension ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Requesting...
                  </>
                ) : (
                  "Request Extension"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Manage Backed Project Modal */}
      {selectedProject && (
        <ManageBackedProjectModal
          isOpen={manageModalOpen}
          onCloseAction={handleCloseManageModal}
          project={{
            id: selectedProject.id,
            title: selectedProject.title,
            goal: selectedProject.goal,
            raised: selectedProject.raised,
            status: selectedProject.status,
            creatorAddress: selectedProject.creatorAddress,
            deliverable: selectedProject.deliverable,
          }}
          onSuccess={handleManageModalSuccess}
        />
      )}

      {/* Upfront Payment Modal */}
      {selectedUpfrontProject && (
        <UpfrontPaymentModal
          isOpen={upfrontModalOpen}
          onClose={() => {
            setUpfrontModalOpen(false);
            setSelectedUpfrontProject(null);
          }}
          project={selectedUpfrontProject}
          onSuccess={handleManageModalSuccess}
        />
      )}

      {/* Project Delivery Modal */}
      {selectedDeliveryProject && (
        <ProjectDeliveryModal
          isOpen={deliveryModalOpen}
          onClose={() => {
            setDeliveryModalOpen(false);
            setSelectedDeliveryProject(null);
          }}
          project={selectedDeliveryProject}
          onSuccess={handleManageModalSuccess}
        />
      )}

      {/* Remaining Funds Modal */}
      {selectedRemainingProject && (
        <RemainingFundsModal
          isOpen={remainingFundsModalOpen}
          onClose={() => {
            setRemainingFundsModalOpen(false);
            setSelectedRemainingProject(null);
          }}
          project={selectedRemainingProject}
          onSuccess={handleManageModalSuccess}
        />
      )}
    </>
  );
};
