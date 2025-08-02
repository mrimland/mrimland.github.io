const margin = { top: 30, right: 30, bottom: 100, left: 150 };
const width = 900 - margin.left - margin.right;
const height = 600 - margin.top - margin.bottom;

let svg = d3.select("#visual")
  .append("svg")
  .attr("width", 900)
  .attr("height", 600)
  .append("g")
  .attr("transform", `translate(${margin.left},${margin.top})`);

let data = [];
let platforms = new Set();
document.addEventListener("DOMContentLoaded", () => {
    svg = d3.select("#visual")
        .append("svg")
        .attr("width", 900)
        .attr("height", 600)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    d3.csv("data/vgsales.csv").then(raw => {
        data = raw
            .filter(d => d.Year && !isNaN(+d.Year) && +d.Global_Sales > 0 && d.Platform.length > 1)
            .map(d => ({
            name: d.Name,
            year: +d.Year,
            platform: d.Platform,
            naSales: +d.NA_Sales,
            euSales: +d.EU_Sales,
            jpSales: +d.JP_Sales,
            globalSales: +d.Global_Sales
    }));
  // Get unique platforms for filter
  var plat = new Set();
  data.forEach(d => {
        platforms.add(d.platform)});
  updatePlatformDropdown();

  // Initial render
  updateChart();
  
  // Event listeners
  d3.selectAll("#decade, #platform").on("change", updateChart);
});

});
function updatePlatformDropdown() {
  const platformSelect = d3.select("#platform");
  platforms.forEach(p => {
    platformSelect.append("option")
      .attr("value", p)
      .text(p);
  });
}

function updateChart() {
  const decade = d3.select("#decade").node().value;
  const platform = d3.select("#platform").node().value;
  const region = d3.select("#region").node().value;

  let filtered = data;

  if (decade !== "all") {
    const decadeStart = +decade;
    filtered = filtered.filter(d => d.year >= decadeStart && d.year < decadeStart + 10);
  }

  

  if (platform !== "all") {
    filtered = filtered.filter(d => d.platform === platform);
  }

  const topGames = filtered
    .sort((a, b) => {
        switch (region) {
            case "naSales": 
                return d3.descending(a.naSales, b.naSales);
            case "euSales":
                return d3.descending(a.euSales, b.euSales);
            case "jpSales":
                return d3.descending(a.jpSales, b.jpSales);
            default:
                return d3.descending(a.globalSales, b.globalSales);
    }})
    .slice(0, 20);

  for(var i = 0; i < 20; i++) {
    console.log(topGames[i]);
  }
  drawBarChart(topGames, region);
}

function drawBarChart(games, regionSales) {
  // Scales
  const x = d3.scaleLinear()
    .domain([0, d3.max(games, d => d[regionSales])])
    .range([0, width]);

  const y = d3.scaleBand()
    .domain(games.map(d => d.name))
    .range([0, height])
    .padding(0.1);

  const tooltip = d3.select("#tooltip");

  // JOIN
  const bars = svg.selectAll("rect").data(games, d => d.name);

  const annotations = [
  {
    note: {
      label: "game globally",
      title: games[0].name
    },
    data: games[10],
    dx: 20,
    dy: -10,
    subject: {
      width: 50,
      height: 20
    },
    connector: { end: "arrow" },
    x: x(games[10]),
    y: y(games[10])
  }
];


  // EXIT
  bars.exit()
    .transition().duration(500)
    .attr("width", 0)
    .remove();

  // UPDATE
  bars.transition().duration(500)
    .attr("y", d => y(d.name))
    .attr("width", d => x(d[regionSales]))
    .attr("height", y.bandwidth());

  // ENTER
  const addedBars = bars.enter()
    .append("rect")
    .attr("x", 0)
    .attr("y", d => y(d.name))
    .attr("height", y.bandwidth())
    .attr("width", 0)
    .attr("fill", "#69b3a2")
    .on("mouseover", function(event, d) {
    tooltip
      .style("visibility", "visible")
      .html(`
        <strong>${d.name}</strong><br>
        Platform: ${d.platform}<br>
        Year: ${d.year}<br>
        Sales: ${d[regionSales].toFixed(2)}Million
      `);
     // optional highlight
  })
  .on("mousemove", function(event) {
    tooltip
      .style("top", (event.pageY - 30) + "px")
      .style("left", (event.pageX + 15) + "px");
  })
  .on("mouseout", function() {
    tooltip.style("visibility", "hidden");
    d3.select(this).attr("fill", "#69b3a2"); // reset color
  });

  addedBars.transition().duration(500)
    .attr("width", d => x(d[regionSales]));

  // Axes
  svg.selectAll(".x-axis").remove();
  svg.selectAll(".y-axis").remove();

  svg.append("g")
    .attr("class", "x-axis")
    .attr("text-anchor", "Total sales (Millions)")
    .attr("transform", `translate(0, ${height})`)
    .call(d3.axisBottom(x));

  svg.append("text")
  .attr("class", "x-axis-label")
  .attr("text-anchor", "middle")
  .attr("x", width / 2)
  .attr("y", height + 40) // some space below the axis
  .text("Global Sales (millions)");

  svg.append("g")
    .attr("class", "y-axis")
    .call(d3.axisLeft(y));

//   const makeAnnotations = d3.annotation()
//     .type(d3.annotationLabel)
//     .annotations(annotations);

//   svg.append("g")
//     .attr("class", "annotation-group")
//     .call(makeAnnotations);
}
