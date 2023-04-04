/* * * * * * * * * * * * * *
*          MapVis          *
* * * * * * * * * * * * * */


class MapVis {

    // constructor method to initialize Timeline object
    constructor(parentElement, geoData, covidData, usaData) {
        this.parentElement = parentElement;
        this.geoData = geoData;
        this.covidData = covidData;
        this.usaData = usaData;
        this.displayData = [];

        // parse date method
        this.parseDate = d3.timeParse("%m/%d/%Y");

        this.initVis()
    }

    initVis(){
        let vis = this;

        // margin, width, height
        vis.margin = {top: 20, right: 20, bottom: 20, left: 20};
        vis.width = document.getElementById(vis.parentElement).getBoundingClientRect().width - vis.margin.left - vis.margin.right;
        vis.height = document.getElementById(vis.parentElement).getBoundingClientRect().height - vis.margin.top - vis.margin.bottom;

        vis.zoom = vis.width * 1.1;


        // init drawing area
        vis.svg = d3.select("#" + vis.parentElement).append("svg")
            .attr("width", vis.width)
            .attr("height", vis.height)
            .attr('transform', `translate (${vis.margin.left}, ${vis.margin.top})`);

        // add title
        vis.svg.append('g')
            .attr('class', 'title')
            .attr('id', 'map-title')
            .append('text')
            .text('COVID Population by State')
            .attr('transform', `translate(${vis.width / 2}, 20)`)
            .attr('text-anchor', 'middle');


        // projection
        vis.projection = d3.geoAlbersUsa()
            .translate([vis.width / 2, vis.height / 2])
            .scale(vis.zoom);

        vis.path = d3.geoPath()
            .projection(vis.projection);
        // console.log("vis.geoData: ", vis.geoData);

        vis.usa = topojson.feature(vis.geoData, vis.geoData.objects.states).features;

        vis.states = vis.svg.selectAll(".state")
            .data(vis.usa)
            .enter().append("path")
            .attr('class', 'state')
            .attr("d", vis.path);

        // append tooltip
        vis.tooltip = d3.select("body").append('div')
            .attr('class', "tooltip")
            .attr('id', 'pieTooltip');

        // define color scale
        vis.mapColor = d3.scaleLinear()
            .range(["#e8f7f8", "#064749"]);

        // append legend group
        vis.legendGroup = vis.svg.append("g")
            .attr('transform', `translate (${vis.width - vis.margin.left - 300}, 
                                           ${vis.height-vis.margin.bottom - 20})`);

        vis.legendColorScale = d3.scaleSequential()
            .interpolator(d3.interpolate("#e8f7f8", "#064749"))
            .domain([0,100]);

        vis.gradientRange = d3.range(100);
        vis.legend = vis.legendGroup.selectAll("rects")
            .data(vis.gradientRange)
            .enter()
            .append("rect")
            .attr("y", 0)
            .attr("x", (d,i) => i*3)
            .attr("height", 20)
            .attr("width", 3)
            .attr("fill", d=>vis.legendColorScale(d));
        vis.legend.attr('transform','translate(0,-20)');

        vis.scale = d3.scaleLinear().range([0, 300]);

        vis.wrangleData()
    }


    wrangleData(){

        let vis = this

        // check out the data
        // console.log("mapVis_covidData: ", vis.covidData);
        // console.log("mapVis_usaData: ", vis.usaData)

        // first, filter according to selectedTimeRange, init empty array
        let filteredData = [];

        // if there is a region selected
        if (selectedTimeRange.length !== 0) {
            // console.log('mapVis_covidData, region selected: ', vis.selectedTimeRange, vis.selectedTimeRange[0].getTime() )

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

        // have a look
        // console.log("mapVis_covidDataByState: ", covidDataByState)

        // init final data structure in which both data sets will be merged into

        vis.stateInfo = []

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

        // merge information with geoData
        vis.stateInfoGeo = {};
        vis.geoData.objects.states.geometries.forEach(d => {

            let index = vis.stateInfo.findIndex((element, index) => {
                if (element.state === d.properties.name) {
                    return true
                }
            })
            if (index < 0){
                index = 0;
            }
            const population_index = vis.stateInfo[index]['population']
            const absCases_index = vis.stateInfo[index]['absCases']
            const absDeaths_index = vis.stateInfo[index]['absDeaths']
            const relCases_index = vis.stateInfo[index]['relCases']
            const relDeaths_index = vis.stateInfo[index]['relDeaths']

            vis.stateInfoGeo[d.properties.name] = {
                name: d.properties.name,
                population: population_index,
                absCases: absCases_index,
                absDeaths: absDeaths_index,
                relCases: relCases_index ,
                relDeaths: relDeaths_index
            }
        })

        // console.log('final data structure for mapVis', vis.stateInfo);
        console.log('final data structure for mapVis', vis.stateInfoGeo);

        vis.updateVis();
    }

    updateVis(selData){
        let vis = this;

        // data from category selector
        selData = selectedCategory;
        if (selData){
            console.log('selData1: ', selData );
        }
        else{
            selData = "absCases";
            console.log('selData2: ', selData );
        }

        // update color domain
        let data_array = Object.values(vis.stateInfoGeo)
        vis.mapColor.domain(d3.extent(data_array, d => d[selData]));

        // update legend
        vis.scale.domain([0, d3.max(data_array, d => d[selData])])
        vis.axis = d3.axisBottom(vis.scale).ticks(4);
        vis.legendText = vis.legendGroup.call(vis.axis);

        // update color of states
        vis.states
            .data(data_array)
            .style("fill", function (d) {
                return vis.mapColor(d[selData])
            })
            // tooltip
            .on('mouseover', function(event, d){
                // console.log("d: ",d);
                vis.tooltip
                    .style("opacity", 1)
                    .style("left", event.pageX + 20 + "px")
                    .style("top", event.pageY + "px")
                    .html(`
                         <div style="border: thin solid grey; border-radius: 5px; 
                                background: lightgrey; padding: 20px">
                         <h3>${d.name}<h3>
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
                    .style('fill', vis.mapColor(d[selData]))
                vis.tooltip
                    .style("opacity", 0)
                    .style("left", 0)
                    .style("top", 0)
                    .html(``);
            })


    }
}