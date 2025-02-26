// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./TravelToken.sol";

contract TravelAgency is ReentrancyGuard, Ownable {
    uint256 public tokenPrice = 0.001 ether;
    TravelToken public travelToken;
    uint256 private bookingCounter = 0;
    
    struct Booking {
        uint256 reservationNumber;
        uint256 travelId;         
        address traveler;         
        uint256 price;
        bool isHotelIncluded;
        bool isPaid;
        bool isCompleted;
        uint256 bookingDate;
    }
    
    struct Review {
        address reviewer;
        string comment;
        uint8 rating;
        uint256 timestamp;
        bool verified;
    }
    
    mapping(uint256 => Booking) public bookings; // 1 => booking[1]
    mapping(uint256 => uint256) public travelIdToReservationNumber; // travelIdToReservationNumber[num de reservation de l'api] = num créer par le mart contract 
    mapping(address => uint256[]) public customerBookings; //il stoque genre chaques adresse as une reservation 
    mapping(uint256 => Review[]) public bookingReviews; // tableau de tt les commentaires de reservation 
    mapping(address => bool) public hasReviewed; // si il as laisser un avis 
    
    //pour les allerte 
    event ReservationCreated(uint256 indexed reservationNumber, uint256 indexed travelId, address indexed traveler);
    event PaymentReceived(uint256 indexed reservationNumber, uint256 amount);
    event BookingCompleted(uint256 indexed reservationNumber);
    event ReviewAdded(uint256 indexed reservationNumber, address indexed reviewer, uint8 rating);
    event BookingCompletedAndVerified(uint256 indexed reservationNumber, address indexed traveler);
    
    //je initialise le contract 
    constructor(address _tokenAddress) Ownable(msg.sender) {
        travelToken = TravelToken(_tokenAddress);
    }
    
    //generer un id pour reservation 
    function generateReservationNumber() private returns (uint256) {
        bookingCounter++;
        return bookingCounter;
    }
    

function processPayment(address _traveler, uint256 _amount) private returns (bool) {
    uint256 tokenAmount = _amount * 10 ** 18; //c'est comme ça que ça marche le tocken ERC20 pour generer les decimal 
    require(travelToken.balanceOf(_traveler) >= tokenAmount, "Insufficient tokens");
    require(travelToken.allowance(_traveler, address(this)) >= tokenAmount, "Not approved");//allowance elle ous permet de vérifier si on as approuver genre l'adresse a donner l'autorisation au contrat d'etuliser ses tocken 
    require(travelToken.transferFrom(_traveler, address(this), tokenAmount), "Payment failed"); //pour faire le transfert des tockens 
    return true;
}

function createReservation(
   uint256 _travelId,
   address _travelerAddress,
   bool _isHotelIncluded
) external onlyOwner returns (uint256) {
   require(_travelerAddress != address(0), "Invalid traveler address");
   require(travelIdToReservationNumber[_travelId] == 0, "Travel ID already booked");
   
   //uint256 _price = getTravelPrice(_travelId); // la on doit faire l'appelle a l'api 
   uint256 _price =1; //c'est juste pour tester mais sinon on prend le commentaire en haut 
   require(_price > 0, "Invalid price");
   
   processPayment(_travelerAddress, _price);
   
   uint256 reservationNumber = generateReservationNumber();
   
   Booking memory newBooking = Booking({
       reservationNumber: reservationNumber,
       travelId: _travelId,
       traveler: _travelerAddress,
       price: _price,
       isHotelIncluded: _isHotelIncluded,
       isPaid: true,
       isCompleted: false,
       bookingDate: block.timestamp
   });
   
   bookings[reservationNumber] = newBooking;
   travelIdToReservationNumber[_travelId] = reservationNumber;
   customerBookings[_travelerAddress].push(reservationNumber);// pour generer la liste des reservation d'un client 
   
   emit ReservationCreated(reservationNumber, _travelId, _travelerAddress);
   emit PaymentReceived(reservationNumber, _price * 10 ** 18);
   
   return reservationNumber;
}

/*function getTravelPrice(uint256 _travelId) internal view returns (uint256) {
   return 1 ether;
}*/
    
   function getReservationDetails(uint256 _reservationNumber) external view returns (
        uint256 travelId,
        address traveler,
        uint256 price,
        bool isHotelIncluded,
        bool isPaid,
        bool isCompleted,
        uint256 bookingDate
    ) {
        Booking memory booking = bookings[_reservationNumber];
        return (
            booking.travelId,
            booking.traveler,
            booking.price,
            booking.isHotelIncluded,
            booking.isPaid,
            booking.isCompleted,
            booking.bookingDate
        );
    }
    function getReservationNumberByTravelId(uint256 _travelId) external view returns (uint256) {
        return travelIdToReservationNumber[_travelId];
    }

    function getCustomerBookings(address _customer) external view returns (uint256[] memory) {
        return customerBookings[_customer];
    }
    
    function completeBooking(uint256 _reservationNumber) external onlyOwner {
        Booking storage booking = bookings[_reservationNumber];
        require(booking.isPaid, "Booking not paid");
        require(!booking.isCompleted, "Already completed");  
        booking.isCompleted = true;
        emit BookingCompletedAndVerified(_reservationNumber, booking.traveler);
    }

    function addReview(uint256 _reservationNumber, string memory _comment, uint8 _rating) external {
        Booking storage booking = bookings[_reservationNumber];
        require(booking.isCompleted, "Booking not completed");
        require(booking.traveler == msg.sender, "Only the traveler can review");
        require(_rating >= 1 && _rating <= 5, "Rating must be between 1 and 5");
        require(!hasReviewed[msg.sender], "Already reviewed");
        
        Review memory newReview = Review({
            reviewer: msg.sender,
            comment: _comment,
            rating: _rating,
            timestamp: block.timestamp,
            verified: true
        });
        
        bookingReviews[_reservationNumber].push(newReview);
        hasReviewed[msg.sender] = true;
        
        emit ReviewAdded(_reservationNumber, msg.sender, _rating);
    }

    function getReviews(uint256 _reservationNumber) external view returns (Review[] memory) {
        return bookingReviews[_reservationNumber];
    }
}