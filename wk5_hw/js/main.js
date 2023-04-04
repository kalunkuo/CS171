// CHART MARGIN PADDING DIMENSIONS
let margin = {top: 20, right: 10, bottom: 0, left: 10},
    padding = {top: 80, right: 40, bottom: 0, left: 40},

    outerWidthLeft = document.getElementById('chart-area-pop').clientWidth,
    outerWidthRight = document.getElementById('chart-area-type').clientWidth,
    outerHeight = document.getElementById('chart').clientHeight,

    innerWidthLeft = outerWidthLeft - margin.left - margin.right,
    innerWidthRight = outerWidthRight - margin.left - margin.right,
    innerHeight = outerHeight - margin.top - margin.bottom,

    widthLeft = innerWidthLeft - padding.left - padding.right,
    widthRight = innerWidthRight - padding.left - padding.right,
    height = innerHeight - padding.top - padding.bottom;

console.log("chart outer dim: ", outerWidthLeft, outerWidthRight, outerHeight,
            "chart inner dim: ", innerWidthLeft,innerWidthRight, innerHeight,
            "chart dim: ", widthLeft, widthRight, height);

// AXIS TRANSLATE
const xAxisTranslate = height;
const yAxisTranslate = padding.left;

// CHART TRANSLATE
const xTranslate = padding.left;
const yTranslate = 0;


let svg = d3.select("#chart-area-pop")
    .append("svg")
    .attr("width", outerWidthLeft)
    .attr("height", outerHeight)
    // .attr("transform", "translate(" + margin.left + "," + margin.top + ")");


let svg2 = d3.select("#chart-area-type")
    .append("svg")
    .attr("width", outerWidthRight)
    .attr("height", outerHeight)
    .append("g")
    // .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

//DATA
let data = d3.csv("data/zaatari-refugee-camp-population.csv", d => {
    //CONVERT DATA
    d.value = +d.value;
    d.population = +d.population;
    return d;

}).then( data => {
    //ANALYZE DATA
    console.log(data);
    console.log("Camp: " + data.length);

    //PARSE DATE
    var parseDate = d3.timeParse("%Y-%m-%d");
    for (let i=0; i<data.length; i++){
        data[i].date = parseDate(data[i].date);
    }
    console.log("date", data);

    //CALL FUNCTION
    drawChart_Pop(data);
    drawChart_Type(data);

});

function drawChart_Pop(k){

    var parseDate_loc = d3.timeFormat("%B %Y");
    for (let i=0; i< k.length; i++){
        k[i].dateloc = parseDate_loc(k[i].date);
    }
    console.log("date-loc", k);

    //LEFT: x y scaler population
    let width_extent = d3.extent(k, function(d) {
        return d.date;});
    let xScale = d3.scaleTime()
        .domain([width_extent[0], width_extent[1]])
        .range([padding.left, widthLeft]);


    let height_extent = d3.max(k, function(d) {
        return d.population;});
    let yScale = d3.scaleLinear()
        .domain([height_extent,0])
        .range([padding.top, height]);
    console.log("width extent: ", width_extent, "height extent: ", height_extent);




    //CHART
    const area = d3.area()
        .x(d => xScale(d.date))
        .y1(d => yScale(d.population))
        .y0(yScale(0));

    svg.append('g')
        .attr("class", "chart")
        .append('path')
        .attr('d', area(k));

    //X AXIS
    const xAxis = d3.axisBottom()
        .scale(xScale)
        .tickFormat(d3.timeFormat("%b %Y"));
    svg.append('g')
        .attr("transform", "translate(" + 0 + "," + xAxisTranslate + ")")
        .call(xAxis)
        .selectAll("text")
            .attr("y", 0)
            .attr("x", 9)
            .attr("transform", "rotate(90)")
            .style("text-anchor", "start")

    // X AXIS LABEL
    svg.selectAll()
        .enter()
        .append("text")
        .attr("class","label")
        .attr("y", 10)
        .attr("x", 10)
        .attr("fill", "currentColor")
        .text("Date");

    //Y AXIS
    const yAxis = d3.axisLeft()
        .scale(yScale)
        .tickFormat(d3.format(".2s"));
    svg.append('g')
        .attr("transform", "translate(" + yAxisTranslate + ",0)")
        .call(yAxis)
        .call(g => g.append("text")
            .attr("class","label")
            .attr("y", -10)
            .attr("x", 80)
            .attr("fill", "currentColor")
            .attr("text-anchor", "start")
            .attr("transform", "rotate(90)")
            .text("Population"));

    //tooltip
    svg.append('g')
        .append('line')
        .classed('tooltip_line', true);

    svg.append('text')
        .attr('class', 'tooltip_text');

    svg.append('text')
        .attr('class', 'tooltip_text_date');

    svg.on('mousemove', mouseMove());

    //REFERENCE: https://observablehq.com/@elishaterada/simple-area-chart-with-tooltip

    function mouseMove(e){
        let mouse = d3.pointer(event);
        let mouse_x = mouse[0];
        let mouse_y = mouse[1];

        const mouse_date = d3.timeMonth.floor(xScale.invert(mouse_x));
        const mouse_date_day = d3.timeDay.floor(xScale.invert(mouse_x));
        let bisectDate = d3.bisector(k=>k.date).left;

        if (xScale(mouse_date) < yAxisTranslate || xScale(mouse_date) > widthLeft) {
            return;
        }

        const index = bisectDate(k, mouse_date, 1);
        const mouse_population = k[index].population;
        console.log(mouse_population);

        let format = d3.timeFormat("%Y-%B-%d");
        const mouse_date_format = format(mouse_date);

        const mouse_date_loc = k[index].dateloc;
        console.log(mouse_date_format);

        svg.selectAll('.tooltip_line')
            .attr('x1', xScale(mouse_date_day))
            .attr('x2', xScale(mouse_date_day))
            .attr('y1', 0)
            .attr('y2', height)
            .attr('stroke', '#d27070')
            .attr('fill', '#d27070');

        svg.selectAll('.tooltip_text')
            .attr('x', mouse_x+10)
            .attr('y', 20)
            .text((mouse_population));

        svg.selectAll('.tooltip_text_date')
            .attr('x', mouse_x+10)
            .attr('y', 35)
            .text((mouse_date_format));
    }
}

function drawChart_Type(k){
    var shelter = [
        {"Type": "Caravans", "Percentage": "0.7968"},
        {"Type": "Combination*", "Percentage": "0.1081"},
        {"Type": "Tents", "Percentage": "0.0951"},
    ]

    let xScale = d3.scaleBand()
        .domain(shelter.map(function(d) { return d.Type; }))
        .range ([0, widthRight]);

    let yScale = d3.scaleLinear()
        .domain([1,0])
        .range ([padding.top, height]);

    //X AXIS
    const xAxis = d3.axisBottom()
        .scale(xScale);
    svg2.append('g')
        .attr("transform", "translate(" + yAxisTranslate + "," + xAxisTranslate + ")")
        .call(xAxis);

    // Y AXIS
    const yAxis = d3.axisLeft()
        .scale(yScale)
        .tickFormat(d3.format(".0%"));
    svg2.append('g')
        .attr("transform", "translate(" + yAxisTranslate + ",0)")
        .call(yAxis);

    let chart_buffer = 50;
    let xTranslate_buffer = xTranslate + chart_buffer/2;

    svg2.append("g")
        .attr("transform", "translate(" + xTranslate_buffer + "," + yTranslate + ")")
        .selectAll(".bar")
        .data(shelter)
        .enter().append("rect")
        .attr("class", "chart")
        .attr("x", function(d) { return xScale(d.Type); })
        .attr("y", function(d) { return yScale(d.Percentage); })
        .attr("width", (xScale.bandwidth()-chart_buffer))
        .attr("height", function(d) { return height - yScale(d.Percentage); })

    svg2.append("g")
        .attr("transform", "translate(" + (xTranslate_buffer+chart_buffer) + "," + yTranslate + ")")
        .selectAll(".text")
        .data(shelter)
        .enter()
        .append("text")
        .attr("class","label")
        .attr("x", function(d) { return xScale(d.Type); })
        .attr("y", function(d) { return yScale(d.Percentage) - 10; })
        .attr("fill", "currentColor")
        .attr("text-anchor", "middle")
        .text(  function(d) { return d3.format(",.2f")(d.Percentage*100) + " %"; })

}