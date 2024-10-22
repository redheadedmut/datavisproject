// Fetch movie data and generate the bubble chart
async function fetchDataAndDrawBubbleChart() {
  const movieDataResponse = await fetch('http://localhost:3000/api/top-movies/all');
  const movieData = await movieDataResponse.json();

  // Convert movie data into a list of movies with relevant information
  const movies = Object.keys(movieData).flatMap(year => {
      return movieData[year].map(movie => ({
          year: parseInt(year),
          name: movie.title,
          revenue: movie.revenue
      }));
  });

  drawBubbleChart(movies);
}

// Function to draw the D3.js bubble chart
function drawBubbleChart(data) {
  const margin = { top: 20, right: 40, bottom: 50, left: 80 };
  const width = 900 - margin.left - margin.right;
  const height = 500 - margin.top - margin.bottom;

  const svg = d3.select("#chart")
      .append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

  // Set the ranges for the x and y axes
  const x = d3.scaleTime()
      .domain(d3.extent(data, d => new Date(d.year, 0, 1)))
      .range([0, width]);

  const y = d3.scaleLinear()
      .domain([0, d3.max(data, d => d.revenue)])
      .range([height, 0]);

  // Scale for the bubble size
  const sizeScale = d3.scaleSqrt()
      .domain([0, d3.max(data, d => d.revenue)])
      .range([5, 40]);  // Adjust bubble size range

  // Create X axis (time)
  svg.append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x).ticks(10));

  // Create Y axis (revenue)
  svg.append("g")
      .call(d3.axisLeft(y).tickFormat(d3.format("$.2s")));

  // Create the tooltip
  const tooltip = d3.select("#tooltip");

  // Create bubbles
  svg.selectAll("circle")
      .data(data)
      .enter()
      .append("circle")
      .attr("cx", d => x(new Date(d.year, 0, 1)))
      .attr("cy", d => y(d.revenue))
      .attr("r", d => sizeScale(d.revenue))
      .attr("fill", "steelblue")
      .attr("stroke", "black")
      .attr("opacity", 0.7)
      .on("mouseover", function (event, d) {
          d3.select(this).attr("stroke", "red").attr("stroke-width", 3);
          tooltip
              .style("display", "block")
              .html(`<strong>${d.name}</strong><br>Revenue: $${d.revenue.toLocaleString()}`)
              .style("left", (event.pageX + 5) + "px")
              .style("top", (event.pageY - 40) + "px");
      })
      .on("mouseout", function () {
          d3.select(this).attr("stroke", "black").attr("stroke-width", 1);
          tooltip.style("display", "none");
      });

  // Highlight "blockbuster" movies with an annotation (e.g., movies with revenue over $1B)
  const blockbusterMovies = data.filter(d => d.revenue > 1000000000);  // Change threshold as needed

  blockbusterMovies.forEach(d => {
      svg.append("text")
          .attr("x", x(new Date(d.year, 0, 1)))
          .attr("y", y(d.revenue) - 10)
          .attr("class", "annotation")
          .text(`💥 ${d.name}`);
  });
}

// Fetch data and draw the chart on load
fetchDataAndDrawBubbleChart();
