import React, { useState } from "react";
import { useAccount } from "wagmi";
import { useCreativeFundingPlatform } from "@/hooks/use-creative-funding-platform";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, CheckCircle, AlertCircle, RotateCcw } from "lucide-react";
import { formatEther } from "viem";

interface RefundClaimModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: {
    id: string;
    title: string;
    raised: number;
    status: string;
    deadline: string;
  };
  tokenId: number;
  contribution: number;
  onSuccess?: () => void;
}

export default function RefundClaimModal({
  isOpen,
  onClose,
  project,
  tokenId,
  contribution,
  onSuccess,
}: RefundClaimModalProps) {
  const { address } = useAccount();
  const { claimRefund } = useCreativeFundingPlatform();
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const isProjectDelivered = project.status === "Delivered";
  const projectDeadline = new Date(project.deadline);
  const refundDeadline = new Date(projectDeadline.getTime() + 90 * 24 * 60 * 60 * 1000); // 90 days
  const isRefundExpired = new Date() > refundDeadline;
  const refundAmount = (contribution * 70) / 100; // 70% of contribution

  const handleClaimRefund = async () => {
    if (!address) {
      setError("Please connect your wallet");
      return;
    }

    if (isProjectDelivered) {
      setError("Cannot claim refund for delivered projects");
      return;
    }

    if (isRefundExpired) {
      setError("Refund window has expired (90 days after deadline)");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      await claimRefund(tokenId);
      
      setSuccess(true);
      setTimeout(() => {
        onSuccess?.();
        onClose();
      }, 2000);
    } catch (err: any) {
      console.error("Error claiming refund:", err);
      setError(err.message || "Failed to claim refund");
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
              <RotateCcw className="h-5 w-5 text-orange-600" />
              Claim Refund
            </CardTitle>
            <CardDescription>
              Claim refund for project: {project.title}
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4">
            {isProjectDelivered && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Cannot claim refund for delivered projects. You should upgrade your NFT instead.
                </AlertDescription>
              </Alert>
            )}

            {isRefundExpired && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Refund window has expired. You can no longer claim a refund for this project.
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-3">
              <div className="bg-orange-50 p-4 rounded-lg">
                <h4 className="font-semibold text-orange-900 mb-2">Refund Details</h4>
                <div className="space-y-2 text-sm text-orange-800">
                  <div className="flex justify-between">
                    <span>Your Contribution:</span>
                    <span className="font-semibold">{formatEther(BigInt(contribution))} ETH</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Refund Amount (70%):</span>
                    <span className="font-semibold">{formatEther(BigInt(refundAmount))} ETH</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Project Deadline:</span>
                    <span className="font-semibold">{projectDeadline.toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Refund Deadline:</span>
                    <span className="font-semibold">{refundDeadline.toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              <div className="bg-yellow-50 p-4 rounded-lg">
                <h4 className="font-semibold text-yellow-900 mb-2">Important Notes</h4>
                <ul className="text-sm text-yellow-800 space-y-1">
                  <li>• You can only claim refund if project is not delivered</li>
                  <li>• Refund window is 90 days after project deadline</li>
                  <li>• You'll receive 70% of your original contribution</li>
                  <li>• Your NFT will be marked as "refunded"</li>
                  <li>• You cannot upgrade to UpgradedNFT after refund</li>
                </ul>
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
                  Refund claimed successfully! You've received {formatEther(BigInt(refundAmount))} ETH.
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
                onClick={handleClaimRefund}
                disabled={isProjectDelivered || isRefundExpired || isLoading}
                variant="destructive"
                className="flex-1"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Claiming...
                  </>
                ) : (
                  <>
                    <RotateCcw className="mr-2 h-4 w-4" />
                    Claim Refund
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