import { Plugin } from "@ai16z/eliza";
import { getHarvestStatsAction } from "./actions/getStats";
// import { getLatestNFTsAction } from "./actions/getLatestNFTs";
// import { getBarnNFTsAction } from "./actions/getBarnNFTs";
// import { getEFPFriendsAction } from "./actions/getEFPFriends";
// import { getUserNFTsAction } from "./actions/getUser";

export * as actions from "./actions";

/**
 * Harvest Plugin
 *
 * This plugin integrates the Harvest.art API for NFT and user data.
 *
 * actions:
 * - getStats: Get total NFTs sold and total losses harvested
 * - getLatestNFTs: Get most recent NFTs in The Barn
 * - getBarnNFTs: Get specific NFTs in The Barn by contract address
 * - getEFPFriends: Get a user's EFP friends who use Harvest
 * - getUserNFTs: Get a user's NFTs by address
 */
export const harvestPlugin: Plugin = {
    name: "harvest",
    description: "Harvest.art API integration for NFT and user data",
    actions: [
        getHarvestStatsAction,
        // getLatestNFTsAction,
        // getBarnNFTsAction,
        // getEFPFriendsAction,
        // getUserNFTsAction,
    ],
    providers: [],
    evaluators: [],
    services: [],
};

export default harvestPlugin;
