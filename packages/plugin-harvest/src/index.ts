import { Plugin } from "@ai16z/eliza";
import { getHarvestNFTsAction } from "./actions/getNFTs";
import { getHarvestStatsAction } from "./actions/getStats";
import { getHarvestUserAction } from "./actions/getUser";

export * as actions from "./actions";

/**
 * Harvest Plugin
 *
 * This plugin integrates the Harvest.art API for NFT and user data.
 *
 * actions:
 * - getStats: Get Harvest stats (totalNFTs, totalLosses)
 * - getNFTs: Get NFTs (latest or by barn address)
 * - getUser: Get user data (EFP friends, owned NFTs)
 */
export const harvestPlugin: Plugin = {
    name: "harvest",
    description: "Harvest.art API integration for NFT and user data",
    actions: [
        getHarvestStatsAction,
        getHarvestNFTsAction,
        getHarvestUserAction,
    ],
    providers: [],
    evaluators: [],
    services: [],
};

export default harvestPlugin;
