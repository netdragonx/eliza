import { Provider } from "@ai16z/eliza";

/**
 * Harvest Stats Provider
 *
 * This provider fetches stats from the Harvest.art API.
 *
 * get() - Fetches the total number of NFTs sold and the total value of losses harvest (in USD)
 *
 * returns:
 * - totalNFTs: total number of NFTs sold
 * - totalLosses: total value of losses harvest (in USD)
 */
export const harvestStatsProvider: Provider = {
    async get() {
        const response = await fetch(
            "https://harvest.art/api/cached-dune-queries"
        );
        const data = await response.json();

        return {
            totalNFTs: data.totalNFTs,
            totalLosses: data.totalLosses,
        };
    },
};
