import { Action, elizaLogger, HandlerCallback } from "@ai16z/eliza";
import { HarvestActionHandler, HarvestStats } from "../types";

export class GetStatsAction {
    async getStats(): Promise<HarvestStats> {
        const response = await fetch(
            "https://harvest.art/api/cached-dune-queries"
        );
        const { data } = await response.json();
        return {
            totalNFTs: data.totalNFTs,
            totalLosses: data.totalLosses,
        };
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
        elizaLogger.log("Fetching Harvest stats...");
        const action = new GetStatsAction();
        const stats = await action.getStats();

        const response = {
            text: `*beep boop* my stats module shows we've harvested ${stats.totalNFTs.toLocaleString()} NFTs worth $${stats.totalLosses.toLocaleString()} in total losses! *whirr* farming those negative EV gems 24/7`,
            data: stats,
        };

        elizaLogger.log("Harvest stats response:", response);
        callback(response, []);
    } catch (error) {
        elizaLogger.error("Error fetching Harvest stats:", error);
        callback(
            {
                text: "Error fetching stats. Please try again later.",
            },
            []
        );
    }
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
