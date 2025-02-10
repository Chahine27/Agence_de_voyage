import { type Address } from 'viem';
import { mainnet, sepolia, bsc, bscTestnet } from 'wagmi/chains';

interface ContractAddresses {
  TravelToken: Address;
  TravelAgency: Address;
}

export const addresses: Record<number, ContractAddresses> = {
  [mainnet.id]: {
    TravelToken: "0x..." as Address,
    TravelAgency: "0x..." as Address,
  },
  [sepolia.id]: {
    TravelToken: "0x..." as Address,
    TravelAgency: "0x..." as Address,
  },
  [bsc.id]: {
    TravelToken: "0x..." as Address,
    TravelAgency: "0x..." as Address,
  },
  [bscTestnet.id]: {
    TravelToken: "0xd9145CCE52D386f254917e481eB44e9943F39138" as Address,
    TravelAgency: "0xd8b934580fcE35a11B58C6D73aDeE468a2833fa8" as Address,
  }
} as const;

export function getAddresses(chainId: number): ContractAddresses {
  const chainAddresses = addresses[chainId];
  if (!chainAddresses) {
    throw new Error(`Chain ${chainId} not supported. Supported chains are: ${Object.keys(addresses).join(', ')}`);
  }
  return chainAddresses;
}

// Types utiles pour l'exportation
export type SupportedChainId = keyof typeof addresses;
export const SUPPORTED_CHAINS = Object.keys(addresses).map(Number);