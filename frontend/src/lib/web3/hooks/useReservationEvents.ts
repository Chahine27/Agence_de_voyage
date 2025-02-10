// Dans useReservationEvents.ts

import { useEffect, useState } from 'react';
import { usePublicClient, useAccount } from 'wagmi';
import { getAddresses } from '../contracts/addresses';

export function useReservationEvents() {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const [reservations, setReservations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const addresses = getAddresses(publicClient.chain.id);

  const fetchReservations = async () => {
    if (!address) return;
    
    try {
      // 1. D'abord, récupérer tous les numéros de réservation pour cet utilisateur
      const bookingNumbers = await publicClient.readContract({
        address: addresses.TravelAgency,
        abi: TravelAgencyABI,
        functionName: 'getCustomerBookings',
        args: [address]
      });

      console.log("Booking numbers:", bookingNumbers);

      if (bookingNumbers && bookingNumbers.length > 0) {
        // 2. Pour chaque numéro, récupérer les détails
        const details = await Promise.all(
          bookingNumbers.map(async (bookingNumber) => {
            const reservationDetails = await publicClient.readContract({
              address: addresses.TravelAgency,
              abi: TravelAgencyABI,
              functionName: 'getReservationDetails',
              args: [bookingNumber]
            });

            return {
              reservationNumber: bookingNumber,
              travelId: reservationDetails[0],
              traveler: reservationDetails[1],
              price: reservationDetails[2],
              isHotelIncluded: reservationDetails[3],
              isPaid: reservationDetails[4],
              isCompleted: reservationDetails[5],
              bookingDate: reservationDetails[6]
            };
          })
        );

        setReservations(details);
      }
    } catch (error) {
      console.error("Error fetching reservations:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReservations();
  }, [address, publicClient]);

  return { reservations, isLoading, fetchReservations };
}