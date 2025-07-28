"use client";

import { useWriteContract, useReadContract, useTransaction } from "wagmi";
import { parseEther, formatEther } from "viem";
import CrowdFundingABI from "../contracts/CrowdFunding.json";
import { CROWDFUNDING_CONTRACT_ADDRESS } from "../config";

export function useCrowdfundingContract() {
  // Get campaign details
  const getCampaign = (campaignId: number) => {
    return useReadContract({
      address: CROWDFUNDING_CONTRACT_ADDRESS as `0x${string}`,
      abi: CrowdFundingABI.abi,
      functionName: "getCampaign",
      args: [BigInt(campaignId)],
    });
  };

  // Get donation amount for a specific donor
  const getDonation = (campaignId: number, donorAddress: string) => {
    return useReadContract({
      address: CROWDFUNDING_CONTRACT_ADDRESS as `0x${string}`,
      abi: CrowdFundingABI.abi,
      functionName: "getDonation",
      args: [BigInt(campaignId), donorAddress as `0x${string}`],
    });
  };

  return {
    getCampaign,
    getDonation,
  };
}

// Hook for backing a project with ETH
export function useBackProject() {
  const { writeContractAsync, isPending: isDonating, data: donateData } = useWriteContract();
  
  const { isPending: isConfirming } = useTransaction({
    hash: donateData,
  });

  const backProject = async (campaignId: number, amountInEth: string) => {
    try {
      const amountInWei = parseEther(amountInEth);
      
      const result = await writeContractAsync({
        address: CROWDFUNDING_CONTRACT_ADDRESS as `0x${string}`,
        abi: CrowdFundingABI.abi,
        functionName: "donate",
        args: [BigInt(campaignId)],
        value: amountInWei,
      });

      return result;
    } catch (error) {
      console.error("Error backing project:", error);
      throw error;
    }
  };

  return {
    backProject,
    isDonating,
    isConfirming,
    isLoading: isDonating || isConfirming,
    transactionHash: donateData,
  };
} 