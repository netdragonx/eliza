import { Plugin } from "@ai16z/eliza";
import { harvestStatsProvider } from "./providers/stats";
import { harvestNFTsProvider } from "./providers/nfts";
import { harvestUserProvider } from "./providers/user";

export * as providers from "./providers";

/**
 * Harvest Plugin
 *
 * This plugin integrates the Harvest.art API for NFT and user data.
 *
 * providers:
 * - stats: Harvest stats provider
 * - nfts: Harvest NFTs provider
 * - user: Harvest user provider
 */
export const harvestPlugin: Plugin = {
    name: "harvest",
    description: "Harvest.art API integration for NFT and user data",
    providers: [harvestStatsProvider, harvestNFTsProvider, harvestUserProvider],
    actions: [],
    evaluators: [],
    services: [],
};

export default harvestPlugin;
