import { useWriteContract, useTransaction } from "wagmi";
import { parseEther } from "viem";
import { roughDraftNftAbi } from "../constants/roughDraftNftAbi";
import { ROUGH_DRAFT_NFT_ADDRESS } from "../config";

export function useNFTMinting() {
  const { writeContractAsync, isPending: isMinting, data: mintData } = useWriteContract();

  const { isPending: isConfirming } = useTransaction({
    hash: mintData,
  });

  const mintNFT = async (toAddress: string) => {
    try {
      const result = await writeContractAsync({
        address: ROUGH_DRAFT_NFT_ADDRESS as `0x${string}`,
        abi: roughDraftNftAbi,
        functionName: "mint",
        args: [toAddress as `0x${string}`],
      });

      return result;
    } catch (error) {
      console.error("Error minting NFT:", error);
      throw error;
    }
  };

  return {
    mintNFT,
    isMinting,
    isConfirming,
    isLoading: isMinting || isConfirming,
    transactionHash: mintData,
  };
} 