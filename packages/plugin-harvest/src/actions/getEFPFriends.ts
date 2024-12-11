import { Action } from "@ai16z/eliza";
import { HarvestActionHandler } from "../types";
import { createPublicClient, http } from "viem";
import { mainnet } from "viem/chains";

interface EFPFriend {
    name: string;
    address: string;
}

interface EFPResponse {
    data: {
        followingCount: number;
        harvestUsers: EFPFriend[];
    };
}

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

    async getEFPFriends(nameOrAddress: string): Promise<EFPResponse> {
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
        const { data } = await action.getEFPFriends(nameOrAddress);

        if (!data.harvestUsers?.length) {
            return {
                text: `*scanning social graph* None of your friends have harvested yet. Add more friends at @efp!`,
                action: "CONTINUE",
            };
        }

        const friendList = data.harvestUsers
            .map((friend) => friend.name || friend.address)
            .join(", ");

        return {
            text: `*scanning social graph* Found ${data.harvestUsers.length} Harvest friends out of ${data.followingCount} total @efp follows! Friends: ${friendList}`,
            data: data.harvestUsers,
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
