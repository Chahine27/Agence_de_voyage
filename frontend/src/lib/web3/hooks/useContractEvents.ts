import { useEffect, useState } from 'react';
import { usePublicClient, useAccount } from 'wagmi';
import { getAddresses } from '../contracts/addresses';

const TravelAgencyABI = [
    {
        "inputs": [{"internalType": "address","name": "_customer","type": "address"}],
        "name": "getCustomerBookings",
        "outputs": [{"internalType": "uint256[]","name": "","type": "uint256[]"}],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [{"internalType": "uint256","name": "_reservationNumber","type": "uint256"}],
        "name": "getReservationDetails",
        "outputs": [
            {"internalType": "uint256","name": "travelId","type": "uint256"},
            {"internalType": "address","name": "traveler","type": "address"},
            {"internalType": "uint256","name": "price","type": "uint256"},
            {"internalType": "bool","name": "isHotelIncluded","type": "bool"},
            {"internalType": "bool","name": "isPaid","type": "bool"},
            {"internalType": "bool","name": "isCompleted","type": "bool"},
            {"internalType": "uint256","name": "bookingDate","type": "uint256"}
        ],
        "stateMutability": "view",
        "type": "function"
    }
] as const;

type Reservation = {
    reservationNumber: bigint;
    travelId: bigint;
    traveler: string;
    price: bigint;
    isHotelIncluded: boolean;
    isPaid: boolean;
    isCompleted: boolean;
    bookingDate: bigint;
};

export function useReservationEvents() {
    const { address } = useAccount();
    const publicClient = usePublicClient();
    const [reservations, setReservations] = useState<Reservation[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchReservations = async () => {
        if (!address) return;
        
        try {
            setIsLoading(true);
            const addresses = getAddresses(publicClient.chain.id);

            // Récupérer les numéros de réservation
            const bookingNumbers = await publicClient.readContract({
                address: addresses.TravelAgency,
                abi: TravelAgencyABI,
                functionName: 'getCustomerBookings',
                args: [address as `0x${string}`]
            }) as bigint[];

            if (bookingNumbers && bookingNumbers.length > 0) {
                const details = await Promise.all(
                    bookingNumbers.map(async (bookingNumber) => {
                        const details = await publicClient.readContract({
                            address: addresses.TravelAgency,
                            abi: TravelAgencyABI,
                            functionName: 'getReservationDetails',
                            args: [bookingNumber]
                        }) as [bigint, string, bigint, boolean, boolean, boolean, bigint];

                        return {
                            reservationNumber: bookingNumber,
                            travelId: details[0],
                            traveler: details[1],
                            price: details[2],
                            isHotelIncluded: details[3],
                            isPaid: details[4],
                            isCompleted: details[5],
                            bookingDate: details[6]
                        };
                    })
                );

                setReservations(details);
            }
        } catch (error) {
            console.error('Error fetching reservations:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchReservations();
    }, [address, publicClient]);

    return { reservations, isLoading, fetchReservations };
}