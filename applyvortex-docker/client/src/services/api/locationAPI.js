// src/services/api/locationAPI.js

const BASE_URL = "https://api.countrystatecity.in/v1";
const HEADERS = {
    "X-CSCAPI-KEY": import.meta.env.VITE_CSC_API_KEY
};

export const locationAPI = {
    /**
     * Get all countries
     */
    getCountries: async () => {
        try {
            const response = await fetch(`${BASE_URL}/countries`, { headers: HEADERS });
            if (!response.ok) throw new Error("Failed to fetch countries");
            return await response.json();
        } catch (error) {
            console.error("locationAPI.getCountries error:", error);
            throw error;
        }
    },

    /**
     * Get states for a specific country
     * @param {string} countryCode ISO2 code
     */
    getStates: async (countryCode) => {
        if (!countryCode) return [];
        try {
            const response = await fetch(`${BASE_URL}/countries/${countryCode}/states`, { headers: HEADERS });
            if (!response.ok) throw new Error(`Failed to fetch states for ${countryCode}`);
            return await response.json();
        } catch (error) {
            console.error(`locationAPI.getStates(${countryCode}) error:`, error);
            throw error;
        }
    },

    /**
     * Get cities for a specific state in a country
     * @param {string} countryCode ISO2 code
     * @param {string} stateCode ISO2 code
     */
    getCities: async (countryCode, stateCode) => {
        if (!countryCode || !stateCode) return [];
        try {
            const response = await fetch(`${BASE_URL}/countries/${countryCode}/states/${stateCode}/cities`, { headers: HEADERS });
            if (!response.ok) throw new Error(`Failed to fetch cities for ${stateCode}, ${countryCode}`);
            return await response.json();
        } catch (error) {
            console.error(`locationAPI.getCities(${countryCode}, ${stateCode}) error:`, error);
            throw error;
        }
    }
};

export default locationAPI;
