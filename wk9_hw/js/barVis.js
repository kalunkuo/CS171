/* * * * * * * * * * * * * *
*      class BarVis        *
* * * * * * * * * * * * * */


class BarVis {

    constructor(parentElement, covidData, usaData, descending, title){
        this.parentElement = parentElement;
        this.covidData = covidData;
        this.usaData = usaData;
        this.displayData = [];
        this.descending = descending;
        this.title = title;

        // parse date method
        this.parseDate = d3.timeParse("%m/%d/%Y");

        this.initVis()
    }

    initVis(){
        let vis = this;

        // margin, width, height
        vis.margin = {top: 20, right: 20, bottom: 60, left: 40};
        vis.width = document.getElementById(vis.parentElement).getBoundingClientRect().width - vis.margin.left - vis.margin.right;
        vis.height = document.getElementById(vis.parentElement).getBoundingClientRect().height - vis.margin.top - vis.margin.bottom;

        // init drawing area
        vis.svg = d3.select("#" + vis.parentElement).append("svg")
            .attr("width", vis.width + vis.margin.left + vis.margin.right)
            .attr("height", vis.height + vis.margin.top + vis.margin.bottom)
            .append('g')
            .attr('transform', `translate (${vis.margin.left}, ${vis.margin.top})`);

        // add title
        vis.svg.append('g')
            .attr('class', 'title bar-title')
            .append('text')
            .text(vis.title)
            .attr('transform', `translate(${vis.width / 2}, 10)`)
            .attr('text-anchor', 'middle');

        // tooltip
        vis.tooltip = d3.select("body").append('div')
            .attr('class', "tooltip")
            .attr('id', 'barTooltip')

        // TODO

        // axis
        vis.x = d3.scaleBand()
            .range ([0, vis.width])
            .padding(.3);
        vis.y = d3.scaleLinear()
            .range ([vis.height,0]);

        vis.yAxis = d3.axisLeft()
            .scale(vis.y);
        vis.xAxis = d3.axisBottom()
            .scale(vis.x);

        // append empty axis
        vis.svg.append("g")
            .attr("class", "x-axis axis");

        vis.svg.append("g")
            .attr("class", "y-axis axis");

        // define color scale
        vis.mapColor = d3.scaleLinear()
            .range(["#e8f7f8", "#064749"]);

        this.wrangleData();
    }

    wrangleData(){
        let vis = this

        // Pulling this straight from dataTable.js
        let filteredData = [];

        // if there is a region selected
        if (selectedTimeRange.length !== 0) {
            // console.log('region selected', vis.selectedTimeRange, vis.selectedTimeRange[0].getTime() )

            // iterate over all rows the csv (dataFill)
            vis.covidData.forEach(row => {
                // and push rows with proper dates into filteredData
                if (selectedTimeRange[0].getTime() <= vis.parseDate(row.submission_date).getTime() && vis.parseDate(row.submission_date).getTime() <= selectedTimeRange[1].getTime()) {
                    filteredData.push(row);
                }
            });
        } else {
            filteredData = vis.covidData;
        }

        // prepare covid data by grouping all rows by state
        let covidDataByState = Array.from(d3.group(filteredData, d => d.state), ([key, value]) => ({key, value}))

        // init final data structure in which both data sets will be merged into
        vis.stateInfo = []

        // merge
        covidDataByState.forEach(state => {

            // get full state name
            let stateName = nameConverter.getFullName(state.key)

            // init counters
            let newCasesSum = 0;
            let newDeathsSum = 0;
            let population = 0;

            // look up population for the state in the census data set
            vis.usaData.forEach(row => {
                if (row.state === stateName) {
                    population += +row["2020"].replaceAll(',', '');
                }
            })

            // calculate new cases by summing up all the entries for each state
            state.value.forEach(entry => {
                newCasesSum += +entry['new_case'];
                newDeathsSum += +entry['new_death'];
            });

            // populate the final data structure
            vis.stateInfo.push(
                {
                    state: stateName,
                    population: population,
                    absCases: newCasesSum,
                    absDeaths: newDeathsSum,
                    relCases: (newCasesSum / population * 100),
                    relDeaths: (newDeathsSum / population * 100)
                }
            )
        })
        // console.log("barVis: ", vis.stateInfo);


        // define empty initial value for selectedCategory
        if (selectedCategory){
            console.log('selData1: ', selectedCategory );
        }
        else{
            selectedCategory = "absCases";
            console.log('selData2: ', selectedCategory );
        }

        // sort and filter by top 10
        if (vis.descending){
            vis.stateInfo.sort((a,b) => {return b[selectedCategory] - a[selectedCategory]})
        } else {
            vis.stateInfo.sort((a,b) => {return a[selectedCategory] - b[selectedCategory]})
        }

        // console.log('barVis, final data structure', vis.descending, vis.stateInfo);

        vis.topTenData = vis.stateInfo.slice(0, 10)
        console.log('barVis, final data structure, filtered', vis.descending, vis.topTenData);

        vis.updateVis()

    }

    updateVis(){
        let vis = this;

        // update domain
        vis.x.domain(vis.topTenData.map(function(d) { return d['state']; }));
        vis.y.domain([0, d3.max(vis.topTenData, (d) => d[selectedCategory])]);

        //update color
        vis.mapColor.domain(d3.extent(vis.stateInfo, (d) => d[selectedCategory]));

        let bars = vis.svg.selectAll('.bar')
            .data(vis.topTenData)
        bars.enter()
            .append("g")
            .append("rect")
            .merge(bars)
            .style("fill", function (d) {
                return vis.mapColor(d[selectedCategory])
            })
            .attr("class", "bar")
            .attr("x", function(d) { return vis.x(d['state']); })
            .attr("y", function(d) { return vis.y(d[selectedCategory]); })
            .attr("width", vis.x.bandwidth())
            .attr("height", function(d) { return vis.height - vis.y(d[selectedCategory]); })
            // .attr("fill", "#c1edef")
            .on('mouseover', function(event, d) {
                console.log("d: ", d);
                d3.select(this)
                    .attr('stroke-width', '2px')
                    .attr('stroke', 'black')
                    .style('fill', 'rgb(219,52,52)')
                vis.tooltip
                    .style("opacity", 1)
                    .style("left", event.pageX + 20 + "px")
                    .style("top", event.pageY + "px")
                    .html(`
                         <div style="border: thin solid grey; border-radius: 5px; 
                                background: lightgrey; padding: 20px">
                         <h3>${d.state}<h3>
                         <h4>Population: ${d.population}</h4>
                         <h4>Cases (absolute): ${d.absCases}</h4>
                         <h4>Deaths (absolute): ${d.absDeaths}</h4>
                         <h4>Cases (relative): ${d3.format(".2f")(d.relCases)}%</h4>
                         <h4>Deaths (relative): ${d3.format(".2f")(d.relDeaths)}%</h4>
                         </div>`);
            })
            .on('mouseout', function(event, d){
                d3.select(this)
                    .attr('stroke-width', '0px')
                    .style('fill', vis.mapColor(d[selectedCategory]))
                vis.tooltip
                    .style("opacity", 0)
                    .style("left", 0)
                    .style("top", 0)
                    .html(``);
            })


        // console.log('here')

        // call axis
        vis.svg.select(".x-axis")
            .attr("transform", "translate(0," + vis.height + ")")
            .style("text-anchor", "end")
            .call(vis.xAxis)
            .selectAll("text")
            .attr("transform", "translate(-10,0)rotate(-45)")
            .style("text-anchor", "end");
        vis.svg.select(".y-axis").call(vis.yAxis);
    }



}