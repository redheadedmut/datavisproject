import express from 'express'; // Import express
import fetch from 'node-fetch'; // Import node-fetch

const app = express();
const PORT = 3000;

// Middleware to serve static files from the public directory
app.use(express.static('public'));

const fredApiKey = 'd74aa68579c6cde2bc68ff66cf93b951'; // Replace with your actual API key
const tmdbApiKey = '79fbbd417c17755325c1335c37da7270';


// Route to fetch FRED data
app.get('/api/fred', async (req, res) => {
    const seriesId = 'GDP'; // You can change this to any valid series ID
    const apiUrl = `https://api.stlouisfed.org/fred/series/observations?series_id=${seriesId}&api_key=${fredApiKey}&file_type=json`;

    try {
        const response = await fetch(apiUrl);
        if (!response.ok) {
            return res.status(response.status).json({ error: 'Error fetching data from FRED' });
        }
        const data = await response.json();
        res.json(data); // Send the data as JSON response
    } catch (error) {
        console.error('Error fetching FRED data:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// const fetchMovieDetails = async (movieId) => {
//     const apiUrl = `https://api.themoviedb.org/3/movie/${movieId}?api_key=${tmdbApiKey}&language=en-US`;

//     const response = await fetch(apiUrl);
//     if (!response.ok) {
//         throw new Error('Error fetching movie details from TMDb');
//     }
//     return response.json();
// };

// Function to fetch movie details, including genres
const fetchMovieDetails = async (movieId) => {
    const apiUrl = `https://api.themoviedb.org/3/movie/${movieId}?api_key=${tmdbApiKey}&language=en-US`;

    try {
        const response = await fetch(apiUrl);
        if (!response.ok) {
            throw new Error('Error fetching movie details from TMDb');
        }
        const movie = await response.json();

        // Return movie details including genres
        return {
            title: movie.title,
            revenue: movie.revenue || 0, // Use 0 if revenue is not available
            release_date: movie.release_date,
            genres: movie.genres.map(genre => genre.name) // Extract the genre names
        };
    } catch (error) {
        console.error('Error fetching movie details:', error);
        return null; // Return null in case of an error
    }
};


// // Function to fetch top 10 movies by revenue for a given year
// const fetchTopMoviesByYear = async (year) => {
//     const apiUrl = `https://api.themoviedb.org/3/discover/movie?api_key=${tmdbApiKey}&language=en-US&sort_by=revenue.desc&primary_release_year=${year}&page=1`;

//     const response = await fetch(apiUrl);
//     if (!response.ok) {
//         throw new Error('Error fetching data from TMDb');
//     }
//     const data = await response.json();

//     // Get the top 10 movies by revenue
//     const topMovies = data.results.slice(0, 10);
    
//     // Fetch additional details for each movie to get revenue
//     const detailedMovies = await Promise.all(topMovies.map(movie => fetchMovieDetails(movie.id)));

//     return detailedMovies.map(movie => ({
//         title: movie.title,
//         revenue: movie.revenue || 0, // Use 0 if revenue is not available
//         release_date: movie.release_date,
//     }));
// };

// Fetch top 10 movies by revenue for a given year
const fetchTopMoviesByYear = async (year) => {
    const apiUrl = `https://api.themoviedb.org/3/discover/movie?api_key=${tmdbApiKey}&language=en-US&sort_by=revenue.desc&primary_release_year=${year}&page=1`;

    try {
        const response = await fetch(apiUrl);
        if (!response.ok) {
            throw new Error('Error fetching data from TMDb');
        }
        const data = await response.json();

        // Get the top 10 movies by revenue
        const topMovies = data.results.slice(0, 10);

        // Fetch additional details for each movie, including genres
        const detailedMovies = await Promise.all(topMovies.map(movie => fetchMovieDetails(movie.id)));

        return detailedMovies; // Now includes genres for each movie
    } catch (error) {
        console.error('Error fetching top movies by year:', error);
        return [];
    }
};


// Route to fetch top 10 movies by revenue for all available years
app.get('/api/top-movies/all', async (req, res) => {
    const currentYear = new Date().getFullYear();
    const startYear = 2000; // Adjust this to the earliest year you want to start from
    const allTopMovies = {};

    try {
        for (let year = startYear; year <= currentYear; year++) {
            const topMovies = await fetchTopMoviesByYear(year);
            allTopMovies[year] = topMovies; // Store the top movies for each year
        }

        console.log("All top movies data:", allTopMovies);  // Log the data to check if the server has it

        res.json(allTopMovies); // Send the top movies for all years as JSON response
    } catch (error) {
        console.error('Error fetching TMDb data:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
