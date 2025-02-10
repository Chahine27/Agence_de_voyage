import { 
  useAccount, 
  useReadContract,
  useWriteContract,
  usePublicClient,
} from 'wagmi';
import { parseEther } from 'viem';
import { getAddresses } from '../contracts/addresses';
import { useEffect, useState } from 'react';

type Address = `0x${string}`;

const TravelTokenABI = [
  {
    "inputs": [{"internalType": "address","name": "account","type": "address"}],
    "name": "balanceOf",
    "outputs": [{"internalType": "uint256","name": "","type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "buyTokens",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "address","name": "spender","type": "address"},
      {"internalType": "uint256","name": "amount","type": "uint256"}
    ],
    "name": "approve",
    "outputs": [{"internalType": "bool","name": "","type": "bool"}],
    "stateMutability": "nonpayable",
    "type": "function"
  }
] as const;

const TravelAgencyABI = [
  {
    "inputs": [
      {"internalType": "uint256","name": "_travelId","type": "uint256"},
      {"internalType": "address","name": "_travelerAddress","type": "address"},
      {"internalType": "bool","name": "_isHotelIncluded","type": "bool"}
    ],
    "name": "createReservation",
    "outputs": [{"internalType": "uint256","name": "","type": "uint256"}],
    "stateMutability": "nonpayable",
    "type": "function"
  }
] as const;

export function useTravelToken() {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const chainId = publicClient.chain.id;
  const addresses = getAddresses(chainId);
  
  const { writeContractAsync } = useWriteContract();

  const { data: balance } = useReadContract({
    address: addresses.TravelToken,
    abi: TravelTokenABI,
    functionName: 'balanceOf',
    args: address ? [address as Address] : undefined,
  });

  const buyTokens = async (amount: bigint) => {
    if (!address) throw new Error('Wallet not connected');
    
    try {
      const buyHash = await writeContractAsync({
        address: addresses.TravelToken,
        abi: TravelTokenABI,
        functionName: 'buyTokens',
        value: amount
      });

      // 2. Attendre la confirmation de l'achat
      await publicClient.waitForTransactionReceipt({ hash: buyHash });

      // 3. Approuver le contrat TravelAgency à dépenser les tokens
      const approveHash = await writeContractAsync({
        address: addresses.TravelToken,
        abi: TravelTokenABI,
        functionName: 'approve',
        args: [addresses.TravelAgency, amount]
      });

      // 4. Attendre la confirmation de l'approbation
      await publicClient.waitForTransactionReceipt({ hash: approveHash });

      return buyHash;
    } catch (error) {
      console.error('Error buying tokens:', error);
      throw error;
    }
  };

  return {
    buyTokens,
    balance: balance || BigInt(0),
    isConnected: !!address,
    chainId
  };
}

export function useTravelAgency() {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const chainId = publicClient.chain.id;
  const addresses = getAddresses(chainId);
  
  const { writeContractAsync } = useWriteContract();

  const createReservation = async (
      travelId: number,
      travelerAddress: Address,
      isHotelIncluded: boolean,
      price: string
  ) => {
      if (!address) throw new Error('Wallet not connected');
      
      try {
          const priceInWei = parseEther(price); 
          
          const hash = await writeContractAsync({
              address: addresses.TravelAgency,
              abi: TravelAgencyABI,
              functionName: 'createReservation',
              args: [BigInt(travelId), travelerAddress, isHotelIncluded],
              //value: priceInWei
          });

          return hash;
      } catch (error) {
          console.error('Error creating reservation:', error);
          throw error;
      }
  };

  return {
      createReservation,
      isConnected: !!address,
      chainId
  };
}
