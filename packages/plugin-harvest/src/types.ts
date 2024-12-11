import { IAgentRuntime, Memory, State } from "@ai16z/eliza";

export interface HarvestStats {
    totalNFTs: number;
    totalLosses: number;
}

export interface HarvestNFT {
    id: string;
    chainId: string;
    address: string;
    tokenId: string;
}

export interface HarvestUser {
    address: string;
    efpFriends?: string[];
    nfts?: HarvestNFT[];
}

export interface HarvestActionHandler {
    (
        runtime: IAgentRuntime,
        message: Memory,
        state: State
    ): Promise<{
        text: string;
        action: string;
        data?: any;
    }>;
}
