import { Abi } from 'viem';  // viem is a dependency of wagmi

// Import the ABI directly from the JSON file
import EncryptedNFT from './EncryptedERC721.json';

export const EncryptedNFTABI = EncryptedNFT.abi as Abi;

// Export the ABI from the JSON structure

// Export the contract address for different networks
export const EncryptedNFT_CONTRACT_ADDRESS = {
    1: '.', // Mainnet
    11155111: '0x71CE937E6D1152532cA8cE8Fe5d4F9B92fF70Df6', // Sepolia
};

// Default export for more convenient imports
export default EncryptedNFTABI;