import { Action } from "@ai16z/eliza";
import { HarvestActionHandler, HarvestNFT } from "../types";

export class GetLatestNFTsAction {
    async getLatestNFTs(): Promise<HarvestNFT[]> {
        const response = await fetch(
            "https://harvest.art/api/cached-nfts/latest"
        );
        return response.json();
    }
}

const handler: HarvestActionHandler = async (_runtime, _message, _state) => {
    const action = new GetLatestNFTsAction();
    const nfts = await action.getLatestNFTs();
    return {
        text: `Here are the latest ${nfts.length} NFTs bought by Harvest`,
        data: nfts,
        action: "CONTINUE",
    };
};

export const getLatestNFTsAction: Action = {
    name: "getLatestNFTs",
    description: "Get the most recent NFTs purchased by Harvest.art",
    handler,
    validate: async () => true,
    examples: [
        [
            {
                user: "user",
                content: {
                    text: "Show me Harvest's latest pickups",
                },
            },
            {
                user: "assistant",
                content: {
                    text: "Here are our latest harvested NFTs",
                    action: "GET_LATEST_NFTS",
                },
            },
        ],
    ],
    similes: ["GET_LATEST_NFTS", "SHOW_LATEST_NFTS"],
};
