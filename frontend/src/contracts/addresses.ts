
// Types pour différents réseaux BSC
export type NetworkType = 'bsc' | 'bscTestnet' | 'localhost';

interface ContractAddresses {
  TravelToken: `0x${string}`;
  TravelAgency: `0x${string}`;
}

export const addresses = {
  TravelToken: "0x..." as `0x${string}`,
  TravelAgency: "0x..." as `0x${string}`,
} as const;