import { Abi } from 'viem';  // viem is a dependency of wagmi

// Import the ABI directly from the JSON file
import EncryptedNFT from './contractABI/EncryptedERC721.json';

export const EncryptedNFTABI = EncryptedNFT.abi as Abi;

// Export the ABI from the JSON structure

// Export the contract address for different networks
export const EncryptedNFT_CONTRACT_ADDRESS = {
    1: '.', // Mainnet
    11155111: '0x2a027EC81DB86a33019191Dd68242bf34B4b9627', // Sepolia
};

// Default export for more convenient imports
export default EncryptedNFTABI;