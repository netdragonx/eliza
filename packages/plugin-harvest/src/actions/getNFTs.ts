import { Action } from "@ai16z/eliza";
import { HarvestActionHandler, HarvestNFT } from "../types";

export class GetNFTsAction {
    async getLatestNFTs(): Promise<HarvestNFT[]> {
        const response = await fetch(
            "https://harvest.art/api/cached-nfts/latest"
        );
        return response.json();
    }

    async getBarnNFTs(chainId: string, address: string): Promise<HarvestNFT[]> {
        const response = await fetch(
            `https://harvest.art/api/cached-nfts/${chainId}/${address}/`
        );
        return response.json();
    }
}

const handler: HarvestActionHandler = async (_runtime, message, _state) => {
    const action = new GetNFTsAction();
    const chainId = message.content.chainId as string;
    const address = message.content.address as string;

    if (chainId && address) {
        const nfts = await action.getBarnNFTs(chainId, address);
        return {
            text: `Found ${nfts.length} NFTs in barn ${address} on chain ${chainId}`,
            data: nfts,
            action: "CONTINUE",
        };
    }

    const nfts = await action.getLatestNFTs();
    return {
        text: `Here are the latest ${nfts.length} NFTs bought by Harvest`,
        data: nfts,
        action: "CONTINUE",
    };
};

export const getHarvestNFTsAction: Action = {
    name: "getHarvestNFTs",
    description: "Get latest NFTs or NFTs by barn address",
    handler,
    validate: async () => true,
    examples: [
        [
            {
                user: "user",
                content: {
                    text: "Show latest Harvest NFTs",
                },
            },
            {
                user: "assistant",
                content: {
                    text: "Here are the latest NFTs",
                    action: "GET_HARVEST_NFTS",
                },
            },
        ],
    ],
    similes: ["GET_HARVEST_NFTS", "SHOW_HARVEST_NFTS"],
};
