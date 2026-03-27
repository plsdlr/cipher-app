import { Abi } from 'viem';  // viem is a dependency of wagmi

// Import the ABI directly from the JSON file
import NightMarket from './NFTMarketplace.json';

export const NightMarketABI = NightMarket.abi as Abi;

// Export the ABI from the JSON structure

// Export the contract address for different networks
export const NightMarket_CONTRACT_ADDRESS = {
    1: '0x25F77D92B771cFA7ddf5944bbC0c4e688E2f4ee7', // Mainnet
    11155111: '0x25F77D92B771cFA7ddf5944bbC0c4e688E2f4ee7', // Sepolia
};

// Default export for more convenient imports
export default NightMarketABI;