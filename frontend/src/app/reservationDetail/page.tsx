'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAccount, useBalance, usePublicClient } from 'wagmi';
import { parseEther } from 'viem';
import { useTravelToken, useTravelAgency } from '@/lib/web3/hooks/useContract';

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
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string>('');

    // Récupération des informations du compte
    const { address } = useAccount();
    const { data: balance } = useBalance({ address });
    const publicClient = usePublicClient();
    const { buyTokens, balance: tokenBalance } = useTravelToken();
    const { createReservation } = useTravelAgency();

    // Ajout des fonctions de gestion des transactions
    const handleBuyTokens = async () => {
        if (!travel?.price) return;
        setError('');
        
        try {
            setLoading(true);
            const priceInWei = parseEther(travel.price);
            const hash = await buyTokens(priceInWei);
            await publicClient.waitForTransactionReceipt({ hash });
        } catch (error) {
            console.error('Error buying tokens:', error);
            setError('Failed to purchase tokens. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleReserve = async () => {
        if (!travel?.id || !address || !travel.price) return;
        setError('');
        
        try {
            setLoading(true);
            const hash = await createReservation(
                travel.id,
                address as `0x${string}`,
                !!travel.hotel,
                travel.price
            );
            await publicClient.waitForTransactionReceipt({ hash });
            router.push('/travelList');
        } catch (error) {
            console.error('Error creating reservation:', error);
            setError('Failed to create reservation. Please try again.');
        } finally {
            setLoading(false);
        }
    };

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
                <p className="font-bold">Prix: {travel.price} TRVL</p>

                <div className="mt-6 space-y-4">
                    <button 
                        onClick={handleBuyTokens}
                        disabled={loading}
                        className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400"
                    >
                        {loading ? 'Processing...' : 'Buy Travel Tokens'}
                    </button>
                    
                    <button
                        onClick={handleReserve}
                        disabled={loading || !tokenBalance || tokenBalance < parseEther(travel.price)}
                        className="w-full px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-gray-400"
                    >
                        {loading ? 'Processing...' : 'Confirm Reservation'}
                    </button>
                </div>

                {error && (
                    <div className="mt-4 p-4 bg-red-100 text-red-700 rounded">
                        {error}
                    </div>
                )}
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