import { Action } from "@ai16z/eliza";
import { HarvestActionHandler } from "../types";
import { createPublicClient, http } from "viem";
import { mainnet } from "viem/chains";

export class GetEFPFriendsAction {
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
}

const handler: HarvestActionHandler = async (_runtime, message, _state) => {
    const nameOrAddress = message.content.address as string;
    if (!nameOrAddress) {
        return {
            text: "Please provide an address or ENS name to look up",
            action: "CONTINUE",
        };
    }

    try {
        const action = new GetEFPFriendsAction();
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

export const getEFPFriendsAction: Action = {
    name: "getEFPFriends",
    description: "Get a user's EFP friends who use Harvest",
    handler,
    validate: async (runtime, message) => {
        const address = message.content.address as string;
        return !!address;
    },
    examples: [
        [
            {
                user: "user",
                content: {
                    text: "Show me vitalik.eth's Harvest friends",
                },
            },
            {
                user: "assistant",
                content: {
                    text: "Looking up EFP friends",
                    action: "GET_EFP_FRIENDS",
                },
            },
        ],
    ],
    similes: ["GET_EFP_FRIENDS", "SHOW_EFP_FRIENDS"],
};
