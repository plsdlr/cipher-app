import { Abi } from 'viem';  // viem is a dependency of wagmi

// Import the ABI directly from the JSON file
import NightMarket from './NFTMarketplace.json';

export const NightMarketABI = NightMarket.abi as Abi;

// Export the ABI from the JSON structure

// Export the contract address for different networks
export const NightMarket_CONTRACT_ADDRESS = {
    1: '.', // Mainnet
    11155111: '0x25CC409Aa50F1a0a382a959db211166ED4bb7932', // Sepolia
};

// Default export for more convenient imports
export default NightMarketABI;