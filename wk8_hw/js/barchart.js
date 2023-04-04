

/*
 * BarChart - Object constructor function
 * @param _parentElement 	-- the HTML element in which to draw the bar charts
 * @param _data						-- the dataset 'household characteristics'
 * @param _config					-- variable from the dataset (e.g. 'electricity') and title for each bar chart
 */


class BarChart {

	constructor(parentElement, data, config) {
		this.parentElement = parentElement;
		this.data = data;
		this.config = config;
		this.displayData = data;
		console.log(this.displayData);
		this.initVis();
	}

	/*
	 * Initialize visualization (static content; e.g. SVG area, axes)
	 */

	initVis() {
		let vis = this;

		// * TO-DO *
		vis.margin = {top: 40, right:100, bottom: 40, left: 100};
		vis.width = document.getElementById(vis.parentElement).getBoundingClientRect().width - vis.margin.left - vis.margin.right;
		vis.height = document.getElementById(vis.parentElement).getBoundingClientRect().height - vis.margin.top - vis.margin.bottom;

		// SVG drawing area
		vis.svg = d3.select("#" + vis.parentElement).append("svg")
			.attr("width", vis.width + vis.margin.left + vis.margin.right)
			.attr("height", vis.height + vis.margin.top + vis.margin.bottom)
			.append("g")
			.attr("transform", "translate(" + vis.margin.left + "," + vis.margin.top + ")");

		vis.svg.append("defs")
			.append("clipPath")
			.attr("id", "clip")
			.append("rect")
			.attr("width", vis.width)
			.attr("height", vis.height);

		// AXIS
		vis.x = d3.scaleLinear()
			.range ([vis.width,0]);

		vis.y = d3.scaleBand()
			.range ([0, vis.height])
			.padding(.3);

		vis.yAxis = d3.axisLeft()
			.scale(vis.y);

		// Empty Y Axis
		vis.svg.append("g")
			.attr("class", "y-axis axis");

		// bar chart title
		vis.title = vis.svg.append("g")
			.append("text")
			.attr("class", "title")
			.text(vis.config.title)
			.attr("x", -vis.margin.left)
			.attr("y", -20)

		// (Filter, aggregate, modify data)
		vis.wrangleData(vis.data);
	}


	/*
	 * Data wrangling
	 */

	wrangleData(k) {
		let vis = this;

		// (1) Group data by key variable (e.g. 'electricity') and count leaves
		// (2) Sort columns descending
		vis.data_ = d3.rollup(k,v=>v.length,d=>d[vis.config.key]);
		vis.data_a =  Array.from(vis.data_, ([key, value]) => ({key, value}));

		vis.data_a_sorted = vis.data_a.sort(function(x, y){
			return d3.descending(x.value, y.value);})
		console.log("vis.data_sel_sorted", vis.data_a_sorted);

		// Update the visualization
		vis.updateVis();
	}


	/*
	 * The drawing function - should use the D3 update sequence (enter, update, exit)
	 */

	updateVis() {
		let vis = this;

		// (1) Update domains
		// (2) Draw rectangles
		// (3) Draw labels

		vis.x.domain([d3.max(vis.data_a_sorted).value,0]);
		vis.y.domain(vis.data_a_sorted.map(function(d) { return d.key; }));

		const t = d3.transition()
			.duration(500)
			.ease(d3.easeLinear);

		// y axis left
		let bars = vis.svg.selectAll('.bar')
			.data(vis.data_a_sorted)
		bars.enter()
			.append("g")
			.append("rect")
			.merge(bars)
			.attr("class", "bar")
			.attr("x", vis.x(0) )
			.attr("y", function(d) { return vis.y(d.key); })
			.attr("width", function(d) { return vis.x(d.value); })
			.attr("height", vis.y.bandwidth());


		// bar label
		let label = vis.svg.selectAll('.label')
			.data(vis.data_a_sorted)
		label.enter()
			.append("g")
			.append("text")
			.merge(label)
			.attr("class", "label")
			.text(function(d) { return d.value; })
			.attr("x",  function(d) { return vis.x(d.value)+10; })
			.attr("y", function(d){ return (vis.y.bandwidth()/2 + vis.y(d.key));})
			.attr("alignment-baseline", "central");

		bars.exit().transition(t).remove();
		label.exit().transition(t).remove();

		// Update the y-axis
		vis.svg.select(".y-axis").transition(t).call(vis.yAxis);
	}



	/*
	 * Filter data when the user changes the selection
	 * Example for brushRegion: 07/16/2016 to 07/28/2016
	 */

	selectionChanged(brushRegion) {
		let vis = this;

		// Filter data accordingly without changing the original data
		console.log("brushRegion: ", brushRegion[0],brushRegion[1]);
		vis.data_filter = vis.data.filter(function(d,i){ return d.survey >= brushRegion[0] & d.survey <= brushRegion[1] });
		console.log("filtered data: ", vis.data_filter);

		// Update the visualization
		vis.wrangleData(vis.data_filter);
	}
}
