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

interface TransactionStatus {
    loading: boolean;
    error: string | null;
    success: boolean;
    step: 'idle' | 'buying' | 'approving' | 'reserving' | 'completed';
    message: string;
}

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

    const [txStatus, setTxStatus] = useState<TransactionStatus>({
        loading: false,
        error: null,
        success: false,
        step: 'idle',
        message: ''
    });

    const handleBuyTokens = async () => {
        if (!travel?.price) return;
        
        try {
            setTxStatus({
                loading: true,
                error: null,
                success: false,
                step: 'buying',
                message: 'Initialisation de l\'achat de tokens...'
            });
            
            const priceInWei = parseEther(travel.price);
            
            setTxStatus(prev => ({
                ...prev,
                message: 'Veuillez confirmer la transaction dans votre wallet...'
            }));

            const hash = await buyTokens(priceInWei);

            setTxStatus(prev => ({
                ...prev,
                message: 'Transaction en cours. Attente de confirmation...'
            }));

            await publicClient.waitForTransactionReceipt({ hash });
            
            setTxStatus({
                loading: false,
                error: null,
                success: true,
                step: 'completed',
                message: 'Tokens achetés avec succès!'
            });

            // Auto-hide success message after 5 seconds
            setTimeout(() => {
                setTxStatus(prev => ({
                    ...prev,
                    message: '',
                    step: 'idle'
                }));
            }, 5000);

        } catch (error) {
            console.error('Error buying tokens:', error);
            setTxStatus({
                loading: false,
                error: 'Échec de l\'achat de tokens. Veuillez réessayer.',
                success: false,
                step: 'idle',
                message: ''
            });
        }
    };

    const handleReserve = async () => {
        if (!travel?.id || !address || !travel.price) return;
        
        try {
            setTxStatus({
                loading: true,
                error: null,
                success: false,
                step: 'reserving',
                message: 'Création de la réservation...'
            });
            
            const hash = await createReservation(
                travel.id,
                address as `0x${string}`,
                !!travel.hotel,
                travel.price
            );

            setTxStatus(prev => ({
                ...prev,
                message: 'Réservation en cours de confirmation...'
            }));

            await publicClient.waitForTransactionReceipt({ hash });
            
            setTxStatus({
                loading: false,
                error: null,
                success: true,
                step: 'completed',
                message: 'Réservation confirmée avec succès!'
            });

            // Redirect after successful reservation
            setTimeout(() => {
                router.push('/travelList');
            }, 3000);

        } catch (error) {
            console.error('Error creating reservation:', error);
            setTxStatus({
                loading: false,
                error: 'Échec de la réservation. Veuillez réessayer.',
                success: false,
                step: 'idle',
                message: ''
            });
        }
    };

    const getStatusColor = () => {
        if (txStatus.error) return 'bg-red-100 text-red-700';
        if (txStatus.success) return 'bg-green-100 text-green-700';
        return 'bg-blue-100 text-blue-700';
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
                
                {txStatus.message && (
                    <div className={`mt-4 p-4 rounded ${getStatusColor()}`}>
                        <div className="flex items-center">
                            {txStatus.loading && (
                                <svg className="" viewBox="">
                                </svg>
                            )}
                            <span>{txStatus.message}</span>
                        </div>
                    </div>
                )}

                <div className="mt-6 space-y-4">
                    <button 
                        onClick={handleBuyTokens}
                        disabled={txStatus.loading}
                        className={`w-full px-4 py-2 text-white rounded transition-all
                            ${txStatus.loading 
                                ? 'bg-gray-400 cursor-not-allowed' 
                                : 'bg-blue-500 hover:bg-blue-600'}`}
                    >
                        {txStatus.loading && txStatus.step === 'buying' 
                            ? 'Transaction en cours...' 
                            : 'Acheter des Tokens'}
                    </button>
                    
                    <button
                        onClick={handleReserve}
                        disabled={txStatus.loading || !tokenBalance || tokenBalance < parseEther(travel?.price || '0')}
                        className={`w-full px-4 py-2 text-white rounded transition-all
                            ${txStatus.loading || !tokenBalance || tokenBalance < parseEther(travel?.price || '0')
                                ? 'bg-gray-400 cursor-not-allowed'
                                : 'bg-green-500 hover:bg-green-600'}`}
                    >
                        {txStatus.loading && txStatus.step === 'reserving'
                            ? 'Réservation en cours...'
                            : 'Confirmer la Réservation'}
                    </button>
                </div>

                {txStatus.error && (
                    <div className="mt-4 p-4 bg-red-100 text-red-700 rounded">
                        {txStatus.error}
                    </div>
                )}

                <div className="mt-4 text-sm text-gray-600">
                    <p>Balance actuelle: {tokenBalance ? Number(tokenBalance) / 10**18 : 0} TRVL</p>
                    <p>Prix du voyage: {travel?.price} TRVL</p>
                </div>
            </div>
        </div>
    );
}