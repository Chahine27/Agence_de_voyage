'use client';

import React, { useEffect, useState } from 'react';
import { useAccount, useDisconnect, useBalance, usePublicClient } from 'wagmi';
import { useRouter } from 'next/navigation';
import { fetchTravelOffers } from '@/api';
import { useTravelToken, useTravelAgency } from '@/lib/web3/hooks/useContract';
import { CONTRACT_ADDRESSES } from '@/contracts/addresses';
import { parseEther } from 'viem';

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
    hotel: Hotel | null;
    compagnyAirLine: string;
    dateDepart: string;
    dateArrivee: string;
};

export default function TravelList() {
    // États existants
    const [showMenu, setShowMenu] = useState(false);
    const [travels, setTravels] = useState<Travel[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [dateFilter, setDateFilter] = useState('');
    const [includeHotel, setIncludeHotel] = useState(false);
    // Nouveaux états
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Hooks existants
    const { address } = useAccount();
    const { disconnect } = useDisconnect();
    const { data: balance } = useBalance({ address });
    const router = useRouter();
    const publicClient = usePublicClient();
    // Nouveaux hooks pour les smart contracts
    const { contract: travelToken, buyTokens } = useTravelToken();
    const { contract: travelAgency } = useTravelAgency();

    useEffect(() => {
        const loadData = async () => {
            try {
                const offers = await fetchTravelOffers();
                setTravels(offers);
            } catch (err) {
                console.error('Erreur chargement voyages:', err);
                setError('Erreur lors du chargement des voyages');
            }
        };
        
        loadData();
    }, []);

    const handleDisconnect = async () => {
        await disconnect();
        router.push('/');
    };

    // Nouvelle fonction de réservation
    const handleBooking = async (travel: Travel) => {
        if (!address) {
            alert('Veuillez connecter votre wallet');
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            // 1. Vérifier les tokens
            const priceInWei = parseEther(travel.price);
            const userBalance = await travelToken?.balanceOf(address);
            
            if (!userBalance || userBalance < priceInWei) {
                // Si pas assez de tokens, en acheter
                await buyTokens(priceInWei);
            }
            
            // 2. Approuver les tokens
            const approveTx = await travelToken?.approve(
                CONTRACT_ADDRESSES.TravelAgency, 
                priceInWei
            );
            await approveTx?.wait();
            
            // 3. Créer la réservation
            const reservationTx = await travelAgency?.createReservation(
                travel.id,
                address,
                travel.hotel !== null
            );
            await reservationTx?.wait();

            alert('Réservation effectuée avec succès !');
            router.push(`/profile/${address}`);
            
        } catch (error) {
            console.error('Erreur réservation:', error);
            setError('Erreur lors de la réservation. Veuillez réessayer.');
        } finally {
            setIsLoading(false);
        }
    };

    const filteredTravels = travels.filter(travel => {
        const dateMatch = dateFilter 
            ? new Date(travel.dateDepart).toLocaleDateString() === new Date(dateFilter).toLocaleDateString() 
            : true;
        const hotelMatch = includeHotel ? travel.hotel?.name : true;
    
        return (
            (travel.destination.toLowerCase().includes(searchTerm.toLowerCase()) ||
            travel.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
            travel.compagnyAirLine.toLowerCase().includes(searchTerm.toLowerCase())) &&
            dateMatch && hotelMatch
        );
    });    

    return (
        <div className="min-h-screen bg-gray-100 p-6">
            <div className="max-w-6xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <div className="relative">
                        <button
                            onClick={() => setShowMenu(!showMenu)}
                            className="button-menu px-4 py-2 rounded-md hover:bg-blue-700"
                            disabled={isLoading}
                        >
                            Menu
                        </button>
                        {showMenu && (
                            <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1">
                                <button
                                    onClick={() => router.push(`/profile/${address}`)}
                                    className="button-profile block w-full text-left px-4 py-2 hover:bg-gray-100"
                                >
                                    Voir Profil
                                </button>
                                <button
                                    onClick={handleDisconnect}
                                    className="button-disconnect block w-full text-left px-4 py-2 hover:bg-gray-100"
                                >
                                    Déconnexion
                                </button>
                            </div>
                        )}
                        <p>Address: {address}</p>
                        <p>Balance: {balance?.formatted} BNB</p>
                        <p>Chain ID: {publicClient.chain?.id}</p>
                        <p>Chain Name: {publicClient.chain?.name}</p>
                    </div>
                </div>

                <h1 className="text-3xl font-bold">Voyages disponibles :</h1>

                {/* Message d'erreur global */}
                {error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
                        {error}
                    </div>
                )}

                <input
                    type="text"
                    placeholder="Rechercher par destination"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="input-search"
                    disabled={isLoading}
                />
                <br />
                <label>
                    Inclure les voyages avec hôtel
                    <input
                        type="checkbox"
                        checked={includeHotel}
                        onChange={(e) => setIncludeHotel(e.target.checked)}
                        className="checkbox"
                    />
                </label>

                <div className="grid-container">
                    {filteredTravels.map((travel) => (
                        <div
                            key={travel.id}
                            className="travel-card"
                        >
                            <h2 style={{color: 'black'}}>{travel.destination}</h2>
                            <p style={{color: 'black'}}>Type: {travel.type}</p>
                            <p style={{color: 'black'}}>Départ: {travel.depart}</p>
                            <p style={{color: 'black'}}>Compagnie: {travel.compagnyAirLine}</p>
                            <p style={{color: 'black'}}>
                                Hotel: {travel.hotel?.name || 'Non inclus'}
                                {travel.hotel && `, Nuits: ${travel.hotel.numberOfNights}`}
                            </p>
                            <p style={{color: 'black'}}>Départ: {new Date(travel.dateDepart).toLocaleString()}</p>
                            <p style={{color: 'black'}}>Arrivée: {new Date(travel.dateArrivee).toLocaleString()}</p>
                            <p style={{color: 'black'}}>Prix: {travel.price} BNB</p>
                            <button
                                className="button-reserve"
                                onClick={() => handleBooking(travel)}
                                disabled={isLoading}
                            >
                                {isLoading ? 'Traitement en cours...' : 'Réserver'}
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}