
// margin conventions & svg drawing area - since we only have one chart, it's ok to have these stored as global variables
// ultimately, we will create dashboards with multiple graphs where having the margin conventions live in the global
// variable space is no longer a feasible strategy.

let margin = {top: 40, right: 40, bottom: 60, left: 60};

let width = 600 - margin.left - margin.right;
let height = 500 - margin.top - margin.bottom;

let svg = d3.select("#chart-area").append("svg")
	.attr("width", width + margin.left + margin.right)
	.attr("height", height + margin.top + margin.bottom)
	.append("g")
	.attr("transform", "translate(" + margin.left + "," + margin.top + ")");

let info = d3.select("#info-box").append("svg")
	.attr("width", width + margin.left + margin.right)
	.attr("height", height + margin.top + margin.bottom)
	.append("g")
	.attr("transform", "translate(" + margin.left + "," + margin.top + ")");


// Date parser
let formatDate = d3.timeFormat("%Y");
let parseDate = d3.timeParse("%Y");

// Scales
let x = d3.scaleTime()
	.range([0, width]);

let y = d3.scaleLinear()
	.range([height, 0]);

// Axis
let xAxisGroup = svg.append("g")
	.classed("axis", true)
	.attr("transform", "translate(" + 0 + "," + height + ")");
let yAxisGroup = svg.append("g")
	.classed("axis", true)
	.attr("transform", "translate(" + 0 + "," + 0 + ")");

// Line chart
let lineChart = svg.append("path")
	.classed("line", true);

var div = info.append("g")
	.style("opacity", 1);

var div_des = info.append("g")
	.style("opacity", 1);

var div_title = info.append("g")
	.style("opacity", 1);


// Initialize data
loadData();

// FIFA world cup
let data;

// Load CSV file
function loadData() {
	d3.csv("data/fifa-world-cup.csv", row => {
		row.YEAR = parseDate(row.YEAR);
		row.TEAMS = +row.TEAMS;
		row.MATCHES = +row.MATCHES;
		row.GOALS = +row.GOALS;
		row.AVERAGE_GOALS = +row.AVERAGE_GOALS;
		row.AVERAGE_ATTENDANCE = +row.AVERAGE_ATTENDANCE;
		return row
	}).then(csv => {

		// Store csv data in global variable
		data = csv;

		// Draw the visualization for the first time
		slider();
		updateVisualization();
	});
}

//var = [1930, 2014];

function slider(){
	var slider_value = [];
	for (let i = 0; i < data.length; i++) {
		slider_value[i] = parseInt(formatDate(data[i].YEAR));
	}
	slider_value = slider_value.sort((a,b)=> a-b);
	console.log(slider_value);

	var slider = document.getElementById('slider');
	var format = {
		to: function(value) {
			return slider_value[Math.round(value)];
		},
		from: function (value) {
			return slider_value.indexOf(Number(value));
		}
	};

	noUiSlider.create(slider, {
		start: [1930,2014],
		range: { min: 0, max: slider_value.length - 1 },
		step: 1,
		tooltips: true,
		format: format,
		pips: { mode: 'steps', format: format },
	});

	slider.noUiSlider.set([1930, 2014]);

	slider.noUiSlider.on('slide', function (values, handle) {
		sel = slider.noUiSlider.get();
		console.log("update sel", sel);
		updateVisualization(sel);
	});
}

// Render visualization
function updateVisualization(k) {

	//console.log(data);
	var sel = [1930, 2014];
	if (k == null){
		k = sel;
	}

	let min = k[0];
	let max = k[1];
	console.log("slider value", k, min, max);

	for (let i = 0; i < data.length; i++) {
		data[i]['YEAR_int'] = parseInt(formatDate(data[i].YEAR));
	}

	//let data_filtered = [];

	const filteredArrayData = data.filter(list => list.YEAR_int <= max && list.YEAR_int >= min);
	const data_filtered = Object.assign({}, filteredArrayData);
	const data_updated = Object.values(data_filtered);

	console.log("data_filtered", data_updated);
	console.log("data", data);

	let selectedValue = d3.select("#ranking-type").property("value");
	console.log("select:", selectedValue);

	// Axis
	let x_extent = d3.extent(data_updated, function(d) {
		return d['YEAR'];});
	x.domain([x_extent[0],x_extent[1]]);
	const xAxis = d3.axisBottom()
		.scale(x);
	xAxisGroup.call(xAxis);

	let y_extent = d3.extent(data_updated, function(d) {
		return d[selectedValue];});
	y.domain([0,y_extent[1]]);
	const yAxis = d3.axisLeft()
		.scale(y);
	yAxisGroup.call(yAxis);

	// Line Chart
	const line = d3.line()
		.x(d => x(d['YEAR']))
		.y(d => y(d[selectedValue]));

	lineChart.datum(data_updated)
		.attr("d", line);

	let dot = svg.selectAll("circle")
		.data(data_updated);

	dot.enter()
		.append("circle")
		.classed("tooltip-circle", true)
		.merge(dot)
		.attr("cx", function (d) { return x(d['YEAR']); } )
		.attr("cy", function (d) { return y(d[selectedValue]); } )
		.attr("r", 5)
		.style("fill", "#5C865B")
		.on('mouseover',showEdition)
		.on('mouseout', function (d, i) {
			d3.select(this).transition()
				.duration('200')
				.style("fill", "#5C865BFF")
				.attr("r", 5);

			div.transition()
				.duration('200')
				.style("opacity", 0);

			div_des.transition()
				.duration('200')
				.style("opacity", 0);

			div_title.transition()
				.duration('200')
				.style("opacity", 0);
		});

	yAxisGroup.exit().remove();
	lineChart.exit().remove();
	dot.exit().remove();

}

// Show details for a specific FIFA World Cup
function showEdition(event, d){

	let label =['Winner', 'Goals', 'Average Goals', 'Matches', 'Teams', 'Average Attendance'];
	let description =[d.WINNER, d.GOALS, d.AVERAGE_GOALS, d.MATCHES, d.TEAMS, d.AVERAGE_ATTENDANCE];
	let title = [d.EDITION];
	// console.log("label: ", label);
	// console.log("description: ", description);
	// console.log("title: ", title);

	d3.select(this).transition()
		.duration('100')
		.style("fill", "#000000")
		.attr("r", 7);

	div.transition()
		.duration(100)
		.style("opacity", 1);

	div_des.transition()
		.duration(100)
		.style("opacity", 1);

	div_title.transition()
		.duration(100)
		.style("opacity", 1);

	div.selectAll("rect")
		.data(data)
		.classed("info-rect", true)
		.enter()
		.append("rect")
		.attr("x", 0)
		.attr("y", 0)
		.attr("width", 400)
		.attr("height", 300)
		.attr("rx", 6)
		.attr("ry", 6)
		.style("fill", "#ffffff")
		.style("stroke", "#4B6D4A")
		.style("stroke-width", "1");

	div.selectAll(".info-label")
		.data(label)
		.enter()
		.append("text")
		.classed("info-label", true)
		.attr("x", 40)
		.attr("y", (d, i) => i * 30+100)
		.text(d => d);

	div_des = info.selectAll(".info-des")
		.data(description)
		.enter()
		.append("text")
		.classed("info-des", true)
		.merge(div_des)
		.attr("x", 220)
		.attr("y", (d, i) => i * 30+100)
		.text(d => d);

	div_title = info.selectAll(".info-name")
		.data(title)
		.enter()
		.append("text")
		.classed("info-name", true)
		.merge(div_title)
		.attr("x", 40)
		.attr("y", (d, i) => i * 30+40)
		.text(d => d);

	// div.exit().remove();
	div_des.exit().remove();
	div_title.exit().remove();
}
