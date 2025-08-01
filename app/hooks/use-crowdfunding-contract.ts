"use client";

import { useWriteContract, useReadContract, useTransaction } from "wagmi";
import { parseEther, formatEther } from "viem";
import { roughDraftNftAbi } from "../constants/roughDraftNftAbi";
import { ROUGH_DRAFT_NFT_ADDRESS } from "../config";

export function useCrowdfundingContract() {
  // Get NFT balance for a user
  const getBalance = (address: string) => {
    return useReadContract({
      address: ROUGH_DRAFT_NFT_ADDRESS as `0x${string}`,
      abi: roughDraftNftAbi,
      functionName: "balanceOf",
      args: [address as `0x${string}`],
    });
  };

  // Get token owner
  const getTokenOwner = (tokenId: number) => {
    return useReadContract({
      address: ROUGH_DRAFT_NFT_ADDRESS as `0x${string}`,
      abi: roughDraftNftAbi,
      functionName: "ownerOf",
      args: [BigInt(tokenId)],
    });
  };

  return {
    getBalance,
    getTokenOwner,
  };
}

// Hook for backing a project with ETH using RoughDraftNFT
export function useBackProject() {
  const { writeContractAsync, isPending: isBacking, data: backData } = useWriteContract();
  
  const { isPending: isConfirming } = useTransaction({
    hash: backData,
  });

  const backProject = async (projectId: number, amountInEth: string) => {
    try {
      // For the current deployed contract, we'll mint an NFT to the backer
      // This represents backing the project
      const result = await writeContractAsync({
        address: ROUGH_DRAFT_NFT_ADDRESS as `0x${string}`,
        abi: roughDraftNftAbi,
        functionName: "mint",
        args: [projectId.toString() as `0x${string}`], // Using projectId as the recipient address
      });

      return result;
    } catch (error) {
      console.error("Error backing project:", error);
      throw error;
    }
  };

  return {
    backProject,
    isBacking,
    isConfirming,
    isLoading: isBacking || isConfirming,
    transactionHash: backData,
  };
} 