// Fetch top movies and generate the stacked bar chart, grouped by genre
async function fetchDataAndDrawStackedBarChart() {
    const movieDataResponse = await fetch('http://localhost:3000/api/top-movies/all');
    const movieData = await movieDataResponse.json();

    // Group movies by year and aggregate revenue by genre for each year
    const moviesByYear = Object.keys(movieData).map(year => {
        const movies = movieData[year];

        // Create a genre-based aggregation of revenue for the year
        const genreRevenue = {};

        movies.forEach(movie => {
            movie.genres.forEach(genre => {
                if (!genreRevenue[genre]) {
                    genreRevenue[genre] = 0;
                }
                genreRevenue[genre] += movie.revenue;
            });
        });

        // Format data for stacking
        return {
            year: parseInt(year),
            ...genreRevenue
        };
    });

    drawStackedBarChart(moviesByYear);
}

// Function to draw the D3.js stacked bar chart
function drawStackedBarChart(data) {
    const margin = { top: 40, right: 150, bottom: 50, left: 100 };
    const width = 900 - margin.left - margin.right;
    const height = 500 - margin.top - margin.bottom;

    const svg = d3.select("#chart3")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    // Get all unique genres from the data
    const genres = Object.keys(data[0]).filter(key => key !== 'year');

    // Define color scale for genres
    const color = d3.scaleOrdinal()
        .domain(genres)
        .range(d3.schemeCategory10); // Assigns a unique color for each genre

    // X and Y scales
    const x = d3.scaleBand()
        .domain(data.map(d => d.year))
        .range([0, width])
        .padding(0.1);

    const y = d3.scaleLinear()
        .domain([0, d3.max(data, d => d3.sum(genres, genre => d[genre]))])
        .range([height, 0]);

    // Create X axis (years)
    svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x).tickFormat(d3.format("d")));

    // Create Y axis (revenue)
    svg.append("g")
        .call(d3.axisLeft(y).tickFormat(d3.format("$.2s")));

    // Stack the data based on genres
    const stack = d3.stack()
        .keys(genres)
        .value((d, key) => d[key] || 0); // Use 0 if genre is not present in a particular year

    const layers = stack(data);

    // Tooltip setup
    const tooltip = d3.select("#tooltip");

    // Create stacked bars with transitions
    const bars = svg.selectAll(".layer")
        .data(layers)
        .enter()
        .append("g")
        .attr("class", "layer")
        .attr("fill", d => color(d.key))
        .selectAll("rect")
        .data(d => d)
        .enter()
        .append("rect")
        .attr("x", d => x(d.data.year))
        .attr("y", d => y(d[1]))
        .attr("height", d => y(d[0]) - y(d[1]))
        .attr("width", x.bandwidth())
        .on("mouseover", (event, d) => {
            const genre = d3.select(event.target.parentNode).datum().key;
            const revenue = d[1] - d[0];
            tooltip.style("visibility", "visible")
                .html(`<strong>Genre:</strong> ${genre}<br><strong>Revenue:</strong> $${revenue.toLocaleString()}`)
                .style("left", `${event.pageX + 10}px`)
                .style("top", `${event.pageY - 30}px`);
        })
        .on("mousemove", event => {
            tooltip.style("left", `${event.pageX + 10}px`)
                .style("top", `${event.pageY - 30}px`);
        })
        .on("mouseout", () => {
            tooltip.style("visibility", "hidden");
        });

    // Add legend with click functionality to filter genres
    const legend = svg.append("g")
        .attr("transform", `translate(${width + 20}, 0)`);

    let activeGenres = new Set(genres);  // Set of active genres

    legend.selectAll("rect")
        .data(genres)
        .enter()
        .append("rect")
        .attr("x", 0)
        .attr("y", (d, i) => i * 20)
        .attr("width", 18)
        .attr("height", 18)
        .attr("fill", d => color(d))
        .style("cursor", "pointer")
        .on("click", function(event, d) {
            if (activeGenres.has(d)) {
                activeGenres.delete(d);  // Remove genre from active list
                d3.select(this).attr("fill", "#ccc");  // Mark legend as inactive
            } else {
                activeGenres.add(d);  // Add genre back to active list
                d3.select(this).attr("fill", color(d));  // Reset legend color
            }

            // Update the chart based on active genres
            updateBars();
        });

    legend.selectAll("text")
        .data(genres)
        .enter()
        .append("text")
        .attr("x", 24)
        .attr("y", (d, i) => i * 20 + 9)
        .attr("dy", "0.35em")
        .style("cursor", "pointer")
        .text(d => d)
        .on("click", function(event, d) {
            if (activeGenres.has(d)) {
                activeGenres.delete(d);  // Remove genre from active list
                d3.select(this.previousSibling).attr("fill", "#ccc");  // Mark legend as inactive
            } else {
                activeGenres.add(d);  // Add genre back to active list
                d3.select(this.previousSibling).attr("fill", color(d));  // Reset legend color
            }

            // Update the chart based on active genres
            updateBars();
        });

    // Function to update the bars based on the active genres
    function updateBars() {
        const updatedStack = d3.stack()
            .keys(Array.from(activeGenres))
            .value((d, key) => d[key] || 0);

        const updatedLayers = updatedStack(data);

        svg.selectAll(".layer")
            .data(updatedLayers)
            .selectAll("rect")
            .data(d => d)
            .transition()
            .duration(500)  // Smooth transition when filtering
            .attr("y", d => y(d[1]))
            .attr("height", d => y(d[0]) - y(d[1]));
    }
}

// Fetch data and draw the chart on load
fetchDataAndDrawStackedBarChart();
