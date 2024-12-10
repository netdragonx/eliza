import { Plugin } from "@ai16z/eliza";
import { harvestNFTsProvider } from "./providers/nfts";
import { harvestStatsProvider } from "./providers/stats";
import { harvestUserProvider } from "./providers/user";

export * as providers from "./providers";

export const harvestPlugin: Plugin = {
    name: "harvest",
    description: "Harvest.art API integration for NFT and user data",
    providers: [harvestStatsProvider, harvestNFTsProvider, harvestUserProvider],
};
