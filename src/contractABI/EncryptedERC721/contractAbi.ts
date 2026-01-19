import { Abi } from 'viem';  // viem is a dependency of wagmi

// Import the ABI directly from the JSON file
import EncryptedNFT from './EncryptedERC721.json';

export const EncryptedNFTABI = EncryptedNFT.abi as Abi;

// Export the ABI from the JSON structure

// Export the contract address for different networks
export const EncryptedNFT_CONTRACT_ADDRESS = {
    1: '.', // Mainnet
    11155111: '0xA4AEf609fDB5E30B32a0039883458BBB945f4100', // Sepolia
};

// Default export for more convenient imports
export default EncryptedNFTABI;