import React, { useState } from "react";
import { useAccount } from "wagmi";
import { useCreativeFundingPlatform } from "@/hooks/use-creative-funding-platform";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, CheckCircle, AlertCircle, ArrowUp, Coins } from "lucide-react";
import { formatEther } from "viem";

interface NFTUpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: {
    id: string;
    title: string;
    raised: number;
    status: string;
  };
  tokenId: number;
  contribution: number;
  onSuccess?: () => void;
}

export default function NFTUpgradeModal({
  isOpen,
  onClose,
  project,
  tokenId,
  contribution,
  onSuccess,
}: NFTUpgradeModalProps) {
  const { address } = useAccount();
  const { upgradeNFTAndClaimRewards } = useCreativeFundingPlatform();
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const isProjectDelivered = project.status === "Delivered";
  const sharePercentage = project.raised > 0 ? (contribution * 100) / project.raised : 0;
  const remainingFunds = (project.raised * 70) / 100; // 70% of raised funds
  const estimatedPayout = (remainingFunds * sharePercentage) / 100;
  const arrowReward = (contribution * 1000) / 1; // 1000 ARROW per ETH (simplified)

  const handleUpgradeNFT = async () => {
    if (!address) {
      setError("Please connect your wallet");
      return;
    }

    if (!isProjectDelivered) {
      setError("Project has not been delivered yet");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      await upgradeNFTAndClaimRewards(tokenId);
      
      setSuccess(true);
      setTimeout(() => {
        onSuccess?.();
        onClose();
      }, 2000);
    } catch (err: any) {
      console.error("Error upgrading NFT:", err);
      setError(err.message || "Failed to upgrade NFT and claim rewards");
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
              <ArrowUp className="h-5 w-5 text-blue-600" />
              Upgrade NFT & Claim Rewards
            </CardTitle>
            <CardDescription>
              Upgrade your RoughDraftNFT to UpgradedNFT for project: {project.title}
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4">
            {!isProjectDelivered && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Project has not been delivered yet. You can upgrade once the creator delivers the project.
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-3">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-semibold text-blue-900 mb-2">Your Rewards</h4>
                <div className="space-y-2 text-sm text-blue-800">
                  <div className="flex justify-between">
                    <span>Your Contribution:</span>
                    <span className="font-semibold">{formatEther(BigInt(contribution))} ETH</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Share of Project:</span>
                    <span className="font-semibold">{sharePercentage.toFixed(2)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Estimated Payout:</span>
                    <span className="font-semibold">{formatEther(BigInt(estimatedPayout))} ETH</span>
                  </div>
                  <div className="flex justify-between">
                    <span>ARROW Tokens:</span>
                    <span className="font-semibold">{arrowReward.toLocaleString()} ARROW</span>
                  </div>
                </div>
              </div>

              <div className="bg-green-50 p-4 rounded-lg">
                <h4 className="font-semibold text-green-900 mb-2">What you'll receive</h4>
                <ul className="text-sm text-green-800 space-y-1">
                  <li>• UpgradedNFT (proof of successful backing)</li>
                  <li>• Your share of remaining funds (70% of total raised)</li>
                  <li>• ARROW token rewards (vested over 1 year)</li>
                  <li>• Access to project deliverables</li>
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
                  NFT upgraded successfully! You've received your rewards and ARROW tokens.
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
                onClick={handleUpgradeNFT}
                disabled={!isProjectDelivered || isLoading}
                className="flex-1"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Upgrading...
                  </>
                ) : (
                  <>
                    <Coins className="mr-2 h-4 w-4" />
                    Upgrade & Claim
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