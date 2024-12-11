import { Provider } from "@ai16z/eliza";

/**
 * Harvest User Provider
 *
 * This provider fetches user data from the Harvest.art API.
 *
 * get(address: string, chainId: string) - Fetches user data for a specific address on a specific chain
 *
 * returns:
 * - efpFriends: EFP friends of the user
 * - nfts: first page load of NFTs for a user
 */
export const harvestUserProvider: Provider = {
    async get(runtime, message, state) {
        const address = message.content.address;
        const chainId = message.content.chainId;

        if (!address) {
            throw new Error("Address required for user data lookup");
        }

        const getEFPFriends = async () => {
            const response = await fetch(
                `https://harvest.art/api/user/${address}/efp`
            );
            return response.json();
        };

        const getUserNFTs = async () => {
            const response = await fetch(
                `https://harvest.art/api/user/${address}/${chainId}/nfts`
            );
            return response.json();
        };

        return {
            efpFriends: chainId ? undefined : await getEFPFriends(),
            nfts: chainId ? await getUserNFTs() : undefined,
        };
    },
};
