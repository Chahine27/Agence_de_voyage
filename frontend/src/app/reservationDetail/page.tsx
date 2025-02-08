'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAccount, useBalance, usePublicClient } from 'wagmi';

type Hotel = {
    name: string;
    numberOfNights: number;
};

type Travel = {
    id: number;
    price: string;
    type: string;
    depart: string;
    destination: string;
    hotel?: Hotel;
    compagnyAirLine: string;
    dateDepart: string;
    dateArrivee: string;
};

export default function ReservationDetail() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [travel, setTravel] = useState<Travel | null>(null);
    const [userData, setUserData] = useState<{ address: string; balance: string; chainId: number; chainName: string } | null>(null);

    // Récupération des informations du compte
    const { address } = useAccount();
    const { data: balance } = useBalance({ address });
    const publicClient = usePublicClient();

    useEffect(() => {
        const data = searchParams.get('data');
        if (data) {
            const parsedData = JSON.parse(decodeURIComponent(data));
            setTravel(parsedData.travel);
            setUserData({
                address: parsedData.address,
                balance: parsedData.balance,
                chainId: parsedData.chainId,
                chainName: parsedData.chainName,
            });
        }
    }, [searchParams]);

    if (!travel) {
        return <p>Chargement des détails...</p>;
    }

    return (
        <div className="min-h-screen bg-gray-100 p-6">
            <button 
                onClick={() => router.push('/travelList')} 
                className="button-back"
            >
                ← Retour
            </button>

            <div className="max-w-4xl mx-auto bg-white p-6 rounded-lg shadow-lg">
                <h1 className="text-2xl font-bold mb-4">{travel.destination}</h1>
                <p>Type: {travel.type}</p>
                <p>Départ: {travel.depart}</p>
                <p>Compagnie: {travel.compagnyAirLine}</p>
                {travel.hotel && (
                    <p>Hôtel: {travel.hotel.name}, Nuits: {travel.hotel.numberOfNights}</p>
                )}
                <p>Départ: {new Date(travel.dateDepart).toLocaleString()}</p>
                <p>Arrivée: {new Date(travel.dateArrivee).toLocaleString()}</p>
                <p className="font-bold">Prix: {travel.price}</p>
            </div>

            <div style={{ display: 'none' }}>
                <p>Address: {userData?.address}</p>
                <p>Balance: {userData?.balance} ETH</p>
                <p>Chain ID: {userData?.chainId}</p>
                <p>Chain Name: {userData?.chainName}</p>
            </div>
        </div>
    );
}
