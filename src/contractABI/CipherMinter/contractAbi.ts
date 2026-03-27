import { Abi } from 'viem';  // viem is a dependency of wagmi

// Import the ABI directly from the JSON file
import CipherMinter from './CipherMinter.json';

export const CipherMinterABI = CipherMinter.abi as Abi;

// Export the ABI from the JSON structure

// Export the contract address for different networks
export const CipherMinter_CONTRACT_ADDRESS = {
    1: '0xFF158f4b0B1D71b6d666747Df79C47325Fcf29B4', // Mainnet
    11155111: '0xA12Ba64dA11Eb66cf973Ad82e5Dc8Bd7d5C843b1', // Sepolia
};

// Default export for more convenient imports
export default CipherMinterABI;