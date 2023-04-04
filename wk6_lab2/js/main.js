
// SVG drawing area
let margin = {top: 60, right: 10, bottom: 60, left: 60};

let width = 960 - margin.left - margin.right,
    height = 500 - margin.top - margin.bottom;

let svg = d3.select("#chart-area").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
  .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

// Scales
let x = d3.scaleBand()
    .rangeRound([0, width])
	.paddingInner(0.1);

let y = d3.scaleLinear()
    .range([height, 0]);

// Initialize data
loadData();

// Create a 'data' property under the window object
// to store the coffee chain data
Object.defineProperty(window, 'data', {
	// data getter
	get: function() { return _data; },
	// data setter
	set: function(value) {
		_data = value;
		// update the visualization each time the data property is set by using the equal sign (e.g. data = [])
		updateVisualization();
	}
});

// Load CSV file
function loadData() {
	d3.csv("data/coffee-house-chains.csv").then(csv=> {

		csv.forEach(function(d){
			d.revenue = +d.revenue;
			d.stores = +d.stores;
		});

		// Store csv data in global variable
		data = csv
		//data = data.sort((a,b)=> b.stores - a.stores);

        // updateVisualization gets automatically called within the data = csv call;
		// basically(whenever the data is set to a value using = operator);
		// see the definition above: Object.defineProperty(window, 'data', { ...

	});
}

let xAxisGroup = svg.append("g")
	.attr("class", "x-axis axis")
	.attr("transform", "translate(" + 0 + "," + height + ")");
let yAxisGroup = svg.append("g")
	.attr("class", "y-axis axis")
	.attr("transform", "translate(" + -10 + "," + 0 + ")");

// Render visualization
function updateVisualization() {
	// console.log("data: ", data);

	let selectedValue = d3.select("#ranking-type").property("value");
	let data_sorted = data.slice().sort((a,b)=> b[selectedValue] - a[selectedValue]);

	console.log("select:", selectedValue);
	console.log("sorted data: ", data_sorted);

	// SCALE
	x.domain(data_sorted.map(d=>d.company));
	let y_extent = d3.extent(data_sorted, function(d) {
		return d[selectedValue];});
	y.domain([0,y_extent[1]]);

	// AXIS
	const xAxis = d3.axisBottom()
		.scale(x);
	const yAxis = d3.axisLeft()
		.scale(y);
	xAxisGroup.call(xAxis);
	yAxisGroup.transition()
		.duration(3000)
		.call(yAxis);

	// RECTANGLE

	let rec = svg.selectAll('rect').data(data_sorted);

	rec.enter()
		.append("rect")
		.attr("class", "bar")
		.merge(rec)
		// .transition()
		// .duration(3000)
		.attr("x", d=> x(d.company))
		.attr("y", d=> y(d[selectedValue]))
		.attr("width", x.bandwidth())
		.attr("height", d=> height - y(d[selectedValue]));


	yAxisGroup.exit().remove();
	rec.exit().remove();


}