import { Action } from "@ai16z/eliza";
import { HarvestActionHandler } from "../types";
import { createPublicClient, http } from "viem";
import { mainnet } from "viem/chains";

interface NFTMetadata {
    contract: {
        name: string;
        address: string;
        openSeaMetadata?: {
            twitterUsername?: string;
        };
    };
    tokenId: string;
    collection: {
        name: string;
    };
    balance: string;
}

export class GetUserNFTsAction {
    private publicClient = createPublicClient({
        chain: mainnet,
        transport: http(),
    });

    async resolveAddress(nameOrAddress: string): Promise<string> {
        if (nameOrAddress.toLowerCase().endsWith(".eth")) {
            try {
                const address = await this.publicClient.getEnsAddress({
                    name: nameOrAddress,
                });
                if (!address) throw new Error("ENS name not found");
                return address;
            } catch (error) {
                throw new Error(`Failed to resolve ENS name: ${error.message}`);
            }
        }
        return nameOrAddress;
    }

    async getUserNFTs(
        nameOrAddress: string,
        chainId: string
    ): Promise<NFTMetadata[]> {
        const address = await this.resolveAddress(nameOrAddress);
        const response = await fetch(
            `https://harvest.art/api/user/${address}/${chainId}/nfts`
        );
        const { data } = await response.json();
        return data.ownedNfts.map((nft: any) => ({
            contract: {
                name: nft.contract.name,
                address: nft.contract.address,
                openSeaMetadata: nft.contract.openSeaMetadata,
            },
            tokenId: nft.tokenId,
            collection: {
                name: nft.collection.name,
            },
            balance: nft.balance,
        }));
    }
}

const handler: HarvestActionHandler = async (_runtime, message, _state) => {
    const nameOrAddress = message.content.address as string;
    const chainId = message.content.chainId as string;

    if (!nameOrAddress || !chainId) {
        return {
            text: "Please provide both address/ENS and chain ID to look up NFTs",
            action: "CONTINUE",
        };
    }

    try {
        const action = new GetUserNFTsAction();
        const nfts = await action.getUserNFTs(nameOrAddress, chainId);

        const nftList = nfts
            .map((nft) => {
                const twitterHandle = nft.contract.openSeaMetadata
                    ?.twitterUsername
                    ? ` @${nft.contract.openSeaMetadata.twitterUsername}`
                    : "";
                return `${twitterHandle ? twitterHandle : ""} ${nft.collection.name}`;
            })
            .join(", ");

        return {
            text: `*scanning wallet* Found some NFTs. Visit the farm to see more! ${nftList}`,
            data: nfts,
            action: "CONTINUE",
        };
    } catch (error) {
        return {
            text: error.message,
            action: "CONTINUE",
        };
    }
};

export const getUserNFTsAction: Action = {
    name: "getUserNFTs",
    description: "Get NFTs owned by a specific address/ENS name on a chain",
    handler,
    validate: async (runtime, message) => {
        const address = message.content.address as string;
        const chainId = message.content.chainId as string;
        return !!address && !!chainId;
    },
    examples: [
        [
            {
                user: "user",
                content: {
                    text: "Show me vitalik.eth's NFTs on Ethereum",
                },
            },
            {
                user: "assistant",
                content: {
                    text: "Looking up NFTs",
                    action: "GET_USER_NFTS",
                },
            },
        ],
    ],
    similes: ["GET_USER_NFTS", "SHOW_USER_NFTS"],
};
