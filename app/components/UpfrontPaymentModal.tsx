import React, { useState } from "react";
import { useAccount } from "wagmi";
import { useCreativeFundingPlatform } from "@/hooks/use-creative-funding-platform";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { formatEther } from "viem";

interface UpfrontPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: {
    id: string;
    title: string;
    raised: number;
    goal: number;
    creatorAddress: string;
  };
  onSuccess?: () => void;
}

export default function UpfrontPaymentModal({
  isOpen,
  onClose,
  project,
  onSuccess,
}: UpfrontPaymentModalProps) {
  const { address } = useAccount();
  const { releaseUpfrontPayment } = useCreativeFundingPlatform();
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const isCreator = address?.toLowerCase() === project.creatorAddress.toLowerCase();
  const upfrontAmount = (project.raised * 30) / 100; // 30% of raised funds
  const platformFee = (upfrontAmount * 5) / 100; // 5% platform fee
  const creatorPayout = upfrontAmount - platformFee;

  const handleClaimUpfront = async () => {
    if (!isCreator) {
      setError("Only the project creator can claim upfront payment");
      return;
    }

    if (project.raised === 0) {
      setError("No funds raised yet");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      // Note: This requires project ID mapping from Firebase to smart contract
      // For now, we'll use a placeholder - this needs to be implemented
      const projectId = parseInt(project.id) || 1; // Placeholder
      
      await releaseUpfrontPayment(projectId);
      
      setSuccess(true);
      setTimeout(() => {
        onSuccess?.();
        onClose();
      }, 2000);
    } catch (err: any) {
      console.error("Error claiming upfront payment:", err);
      setError(err.message || "Failed to claim upfront payment");
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
              Claim Upfront Payment
            </CardTitle>
            <CardDescription>
              Claim 30% of raised funds for project: {project.title}
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4">
            {!isCreator && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Only the project creator can claim upfront payments
                </AlertDescription>
              </Alert>
            )}

            {project.raised === 0 && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  No funds raised yet. Cannot claim upfront payment.
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Total Raised:</span>
                <span className="font-semibold">{formatEther(BigInt(project.raised))} ETH</span>
              </div>
              <div className="flex justify-between">
                <span>Upfront Amount (30%):</span>
                <span className="font-semibold">{formatEther(BigInt(upfrontAmount))} ETH</span>
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
                  Upfront payment claimed successfully! You will receive {formatEther(BigInt(creatorPayout))} ETH.
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
                onClick={handleClaimUpfront}
                disabled={!isCreator || project.raised === 0 || isLoading}
                className="flex-1"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Claiming...
                  </>
                ) : (
                  "Claim Upfront Payment"
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 