import React, { useState } from "react";
import { useAccount } from "wagmi";
import { useCreativeFundingPlatform } from "@/hooks/use-creative-funding-platform";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, CheckCircle, AlertCircle, Upload } from "lucide-react";

interface ProjectDeliveryModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: {
    id: string;
    title: string;
    description: string;
    creatorAddress: string;
    status: string;
  };
  onSuccess?: () => void;
}

export default function ProjectDeliveryModal({
  isOpen,
  onClose,
  project,
  onSuccess,
}: ProjectDeliveryModalProps) {
  const { address } = useAccount();
  const { deliverProject } = useCreativeFundingPlatform();
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [upgradedMetadataURI, setUpgradedMetadataURI] = useState("");

  const isCreator = address?.toLowerCase() === project.creatorAddress.toLowerCase();
  const isAlreadyDelivered = project.status === "Delivered";

  const handleDeliverProject = async () => {
    if (!isCreator) {
      setError("Only the project creator can deliver the project");
      return;
    }

    if (isAlreadyDelivered) {
      setError("Project has already been delivered");
      return;
    }

    if (!upgradedMetadataURI.trim()) {
      setError("Please provide the upgraded metadata URI");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      // Note: This requires project ID mapping from Firebase to smart contract
      // For now, we'll use a placeholder - this needs to be implemented
      const projectId = parseInt(project.id) || 1; // Placeholder
      
      await deliverProject(projectId, upgradedMetadataURI);
      
      setSuccess(true);
      setTimeout(() => {
        onSuccess?.();
        onClose();
      }, 2000);
    } catch (err: any) {
      console.error("Error delivering project:", err);
      setError(err.message || "Failed to deliver project");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Deliver Project
            </CardTitle>
            <CardDescription>
              Mark project as delivered: {project.title}
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4">
            {!isCreator && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Only the project creator can deliver the project
                </AlertDescription>
              </Alert>
            )}

            {isAlreadyDelivered && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  This project has already been delivered
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="metadata-uri">Upgraded Metadata URI</Label>
              <Input
                id="metadata-uri"
                placeholder="ipfs://Qm..."
                value={upgradedMetadataURI}
                onChange={(e) => setUpgradedMetadataURI(e.target.value)}
                disabled={!isCreator || isAlreadyDelivered}
              />
              <p className="text-sm text-gray-600">
                Provide the IPFS URI for the upgraded project metadata (final deliverables, images, etc.)
              </p>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-semibold text-blue-900 mb-2">What happens when you deliver?</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Project will be marked as delivered</li>
                <li>• Backers can upgrade their RoughDraftNFTs to UpgradedNFTs</li>
                <li>• Backers can claim their share of remaining funds (70%)</li>
                <li>• Backers will receive ARROW token rewards</li>
                <li>• You can claim remaining funds after 90-day refund window</li>
              </ul>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  Project delivered successfully! Backers can now upgrade their NFTs and claim rewards.
                </AlertDescription>
              </Alert>
            )}

            <div className="flex gap-2 pt-4">
              <Button
                variant="outline"
                onClick={onClose}
                disabled={isLoading}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleDeliverProject}
                disabled={!isCreator || isAlreadyDelivered || isLoading || !upgradedMetadataURI.trim()}
                className="flex-1"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Delivering...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Deliver Project
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 