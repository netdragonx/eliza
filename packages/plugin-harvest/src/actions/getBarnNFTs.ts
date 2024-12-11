import { Action } from "@ai16z/eliza";
import { HarvestActionHandler, HarvestNFT } from "../types";

export class GetBarnNFTsAction {
    async getBarnNFTs(chainId: string, address: string): Promise<HarvestNFT[]> {
        const response = await fetch(
            `https://harvest.art/api/cached-nfts/${chainId}/${address}/`
        );
        return response.json();
    }
}

const handler: HarvestActionHandler = async (_runtime, message, _state) => {
    const chainId = message.content.chainId as string;
    const address = message.content.address as string;

    if (!chainId || !address) {
        return {
            text: "Please provide both chain ID and address to check The Barn",
            action: "CONTINUE",
        };
    }

    const action = new GetBarnNFTsAction();
    const nfts = await action.getBarnNFTs(chainId, address);
    return {
        text: `Found ${nfts.length} NFTs in barn ${address} on chain ${chainId}`,
        data: nfts,
        action: "CONTINUE",
    };
};

export const getBarnNFTsAction: Action = {
    name: "getBarnNFTs",
    description: "Get NFTs stored in a specific Barn contract",
    handler,
    validate: async (runtime, message) => {
        const chainId = message.content.chainId as string;
        const address = message.content.address as string;
        return !!chainId && !!address;
    },
    examples: [
        [
            {
                user: "user",
                content: {
                    text: "Show NFTs in barn 0x123 on Ethereum",
                },
            },
            {
                user: "assistant",
                content: {
                    text: "Checking The Barn contents",
                    action: "GET_BARN_NFTS",
                },
            },
        ],
    ],
    similes: ["GET_BARN_NFTS", "SHOW_BARN_NFTS"],
};
