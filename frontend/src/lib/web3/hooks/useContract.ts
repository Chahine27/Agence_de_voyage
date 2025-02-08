import { 
    useAccount, 
    useReadContract, 
    useWriteContract, 
    useWaitForTransactionReceipt,
    useConfig 
  } from 'wagmi';
  import { addresses } from '../../../contracts/addresses';
  import TravelTokenABI from '../../../contracts/abis/TravelToken.json';
  import TravelAgencyABI from '../../../contracts/abis/TravelAgency.json';
  import { useCallback } from 'react';
  
  interface ITravelToken {
    balanceOf(address: string): Promise<bigint>;
    approve(spender: string, amount: bigint): Promise<void>;
    transfer(to: string, amount: bigint): Promise<boolean>;
    transferFrom(from: string, to: string, amount: bigint): Promise<boolean>;
    allowance(owner: string, spender: string): Promise<bigint>;
    buyTokens(): Promise<void>;
  }
  
  interface IBooking {
    reservationNumber: bigint;
    travelId: bigint;
    traveler: string;
    price: bigint;
    isHotelIncluded: boolean;
    isPaid: boolean;
    isCompleted: boolean;
    bookingDate: bigint;
  }
  
  interface ITravelAgency {
    createReservation(
      travelId: number,
      travelerAddress: string,
      isHotelIncluded: boolean
    ): Promise<void>;
    getReservationDetails(reservationNumber: bigint): Promise<IBooking>;
    addReview(reservationNumber: bigint, comment: string, rating: number): Promise<void>;
  }
  
  export function useTravelToken() {
    const { address } = useAccount();
    const config = useConfig();
    const currentChainId = config.chains[0].id;
    const { writeContract, data: hash } = useWriteContract();
    const { data: receipt } = useWaitForTransactionReceipt({ hash });
  
    const buyTokens = useCallback(async (amount: bigint) => {
      if (!address) throw new Error('Wallet not connected');
      try {
        const result = await writeContract({
          address: addresses.TravelToken,
          abi: TravelTokenABI.abi,
          functionName: 'buyTokens',
          value: amount
        });
        return result;
      } catch (error) {
        console.error('Error buying tokens:', error);
        throw error;
      }
    }, [writeContract, address]);
  
    const getBalance = useCallback(async (address: string) => {
      const result = await useReadContract({
        address: addresses.TravelToken,
        abi: TravelTokenABI.abi,
        functionName: 'balanceOf',
        args: [address],
      });
      return result;
    }, []);
  
    return {
      buyTokens,
      getBalance,
      isConnected: !!address,
      chainId: currentChainId
    };
  }
  
  export function useTravelAgency() {
    const { address } = useAccount();
    const config = useConfig();
    const currentChainId = config.chains[0].id;
    const { writeContract } = useWriteContract();
  
    const createReservation = useCallback(async (
      travelId: number,
      travelerAddress: string,
      isHotelIncluded: boolean
    ) => {
      if (!address) throw new Error('Wallet not connected');
      try {
        const result = await writeContract({
          address: addresses.TravelAgency,
          abi: TravelAgencyABI.abi,
          functionName: 'createReservation',
          args: [travelId, travelerAddress, isHotelIncluded],
        });
        return result;
      } catch (error) {
        console.error('Error creating reservation:', error);
        throw error;
      }
    }, [writeContract, address]);
  
    const addReview = useCallback(async (
      reservationNumber: bigint,
      comment: string,
      rating: number
    ) => {
      if (!address) throw new Error('Wallet not connected');
      try {
        const result = await writeContract({
          address: addresses.TravelAgency,
          abi: TravelAgencyABI.abi,
          functionName: 'addReview',
          args: [reservationNumber, comment, rating],
        });
        return result;
      } catch (error) {
        console.error('Error adding review:', error);
        throw error;
      }
    }, [writeContract, address]);
  
    const getReservationDetails = useCallback(async (reservationNumber: bigint) => {
      const result = await useReadContract({
        address: addresses.TravelAgency,
        abi: TravelAgencyABI.abi,
        functionName: 'getReservationDetails',
        args: [reservationNumber],
      });
      return result;
    }, []);
  
    return {
      createReservation,
      addReview,
      getReservationDetails,
      isConnected: !!address,
      chainId: currentChainId
    };
  }