import { Abi } from 'viem';  // viem is a dependency of wagmi

// Import the ABI directly from the JSON file
import EncryptedNFT from './EncryptedERC721.json';

export const EncryptedNFTABI = EncryptedNFT.abi as Abi;

// Export the ABI from the JSON structure

// Export the contract address for different networks
export const EncryptedNFT_CONTRACT_ADDRESS = {
    1: '.', // Mainnet
    11155111: '0x0d1a812cd0609BcFc018819a7775b4B163e395e9', // Sepolia
};

// Default export for more convenient imports
export default EncryptedNFTABI;