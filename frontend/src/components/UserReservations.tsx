import React, { useEffect, useState } from 'react';
import { useAccount, usePublicClient } from 'wagmi';
//import { getAddresses } from '../../../contracts/addresses';
import { getAddresses } from '@/lib/web3/contracts/addresses';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
//import { fetchTravelOffers } from '../../api';
import { fetchTravelOffers } from '@/app/api';

type Travel = {
    id: number;
    price: string;
    type: string;
    depart: string;
    destination: string;
    hotel?: {
        name: string;
        numberOfNights: number;
    };
    compagnyAirLine: string;
    dateDepart: string;
    dateArrivee: string;
};

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

export function UserReservations() {
    const { address } = useAccount();
    const publicClient = usePublicClient();
    const [reservations, setReservations] = useState<Reservation[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const loadData = async () => {
            try {
                setLoading(true);
                setError(null);

                if (!address) {
                    setError("No wallet connected");
                    return;
                }

                const addresses = getAddresses(publicClient.chain.id);
                console.log("Contract address:", addresses.TravelAgency);
                console.log("User address:", address);

                try {
                    // Obtenir la liste des numéros de réservation
                    const bookingNumbers = await publicClient.readContract({
                        address: addresses.TravelAgency,
                        abi: TravelAgencyABI,
                        functionName: 'getCustomerBookings',
                        args: [address as `0x${string}`]
                    }) as bigint[];

                    console.log("Booking numbers:", bookingNumbers);

                    if (bookingNumbers && bookingNumbers.length > 0) {
                        // Récupérer les détails de chaque réservation
                        const reservationDetails = await Promise.all(
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
                                } satisfies Reservation;
                            })
                        );

                        console.log("Reservation details:", reservationDetails);
                        setReservations(reservationDetails);
                    }
                } catch (error) {
                    console.error("Error reading reservations:", error);
                    setError("Error reading reservations");
                }

            } catch (error) {
                console.error('Error loading reservations:', error);
                setError("Failed to load reservations");
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [address, publicClient]);

    // ... reste du code pour le rendu

    return (
        <Card className="mt-6">
            <CardHeader>
                <CardTitle>Vos Réservations</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 gap-4">
                    {reservations.map((reservation) => (
                        <div 
                            key={String(reservation.reservationNumber)}
                            className="border p-4 rounded-lg bg-white hover:shadow-lg transition-shadow"
                        >
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="font-bold text-lg">
                                        Réservation #{String(reservation.reservationNumber)}
                                    </h3>
                                    <p className="text-gray-600">Travel ID: {String(reservation.travelId)}</p>
                                    <p className="text-gray-600">Prix: {Number(reservation.price) / 10**18} TRVL</p>
                                    <div className="mt-2">
                                        <span className={`px-2 py-1 rounded-full text-sm ${
                                            reservation.isCompleted ? 'bg-green-100 text-green-800' : 
                                            reservation.isPaid ? 'bg-blue-100 text-blue-800' : 
                                            'bg-yellow-100 text-yellow-800'
                                        }`}>
                                            {reservation.isCompleted ? 'Complété' : 
                                             reservation.isPaid ? 'Payé' : 
                                             'En attente'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
