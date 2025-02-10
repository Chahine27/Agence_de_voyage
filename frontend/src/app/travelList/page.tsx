'use client';

import React, { useEffect, useState } from 'react';
import { useAccount, useDisconnect, useBalance, usePublicClient } from 'wagmi';
import { useRouter } from 'next/navigation';
import { fetchTravelOffers } from '../api';

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
    hotel: Hotel;
    compagnyAirLine: string;
    dateDepart: string;
    dateArrivee: string;
};

export default function TravelList() {
    const { address } = useAccount();
    const { disconnect } = useDisconnect();
    const { data: balance } = useBalance({ address });
    const router = useRouter();
    const [showMenu, setShowMenu] = useState(false);
    const [travels, setTravels] = useState<Travel[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const publicClient = usePublicClient();
    const [dateFilter, setDateFilter] = useState('');
    const [includeHotel, setIncludeHotel] = useState(false);


    useEffect(() => {
        const loadData = async () => {
            const offers = await fetchTravelOffers();
            setTravels(offers); // Assurez-vous que les données de l'API correspondent au type Travel
        };
        
        loadData();
    }, []);

    const handleDisconnect = async () => {
        await disconnect();
        router.push('/');
    };

    const filteredTravels = travels.filter(travel => {
        const dateMatch = dateFilter ? new Date(travel.dateDepart).toLocaleDateString() === new Date(dateFilter).toLocaleDateString() : true;
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
                        <p>Balance: {balance?.formatted} ETH</p>
                        <p>Chain ID: {publicClient.chain?.id}</p>
                        <p>Chain Name: {publicClient.chain?.name}</p>
                    </div>
                </div>
                <h1 className="text-3xl font-bold">Voyages disponibles :</h1>

                <input
                    type="text"
                    placeholder="Rechercher par destination"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="input-search"
                /> <br></br>
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
                            <p style={{color: 'black'}}>Hotel: {travel.hotel?.name || undefined}, Nuits: {travel.hotel?.numberOfNights || undefined}</p>
                            <p style={{color: 'black'}}>Départ: {new Date(travel.dateDepart).toLocaleString()}</p>
                            <p style={{color: 'black'}}>Arrivée: {new Date(travel.dateArrivee).toLocaleString()}</p>
                            <p style={{color: 'black'}}>Prix: {travel.price}</p>
                            <button
                                className="button-reserve"
                                onClick={() => {
                                    const reservationData = {
                                        travel,
                                        address,
                                        balance: balance?.formatted,
                                        chainId: publicClient.chain?.id,
                                        chainName: publicClient.chain?.name,
                                    };
                                    router.push(`/reservationDetail?data=${encodeURIComponent(JSON.stringify(reservationData))}`);
                                }}
                            >
                                Réserver
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
