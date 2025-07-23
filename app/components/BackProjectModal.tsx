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
import { Loader2, Wallet } from "lucide-react";
import { API_BASE_URL } from "../app/config";

interface BackProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: {
    id: string;
    title: string;
    goal: number;
    raised: number;
  };
  onSuccess?: () => void; // Callback for successful backing
}

export function BackProjectModal({
  isOpen,
  onClose,
  project,
  onSuccess,
}: BackProjectModalProps) {
  const [amount, setAmount] = useState("");
  const [backerAddress, setBackerAddress] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!amount || !backerAddress) {
      setError("Please fill in all fields");
      return;
    }

    const amountNumber = parseFloat(amount);
    if (isNaN(amountNumber) || amountNumber <= 0) {
      setError("Please enter a valid amount");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/projects/${project.id}/back`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            amount: amountNumber,
            backerAddress,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to back project");
      }

      // Success - reset form and close modal
      setAmount("");
      setBackerAddress("");
      onClose();
      
      // Call success callback if provided
      if (onSuccess) {
        onSuccess();
      }
    } catch (err: any) {
      console.error("Error backing project:", err);
      setError(err.message || "Failed to back project. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setAmount("");
      setBackerAddress("");
      setError("");
      onClose();
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

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Backer Address */}
            <div className="space-y-2">
              <Label htmlFor="backerAddress">Your Wallet Address</Label>
              <Input
                id="backerAddress"
                type="text"
                placeholder="0x..."
                value={backerAddress}
                onChange={(e) => setBackerAddress(e.target.value)}
                disabled={isSubmitting}
                required
              />
            </div>

            {/* Amount */}
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
                disabled={isSubmitting}
                required
              />
              <p className="text-xs text-muted-foreground">
                Minimum contribution: 0.0001 ETH
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="rounded-md bg-destructive/10 p-3">
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isSubmitting}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="flex-1"
              >
                {isSubmitting ? (
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

          {/* Disclaimer */}
          <div className="rounded-md bg-muted/50 p-3">
            <p className="text-xs text-muted-foreground">
              <strong>Note:</strong> This is a demo interface. In a real application, 
              this would integrate with a Web3 wallet like MetaMask for secure transactions.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}