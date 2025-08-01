import React, { useState } from "react";
import { useAccount } from "wagmi";
import { useCreativeFundingPlatform } from "@/hooks/use-creative-funding-platform";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, CheckCircle, AlertCircle, DollarSign } from "lucide-react";
import { formatEther } from "viem";

interface RemainingFundsModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: {
    id: string;
    title: string;
    raised: number;
    status: string;
    deadline: string;
    creatorAddress: string;
  };
  onSuccess?: () => void;
}

export default function RemainingFundsModal({
  isOpen,
  onClose,
  project,
  onSuccess,
}: RemainingFundsModalProps) {
  const { address } = useAccount();
  const { releaseRemainingFunds } = useCreativeFundingPlatform();
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const isCreator = address?.toLowerCase() === project.creatorAddress.toLowerCase();
  const isProjectDelivered = project.status === "Delivered";
  const projectDeadline = new Date(project.deadline);
  const refundDeadline = new Date(projectDeadline.getTime() + 90 * 24 * 60 * 60 * 1000); // 90 days
  const isRefundWindowClosed = new Date() > refundDeadline;
  const remainingFunds = (project.raised * 70) / 100; // 70% of raised funds
  const platformFee = (remainingFunds * 5) / 100; // 5% platform fee
  const creatorPayout = remainingFunds - platformFee;

  const handleReleaseRemainingFunds = async () => {
    if (!isCreator) {
      setError("Only the project creator can claim remaining funds");
      return;
    }

    if (!isProjectDelivered) {
      setError("Project must be delivered before claiming remaining funds");
      return;
    }

    if (!isRefundWindowClosed) {
      setError("Refund window is still open. Wait 90 days after deadline.");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      // Note: This requires project ID mapping from Firebase to smart contract
      // For now, we'll use a placeholder - this needs to be implemented
      const projectId = parseInt(project.id) || 1; // Placeholder
      
      await releaseRemainingFunds(projectId);
      
      setSuccess(true);
      setTimeout(() => {
        onSuccess?.();
        onClose();
      }, 2000);
    } catch (err: any) {
      console.error("Error releasing remaining funds:", err);
      setError(err.message || "Failed to release remaining funds");
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
              <DollarSign className="h-5 w-5 text-green-600" />
              Claim Remaining Funds
            </CardTitle>
            <CardDescription>
              Claim remaining 70% of funds for project: {project.title}
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4">
            {!isCreator && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Only the project creator can claim remaining funds
                </AlertDescription>
              </Alert>
            )}

            {!isProjectDelivered && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Project must be delivered before claiming remaining funds
                </AlertDescription>
              </Alert>
            )}

            {!isRefundWindowClosed && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Refund window is still open. You can claim after 90 days from deadline.
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-3">
              <div className="bg-green-50 p-4 rounded-lg">
                <h4 className="font-semibold text-green-900 mb-2">Fund Details</h4>
                <div className="space-y-2 text-sm text-green-800">
                  <div className="flex justify-between">
                    <span>Total Raised:</span>
                    <span className="font-semibold">{formatEther(BigInt(project.raised))} ETH</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Remaining Funds (70%):</span>
                    <span className="font-semibold">{formatEther(BigInt(remainingFunds))} ETH</span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Platform Fee (5%):</span>
                    <span>-{formatEther(BigInt(platformFee))} ETH</span>
                  </div>
                  <div className="border-t pt-2">
                    <div className="flex justify-between font-bold text-lg">
                      <span>Your Payout:</span>
                      <span className="text-green-600">{formatEther(BigInt(creatorPayout))} ETH</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-semibold text-blue-900 mb-2">Requirements</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Project must be delivered successfully</li>
                  <li>• 90-day refund window must be closed</li>
                  <li>• All backers have had chance to claim refunds</li>
                  <li>• Platform fee (5%) will be deducted</li>
                </ul>
              </div>

              <div className="text-sm text-gray-600">
                <div className="flex justify-between">
                  <span>Project Deadline:</span>
                  <span>{projectDeadline.toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Refund Window Closes:</span>
                  <span>{refundDeadline.toLocaleDateString()}</span>
                </div>
              </div>
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
                  Remaining funds claimed successfully! You've received {formatEther(BigInt(creatorPayout))} ETH.
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
                onClick={handleReleaseRemainingFunds}
                disabled={!isCreator || !isProjectDelivered || !isRefundWindowClosed || isLoading}
                className="flex-1"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Claiming...
                  </>
                ) : (
                  <>
                    <DollarSign className="mr-2 h-4 w-4" />
                    Claim Remaining Funds
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