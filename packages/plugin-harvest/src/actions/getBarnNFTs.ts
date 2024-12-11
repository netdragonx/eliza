import { Action, HandlerCallback } from "@ai16z/eliza";
import { HarvestActionHandler } from "../types";

interface BarnNFT {
    id: number;
    token_id: string;
    collection_name: string;
    chain_id: number;
    address: string;
    amount: number;
    owned: boolean;
}

export class GetBarnNFTsAction {
    async getBarnNFTs(chainId: string, address: string): Promise<BarnNFT[]> {
        const response = await fetch(
            `https://harvest.art/api/cached-nfts/${chainId}/${address}/`
        );
        const { data } = await response.json();
        return data.map((nft: any) => ({
            id: nft.id,
            token_id: nft.token_id,
            collection_name: nft.collection_name,
            chain_id: nft.chain_id,
            address: nft.address,
            amount: nft.amount,
            owned: nft.owned,
        }));
    }
}

const handler: HarvestActionHandler = async (
    _runtime,
    message,
    _state,
    _options,
    callback: HandlerCallback
) => {
    const chainId = message.content.chainId as string;
    const address = message.content.address as string;

    if (!chainId || !address) {
        callback(
            {
                text: "Please provide both chain ID and address to check The Barn",
            },
            []
        );
        return;
    }

    try {
        const action = new GetBarnNFTsAction();
        const nfts = await action.getBarnNFTs(chainId, address);

        if (!nfts.length) {
            callback(
                {
                    text: `*scanning barn* No NFTs found in barn ${address} on chain ${chainId}.`,
                },
                []
            );
            return;
        }

        const nftsByCollection = nfts.reduce(
            (acc: { [key: string]: number }, nft) => {
                acc[nft.collection_name] = (acc[nft.collection_name] || 0) + 1;
                return acc;
            },
            {}
        );

        const collectionSummary = Object.entries(nftsByCollection)
            .map(([collection, count]) => `${count}x ${collection}`)
            .join(", ");

        callback(
            {
                text: `*scanning barn* Found NFTs in The Barn: ${collectionSummary}`,
                data: nfts,
            },
            []
        );
    } catch (error) {
        callback(
            {
                text: error.message,
            },
            []
        );
    }
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
                    text: "Scanning The Barn for NFTs",
                    action: "GET_BARN_NFTS",
                },
            },
        ],
    ],
    similes: ["GET_BARN_NFTS", "SHOW_BARN_NFTS"],
};
