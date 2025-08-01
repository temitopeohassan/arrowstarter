import { useAccount, useWriteContract, useReadContract } from "wagmi";
import { CreativeFundingPlatformABI } from "../constants/creativeFundingPlatformAbi";
import { CREATIVE_FUNDING_PLATFORM_ADDRESS } from "../config";

export function useCreativeFundingPlatform() {
  const { address } = useAccount();
  const { writeContractAsync } = useWriteContract();

  // Release upfront payment (30% of raised funds)
  const releaseUpfrontPayment = async (projectId: number) => {
    if (!address) throw new Error("Wallet not connected");
    
    return writeContractAsync({
      address: CREATIVE_FUNDING_PLATFORM_ADDRESS,
      abi: CreativeFundingPlatformABI,
      functionName: "releaseUpfrontPayment",
      args: [BigInt(projectId)],
    });
  };

  // Deliver project (mark as completed)
  const deliverProject = async (projectId: number, upgradedMetadataURI: string) => {
    if (!address) throw new Error("Wallet not connected");
    
    return writeContractAsync({
      address: CREATIVE_FUNDING_PLATFORM_ADDRESS,
      abi: CreativeFundingPlatformABI,
      functionName: "deliverProject",
      args: [BigInt(projectId), upgradedMetadataURI],
    });
  };

  // Upgrade NFT and claim rewards (for backers)
  const upgradeNFTAndClaimRewards = async (tokenId: number) => {
    if (!address) throw new Error("Wallet not connected");
    
    return writeContractAsync({
      address: CREATIVE_FUNDING_PLATFORM_ADDRESS,
      abi: CreativeFundingPlatformABI,
      functionName: "upgradeNFTAndClaimRewards",
      args: [BigInt(tokenId)],
    });
  };

  // Claim refund (for backers if project fails)
  const claimRefund = async (tokenId: number) => {
    if (!address) throw new Error("Wallet not connected");
    
    return writeContractAsync({
      address: CREATIVE_FUNDING_PLATFORM_ADDRESS,
      abi: CreativeFundingPlatformABI,
      functionName: "claimRefund",
      args: [BigInt(tokenId)],
    });
  };

  // Release remaining funds (for creators after delivery)
  const releaseRemainingFunds = async (projectId: number) => {
    if (!address) throw new Error("Wallet not connected");
    
    return writeContractAsync({
      address: CREATIVE_FUNDING_PLATFORM_ADDRESS,
      abi: CreativeFundingPlatformABI,
      functionName: "releaseRemainingFunds",
      args: [BigInt(projectId)],
    });
  };

  return {
    releaseUpfrontPayment,
    deliverProject,
    upgradeNFTAndClaimRewards,
    claimRefund,
    releaseRemainingFunds,
  };
}

// Hook for reading project status
export function useProjectStatus(projectId: number) {
  const { data: projectStatus, isLoading, error } = useReadContract({
    address: CREATIVE_FUNDING_PLATFORM_ADDRESS,
    abi: CreativeFundingPlatformABI,
    functionName: "getProjectStatus",
    args: [BigInt(projectId)],
  });

  return { projectStatus, isLoading, error };
}

// Hook for calculating backer share
export function useBackerShare(projectId: number, backerAddress: string) {
  const { data: backerShare, isLoading, error } = useReadContract({
    address: CREATIVE_FUNDING_PLATFORM_ADDRESS,
    abi: CreativeFundingPlatformABI,
    functionName: "calculateBackerShare",
    args: [BigInt(projectId), backerAddress as `0x${string}`],
  });

  return { backerShare, isLoading, error };
} 