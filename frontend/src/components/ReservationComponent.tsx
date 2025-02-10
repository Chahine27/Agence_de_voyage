'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAccount, useBalance, usePublicClient } from 'wagmi';
import { parseEther } from 'viem';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Button } from '../components/ui/button';
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
    const [userData, setUserData] = useState<{ 
        address: string; 
        balance: string; 
        chainId: number; 
        chainName: string 
    } | null>(null);
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<string>('');
    const [error, setError] = useState<string>('');

    // Hooks Web3
    const { address } = useAccount();
    const { data: balance } = useBalance({ address });
    const publicClient = usePublicClient();
    const { buyTokens, balance: tokenBalance } = useTravelToken();
    const { createReservation } = useTravelAgency();

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

    const handleBuyTokens = async () => {
        if (!travel?.price) return;
        setError('');
        
        try {
            setLoading(true);
            setStatus('Initiating token purchase...');
            
            const priceInWei = parseEther(travel.price);
            
            setStatus('Please confirm the transaction in your wallet...');
            const hash = await buyTokens(priceInWei);

            setStatus('Waiting for transaction confirmation...');
            await publicClient.waitForTransactionReceipt({ hash });
            
            setStatus('Tokens purchased successfully!');
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
            setStatus('Creating reservation...');
            
            const hash = await createReservation(
                travel.id,
                address as `0x${string}`,
                !!travel.hotel,
                travel.price
            );

            setStatus('Waiting for reservation confirmation...');
            await publicClient.waitForTransactionReceipt({ hash });
            
            setStatus('Reservation completed successfully!');
            setTimeout(() => {
                router.push('/travelList');
            }, 2000);
        } catch (error) {
            console.error('Error creating reservation:', error);
            setError('Failed to create reservation. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (!travel) {
        return <p>Chargement des détails...</p>;
    }

    if (!address) {
        return (
            <Alert variant="destructive">
                <AlertDescription>
                    Please connect your wallet to make a reservation
                </AlertDescription>
            </Alert>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100 p-6">
            <button 
                onClick={() => router.push('/travelList')} 
                className="mb-6 px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
            >
                ← Retour
            </button>

            <div className="max-w-4xl mx-auto space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>{travel.destination}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            <p>Type: {travel.type}</p>
                            <p>Départ: {travel.depart}</p>
                            <p>Compagnie: {travel.compagnyAirLine}</p>
                            {travel.hotel && (
                                <p>Hôtel: {travel.hotel.name}, Nuits: {travel.hotel.numberOfNights}</p>
                            )}
                            <p>Départ: {new Date(travel.dateDepart).toLocaleString()}</p>
                            <p>Arrivée: {new Date(travel.dateArrivee).toLocaleString()}</p>
                            <p className="font-bold">Prix: {travel.price} TRVL</p>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Complete Your Reservation</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="grid gap-2">
                                <p>Current Balance: {balance?.formatted} BNB</p>
                                <p>Token Balance: {tokenBalance ? Number(tokenBalance) / 10**18 : 0} TRVL</p>
                                
                                {status && (
                                    <Alert>
                                        <AlertDescription>{status}</AlertDescription>
                                    </Alert>
                                )}
                                
                                {error && (
                                    <Alert variant="destructive">
                                        <AlertDescription>{error}</AlertDescription>
                                    </Alert>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Button 
                                    onClick={handleBuyTokens}
                                    disabled={loading}
                                    className="w-full"
                                >
                                    {loading ? 'Processing...' : 'Buy Travel Tokens'}
                                </Button>

                                <Button
                                    onClick={handleReserve}
                                    disabled={loading || !tokenBalance || tokenBalance < parseEther(travel.price)}
                                    className="w-full"
                                >
                                    {loading ? 'Processing...' : 'Confirm Reservation'}
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}