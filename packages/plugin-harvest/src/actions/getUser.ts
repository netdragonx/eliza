import { Action } from "@ai16z/eliza";
import { HarvestActionHandler, HarvestUser } from "../types";
import { createPublicClient, http } from "viem";
import { mainnet } from "viem/chains";

export class GetUserAction {
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

    async getEFPFriends(nameOrAddress: string): Promise<string[]> {
        const address = await this.resolveAddress(nameOrAddress);
        const response = await fetch(
            `https://harvest.art/api/user/${address}/efp`
        );
        return response.json();
    }

    async getUserNFTs(
        nameOrAddress: string,
        chainId: string
    ): Promise<HarvestUser> {
        const address = await this.resolveAddress(nameOrAddress);
        const response = await fetch(
            `https://harvest.art/api/user/${address}/${chainId}/nfts`
        );
        return response.json();
    }
}

const handler: HarvestActionHandler = async (_runtime, message, _state) => {
    const action = new GetUserAction();
    const nameOrAddress = message.content.address as string;
    const chainId = message.content.chainId as string;

    if (!nameOrAddress) {
        return {
            text: "Please provide an address or ENS name to look up",
            action: "CONTINUE",
        };
    }

    try {
        if (chainId) {
            const user = await action.getUserNFTs(nameOrAddress, chainId);
            return {
                text: `Found ${user.nfts?.length || 0} NFTs owned by ${nameOrAddress} on chain ${chainId}`,
                data: user,
                action: "CONTINUE",
            };
        }

        const friends = await action.getEFPFriends(nameOrAddress);
        return {
            text: `Found ${friends.length} Harvest friends for ${nameOrAddress}`,
            data: { address: nameOrAddress, efpFriends: friends },
            action: "CONTINUE",
        };
    } catch (error) {
        return {
            text: error.message,
            action: "CONTINUE",
        };
    }
};

export const getHarvestUserAction: Action = {
    name: "getHarvestUser",
    description: "Get user's EFP friends and NFTs",
    handler,
    validate: async () => true,
    examples: [
        [
            {
                user: "user",
                content: {
                    text: "Show my Harvest friends 0x123",
                },
            },
            {
                user: "assistant",
                content: {
                    text: "Here are your Harvest friends",
                    action: "GET_HARVEST_USER",
                },
            },
        ],
    ],
    similes: ["GET_HARVEST_USER", "SHOW_HARVEST_USER"],
};
