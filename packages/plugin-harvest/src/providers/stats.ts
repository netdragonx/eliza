import { Provider } from "@ai16z/eliza";

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
