import axios from 'axios';

const API_BASE_URL = 'https://fake-traveloffre-api.vercel.app';

export const fetchTravelOffers = async () => {
    try {
        const response = await axios.get(`${API_BASE_URL}/offres`);
        console.log("response", response)
        return response.data;
    } catch (error) {
        console.error("Error fetching travel offers:", error);
        return [];
    }
};
