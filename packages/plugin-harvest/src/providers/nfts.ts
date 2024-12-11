import { Provider } from "@ai16z/eliza";

/**
 * Harvest NFTs Provider
 *
 * This provider fetches NFT data from the Harvest.art API.
 *
 * getLatestNFTs() - Fetches the latest NFTs sold to Harvest.art
 * getBarnNFTs(chainId: string, address: string) - Fetches the NFTs in The Barn from a specific address on a specific chain
 */
export const harvestNFTsProvider: Provider = {
    async get(runtime, message, state) {
        const getLatestNFTs = async () => {
            const response = await fetch(
                "https://harvest.art/api/cached-nfts/latest"
            );
            return response.json();
        };

        const getBarnNFTs = async (chainId: string, address: string) => {
            const response = await fetch(
                `https://harvest.art/api/cached-nfts/${chainId}/${address}/`
            );
            return response.json();
        };

        const chainId = message.content.chainId as string;
        const address = message.content.address as string;

        if (chainId && address) {
            return getBarnNFTs(chainId, address);
        }

        return getLatestNFTs();
    },
};
