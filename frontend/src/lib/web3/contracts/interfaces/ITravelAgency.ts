// VM 
export interface IBooking {
    reservationNumber: bigint;
    travelId: bigint;
    traveler: string;
    price: bigint;
    isHotelIncluded: boolean;
    isPaid: boolean;
    isCompleted: boolean;
    bookingDate: bigint;
  }
  
  export interface IReview {
    reviewer: string;
    comment: string;
    rating: number;
    timestamp: bigint;
    verified: boolean;
  }
  
  export interface ITravelAgency {
    // Fonctions de réservation
    createReservation(
      travelId: number, 
      travelerAddress: string,
      isHotelIncluded: boolean
    ): Promise<bigint>;
  
    // Fonctions de consultation
    getReservationDetails(reservationNumber: bigint): Promise<IBooking>;
    getReservationNumberByTravelId(travelId: bigint): Promise<bigint>;
    getCustomerBookings(customer: string): Promise<bigint[]>;
    
    // Fonctions de gestion des avis
    addReview(
      reservationNumber: bigint,
      comment: string,
      rating: number
    ): Promise<void>;
    
    getReviews(reservationNumber: bigint): Promise<IReview[]>;
    
    // Fonctions de complétion
    completeBooking(reservationNumber: bigint): Promise<void>;
    
    // Getters publics
    tokenPrice(): Promise<bigint>;
    bookings(reservationNumber: bigint): Promise<IBooking>;
    hasReviewed(address: string): Promise<boolean>;
  }