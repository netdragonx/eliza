import { Action } from "@ai16z/eliza";
import { HarvestActionHandler, HarvestStats } from "../types";

export class GetStatsAction {
    async getStats(): Promise<HarvestStats> {
        const response = await fetch(
            "https://harvest.art/api/cached-dune-queries"
        );
        const data = await response.json();
        return {
            totalNFTs: data.totalNFTs,
            totalLosses: data.totalLosses,
        };
    }
}

const handler: HarvestActionHandler = async (_runtime, _message, _state) => {
    const action = new GetStatsAction();
    const stats = await action.getStats();
    return {
        text: `Harvest has bought ${stats.totalNFTs} NFTs with a total loss value of $${stats.totalLosses.toLocaleString()}`,
        action: "CONTINUE",
    };
};

export const getHarvestStatsAction: Action = {
    name: "getHarvestStats",
    description: "Get total NFTs sold and total losses harvested",
    handler,
    validate: async () => true,
    examples: [
        [
            {
                user: "user",
                content: {
                    text: "Show me Harvest stats",
                },
            },
            {
                user: "assistant",
                content: {
                    text: "Here are the current Harvest stats",
                    action: "GET_HARVEST_STATS",
                },
            },
        ],
    ],
    similes: ["GET_HARVEST_STATS", "SHOW_HARVEST_STATS"],
};
