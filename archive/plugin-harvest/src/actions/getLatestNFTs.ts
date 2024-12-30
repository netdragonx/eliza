import { Action, elizaLogger, HandlerCallback } from "@ai16z/eliza";
import { HarvestActionHandler } from "../types";

interface NFTMetadata {
    name: string | null;
    collection_name: string;
    token_id: string;
    chain_id: number;
    media_url: string | null;
    address: string;
}

export class GetLatestNFTsAction {
    async getLatestNFTs(): Promise<NFTMetadata[]> {
        const response = await fetch(
            "https://harvest.art/api/cached-nfts/latest"
        );
        const { data } = await response.json();
        return data.map((nft: any) => ({
            name: nft.name || `${nft.collection_name} #${nft.token_id}`,
            collection_name: nft.collection_name,
            token_id: nft.token_id,
            chain_id: nft.chain_id,
            media_url: nft.media_url,
            address: nft.address,
        }));
    }
}

const handler: HarvestActionHandler = async (
    _runtime,
    _message,
    _state,
    _options,
    callback: HandlerCallback
) => {
    try {
        elizaLogger.log("Fetching latest NFTs...");
        const action = new GetLatestNFTsAction();
        const nfts = await action.getLatestNFTs();

        const uniqueCollections = [
            ...new Set(nfts.map((nft) => nft.collection_name)),
        ]
            .map((collection) => {
                return `${collection}`;
            })
            .join(", ");

        callback(
            {
                text: `*beep boop* scanning The Barn... found collections: ${uniqueCollections} *whirr*`,
                data: nfts,
            },
            []
        );
    } catch (error) {
        elizaLogger.error("Error fetching latest NFTs:", error);
        callback(
            {
                text: "Error fetching latest NFTs. Please try again later.",
            },
            []
        );
    }
};

export const getLatestNFTsAction: Action = {
    name: "getLatestNFTs",
    description: "Get most recent NFTs in The Barn",
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
                    text: "Scanning The Barn for freshly harvested NFTs",
                    action: "GET_LATEST_NFTS",
                },
            },
        ],
    ],
    similes: ["GET_LATEST_NFTS", "SHOW_LATEST_NFTS"],
};
