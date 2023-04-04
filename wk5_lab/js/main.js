//MARGIN
let margin = {top: 30, right: 30, bottom: 30, left: 30};

//WIDTH HEIGHT
let width = 960,
	height = 500;

//PADDING PUFFER
let padding = 30;

// Define 'svg' as a child-element (g) from the drawing area and include spaces
let svg = d3.select("#chart-area").append("svg")
	.attr("width", width + margin.left + margin.right)
	.attr("height", height + margin.top + margin.bottom)
	.append("g")

// Load CSV file
let data = d3.csv("data/wealth-health-2014.csv", d => {

	//CONVERT DATA
	d.value = +d.value;
	d.Income = +d.Income;
	d.Population = +d.Population;
	d.LifeExpectancy = +d.LifeExpectancy;

	return d;
}).then( data => {
	//ANALYZE DATA
	console.log(data);
	console.log("Countries: " + data.length);

	// SORT DATA
	data = data.sort(function (a, b) {
		return b.Population - a.Population ;
	})
	console.log("sorted data", data);

	//CALL FUNCTION
	drawCircle(data);

});



// TODO: create a separate function that is in charge of drawing the data, which means it takes the sorted data as an argument
// function ... (){}

function drawCircle(data){


	//INCOME SCALE - X AXIS
	let width_extent = d3.extent(data, function(d) {
		return d.Income;
	});
	let incomeScale = d3.scaleLinear()
		.domain([width_extent[0], width_extent[1]])
		.range([padding, width + padding]);
	console.log("width_extent: "+ width_extent);

	var width_log = d3.scaleLog()
		.domain([width_extent[0], width_extent[1]])
		.range([padding, width + padding]);

	//LIFE EXPECTANCY SCALE - Y AXIS
	let height_extent = d3.extent(data, function(d) {
		return d.LifeExpectancy;});
	let lifeExpectancyScale = d3.scaleLinear()
		.domain([height_extent[0], height_extent[1]])
		.range([height - padding, padding]);
	console.log("height_extent: " + height_extent);

	var height_log = d3.scaleLog()
		.domain([height_extent[0], height_extent[1]])
		.range([height - padding, padding]);


	//POPULATION SCALE - RADIUS
	let radius_extent = d3.extent(data, function(d) {
		return d.Population;});
	let populationScale = d3.scaleLinear()
		.domain([radius_extent[0], radius_extent[1]])
		.range([4,30]);
	console.log("radius_extent: " + radius_extent);


	//REGION SCALE - COLOR
	const color_code =[
		{ Re_code:0, Region:"Sub-Saharan Africa" },
		{ Re_code:1, Region:"South Asia" },
		{ Re_code:2, Region:"East Asia & Pacific" },
		{ Re_code:3, Region:"Middle East & North Africa" },
		{ Re_code:4, Region:"America" },
		{ Re_code:5, Region:"Europe & Central Asia" }]

	data.map((x) => color_code.map((y) =>
		{ if (y.Region === x.Region) { x.Re_code = y.Re_code; return x; } }) );

	console.log("mapped data: ", data);
	let linearColor = d3.scaleLinear()
		.domain([0,5])
		.range(["darkgreen","lightgreen"]);

	//DRAW CIRCLE
	let group = svg.append("g")
		// .scaleLog()
		.attr("transform", "translate(10,-10)");
	let circle = group
		.selectAll()
		.data(data)
		.enter()
		.append("circle")
		// .attr("cx", function(d){ return incomeScale(d.Income); })
		// .attr("cy", function(d){ return lifeExpectancyScale(d.LifeExpectancy); })
		.attr("cx", function(d){ return width_log(d.Income); })
		.attr("cy", function(d){ return height_log(d.LifeExpectancy); })
		.attr("r", function(d){ return populationScale(d.Population); })
		.style("stroke", "rgb(0,0,0)")
		.style("stroke-width", 1)
		.style("fill", function(d){ return linearColor(d.Re_code); })


	//AXIS
	let xAxis = d3.axisBottom()
		.scale(incomeScale);
	 	// .scale(width_log);
	svg.append("g")
		.attr("class", "axis x-axis")
		.attr("transform", "translate(0," + (height - padding) + ")")
		.call(xAxis)
		.call(g => g.append("text")
				.attr("x", width + 30)
				.attr("y", margin.bottom - 40)
				.attr("fill", "currentColor")
				.attr("text-anchor", "end")
				.text("Income per Person (GDP per Capita)"));

	let yAxis = d3.axisLeft()
		.scale(lifeExpectancyScale);
	svg.append("g")
		.attr("class", "axis y-axis")
		.attr("transform", "translate(" + (padding) + ",0)")
		.call(yAxis)
		.call(g => g.append("text")
			.attr("x", margin.left + 0)
			.attr("y", -10)
			.attr("fill", "currentColor")
			.attr("text-anchor", "start")
			.attr("transform", "rotate(90)")
			.text("Life expectancy"));





}
