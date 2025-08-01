"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Wallet, AlertCircle, CheckCircle } from "lucide-react";
import { useAccount, useDisconnect } from "wagmi";
import { useBackProject } from "@/hooks/use-crowdfunding-contract";
import { useNFTMinting } from "@/hooks/use-nft-minting";
import { backProject } from "@/lib/api";

interface BackProjectModalProps {
  isOpen: boolean;
  onCloseAction: () => void;
  project: {
    id: string;
    title: string;
    goal: number;
    raised: number;
  };
  onSuccess?: () => void;
}

export function BackProjectModal({
  isOpen,
  onCloseAction,
  project,
  onSuccess,
}: BackProjectModalProps) {
  const [amount, setAmount] = useState("");
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [step, setStep] = useState<"back" | "mint" | "success">("back");

  // Web3 hooks
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();

  // Contract hooks
  const { backProject: backProjectContract, isLoading: isBacking, transactionHash: backingTxHash } = useBackProject();
  const { mintNFT, isLoading: isMinting, transactionHash: mintingTxHash } = useNFTMinting();

  const handleBackProject = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!amount) {
      setError("Please enter an amount");
      return;
    }

    const amountNumber = parseFloat(amount);
    if (isNaN(amountNumber) || amountNumber <= 0) {
      setError("Please enter a valid amount");
      return;
    }

    if (amountNumber < 0.0001) {
      setError("Minimum contribution is 0.0001 ETH");
      return;
    }

    setError("");
    setSuccessMessage("");

    try {
      // Step 1: Back the project on-chain
      setSuccessMessage("Backing project on blockchain...");
      await backProjectContract(parseInt(project.id), amount);
      
      // Step 2: Update backend
      setSuccessMessage("Updating project data...");
      await backProject(project.id, {
        amount: amountNumber,
        backerAddress: address!,
      });

      // Step 3: Mint NFT for the backer
      setSuccessMessage("Minting your NFT...");
      setStep("mint");
      await mintNFT(address!);

      // Success!
      setStep("success");
      setSuccessMessage("Project backed successfully! You received an NFT.");
      
      // Reset form
      setAmount("");
      
      // Call success callback
      if (onSuccess) {
        onSuccess();
      }

      // Close modal after delay
      setTimeout(() => {
        onCloseAction();
        setStep("back");
        setSuccessMessage("");
      }, 3000);

    } catch (err: any) {
      console.error("Error backing project:", err);
      setError(err.message || "Failed to back project. Please try again.");
      setSuccessMessage("");
    }
  };

  const handleClose = () => {
    if (!isBacking && !isMinting) {
      setAmount("");
      setError("");
      setSuccessMessage("");
      setStep("back");
      onCloseAction();
    }
  };

  const remainingAmount = project.goal - project.raised;
  const progressPercentage = Math.min((project.raised / project.goal) * 100, 100);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Back This Project
          </DialogTitle>
          <DialogDescription>
            Support "{project.title}" by contributing to their funding goal.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Project Progress */}
          <div className="rounded-lg border p-4 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Current Progress</span>
              <span className="font-medium">{progressPercentage.toFixed(1)}%</span>
            </div>
            <div className="relative h-2 w-full overflow-hidden rounded-full bg-secondary">
              <div
                className="h-full bg-primary transition-all"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{project.raised} ETH raised</span>
              <span>{remainingAmount.toFixed(4)} ETH remaining</span>
            </div>
          </div>

          {/* Back Project Form */}
          {step === "back" && isConnected && (
            <form onSubmit={handleBackProject} className="space-y-4">
              {/* Connected Wallet Info */}
              <div className="rounded-lg border p-3 bg-muted/50">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Connected Wallet</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => disconnect()}
                    className="text-xs"
                  >
                    Disconnect
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {address?.slice(0, 6)}...{address?.slice(-4)}
                </p>
              </div>

              {/* Amount Input */}
              <div className="space-y-2">
                <Label htmlFor="amount">Amount to Back (ETH)</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.0001"
                  min="0.0001"
                  placeholder="0.1"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  disabled={isBacking}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Minimum contribution: 0.0001 ETH
                </p>
              </div>

              {/* Error Message */}
              {error && (
                <div className="rounded-md bg-destructive/10 p-3">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-destructive" />
                    <p className="text-sm text-destructive">{error}</p>
                  </div>
                </div>
              )}

              {/* Success Message */}
              {successMessage && (
                <div className="rounded-md bg-green-50 p-3 border border-green-200">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <p className="text-sm text-green-800">{successMessage}</p>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  disabled={isBacking}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isBacking || !amount}
                  className="flex-1"
                >
                  {isBacking ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Backing...
                    </>
                  ) : (
                    `Back with ${amount || "0"} ETH`
                  )}
                </Button>
              </div>
            </form>
          )}

          {/* Step 2: Minting NFT */}
          {step === "mint" && (
            <div className="text-center space-y-4">
              <div className="animate-pulse">
                <Wallet className="h-12 w-12 mx-auto mb-4 text-primary" />
                <h3 className="text-lg font-semibold mb-2">Minting Your NFT</h3>
                <p className="text-sm text-muted-foreground">
                  Creating your unique NFT as proof of backing...
                </p>
              </div>
              
              {mintingTxHash && (
                <div className="text-xs text-muted-foreground">
                  Transaction: {mintingTxHash.slice(0, 10)}...{mintingTxHash.slice(-8)}
                </div>
              )}
            </div>
          )}

          {/* Step 3: Success */}
          {step === "success" && (
            <div className="text-center space-y-4">
              <CheckCircle className="h-12 w-12 mx-auto text-green-600" />
              <h3 className="text-lg font-semibold text-green-800">Success!</h3>
              <p className="text-sm text-muted-foreground">
                You've successfully backed "{project.title}" and received an NFT!
              </p>
              
              {backingTxHash && (
                <div className="text-xs text-muted-foreground">
                  Backing TX: {backingTxHash.slice(0, 10)}...{backingTxHash.slice(-8)}
                </div>
              )}
              
              {mintingTxHash && (
                <div className="text-xs text-muted-foreground">
                  NFT TX: {mintingTxHash.slice(0, 10)}...{mintingTxHash.slice(-8)}
                </div>
              )}
            </div>
          )}

          {/* Disclaimer */}
          <div className="rounded-md bg-muted/50 p-3">
            <p className="text-xs text-muted-foreground">
              <strong>Note:</strong> This transaction will be recorded on the blockchain. 
              Make sure you have enough ETH in your wallet to cover the contribution and gas fees.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}