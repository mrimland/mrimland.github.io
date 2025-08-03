const margin = { top: 10, right: 30, bottom: 100, left: 250 };
const width = 1000 - margin.left - margin.right;
const height = 600 - margin.top - margin.bottom;

const oldConsoles = new Set(["WS","SCD","WS","NG","TG16","3DO","GG","PCFX"]);

const message2000 = "The introduction of the Wii helped bring games to the more casual audience, with Wii Sports leading the charge."
const message2010 = "The 2010s see other companies try to capitalize on the Wii's success, as well as the rise of the shooter genres for next gen consoles."

let step = 0;

let svgExplore = d3.select("#explore")
  .append("svg")
  .attr("width", 1000)
  .attr("height", 600)
  .append("g")
  .attr("transform", `translate(${margin.left},${margin.top})`);


let data = [];
let platforms = new Set();
document.addEventListener("DOMContentLoaded", () => {

  svgExplore = d3.select("#explore")
    .append("svg")
    .attr("width", 1000)
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
            publisher: d.Publisher,
            globalSales: +d.Global_Sales
    }));
  // Get unique platforms for filter
  var plat = new Set();
  data.forEach(d => {
        platforms.add(d.platform)});
  updatePlatformDropdown();

  // Initial render
  renderStoryChart("explore", 1990, "globalSales", "all","Global Sales (Millions)");
  //updateChart();
  
  // Event listeners
  d3.selectAll("#decade, #platform").on("change", updateChart);
  });
});

function advance() {
  step += 1;
  let button = document.getElementById("advance-stem");
  let subtext = document.getElementById("subtext");
  let controls = document.getElementById("interactive-controls");
  let title =  document.getElementById("year-title");
  switch(step){
    case 0:
      subtext.textContent = "Case 1990";
      title.textContent = "1990-1999";
      renderStoryChart("explore", 1990, "globalSales", "all","Global Sales (Millions)");
      break;
    case 1:
      subtext.textContent = message2000;
      title.textContent = "2000-2009";
      renderStoryChart("explore", 2000, "globalSales", "all","Global Sales (Millions)");
      break;
    case 2:
      subtext.textContent = message2010;
      title.textContent = "2010-2016";
      renderStoryChart("explore", 2010, "globalSales", "all","Global Sales (Millions)");
      break;
    default:
      subtext.textContent = "Feel free to delve more into console and region specific data";
      updateChart();
      button.remove();
      controls.style.visibility = "visible";
  }
}
function updatePlatformDropdown() {
  const platformSelect = d3.select("#platform");
  platforms.forEach(p => {
    if (!oldConsoles.has(p))
    {
      platformSelect.append("option")
      .attr("value", p)
      .text(p);
    }
  });
}

function renderStoryChart(containerId, decade, region, platform, annotationText) {
  const decadeStart = +decade;
  let filtered = data.filter(d =>
    d.year >= decadeStart && d.year < decadeStart + 10 &&
    (platform === "all" || d.platform === platform)
  );



  const topGames = filtered
    .sort((a, b) => d3.descending(a[region], b[region]))
    .slice(0, 20);

  
  drawBarChart(topGames, region, annotationText, containerId);
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

    let axis_title = "Global Sales (Millions)";
    switch (region) {
      case "naSales": 
                axis_title = "North America Sales (Millions)";
                break;
            case "euSales":
                axis_title = "Europe Sales (Millions)";
                break;
            case "jpSales":
                axis_title = "Japan Sales (Millions)";
                break;
            default:
                axis_title = "Global Sales (Millions)";
    }

  for(var i = 0; i < 20; i++) {
    console.log(topGames[i]);
  }
  drawBarChart(topGames, region, axis_title);
}

function drawBarChart(games, regionSales, region = null, containerId = "explore") {
  let svg = svgExplore;
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
        Publisher: ${d.publisher} <br>
        Regional Sales: ${d[regionSales].toFixed(2)} Million <br>
        Global Sales: ${d.globalSales.toFixed(2)} Million
      `);
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
  svg.selectAll(".y-axis").remove();
// Update or create the x-axis group
let xAxisGroup = svg.select(".x-axis");

if (xAxisGroup.empty()) {
  xAxisGroup = svg.append("g")
    .attr("class", "x-axis")
    .attr("transform", `translate(0, ${height})`);
}

xAxisGroup.transition()
  .duration(500)
  .call(d3.axisBottom(x));

// Update or create x-axis label
let xLabel = svg.select(".x-axis-label");

if (xLabel.empty()) {
  xLabel = svg.append("text")
    .attr("class", "x-axis-label")
    .attr("text-anchor", "middle")
    .attr("x", width / 2)
    .attr("y", height + 40);
}

xLabel.text(region || "Sales (millions)");

svg.append("g")
  .attr("class", "y-axis")
  .call(d3.axisLeft(y));

// Remove any existing annotations
svg.selectAll(".annotation-group").remove();

// Build the annotations for specific decades
  let annotations = [];

   if (step == 0) {
    const game = games.find(d => d.name.includes("Pikachu"));
    if (game) {
      annotations.push({
        note: {
          label: `Portable Pokemon games dominated sales`
        },
        x: x(game[regionSales]),
        y: (y(game.name) + y.bandwidth() / 2),
        dx: 50,
        dy: 30
      });
    }
  }

  if (step == 1) {
    const game = games.find(d => d.name.includes("Wii Sports"));
    if (game) {
      annotations.push({
        note: {
          label: "Simpler games that were more intuitive with the Wii were popular"
        },
        x: x(game[regionSales]) - 300,
        y: (y(game.name) + y.bandwidth() / 2) + 30,
        dx: 0,
        dy: 0,
        connector: {
          type: "none"
        }
      });
    }
  }

  if (step == 2) {
    const game = games.find(d => d.name.includes("Call of Duty"));
    if (game) {
      annotations.push({
        note: {
          label: `Call of Duty and other realistic games rise in popularity`
        },
        x: x(game[regionSales]),
        y: y(game.name) + y.bandwidth() / 2,
        dx: 50,
        dy: 30
      });
    }
  }
  if (annotations.length > 0) {
    const makeAnnotations = d3.annotation().annotations(annotations);

    svg.append("g")
      .attr("class", "annotation-group")
      .call(makeAnnotations);
  }
}
