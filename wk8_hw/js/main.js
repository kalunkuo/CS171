// Bar chart configurations: data keys and chart titles
let configs = [
    {key: "ownrent", title: "Own or Rent"},
    {key: "electricity", title: "Electricity"},
    {key: "latrine", title: "Latrine"},
    {key: "hohreligion", title: "Religion"}
];

// Initialize variables to save the charts later
let barcharts = [];
let areachart;



// Date parser to convert strings to date objects
let parseDate = d3.timeParse("%Y-%m-%d");
let data;

// (1) Load CSV data
// 	(2) Convert strings to date objects
// 	(3) Create new bar chart objects
// 	(4) Create new are chart object

d3.csv("data/household_characteristics.csv").then(data => {
    data.forEach(function(d) {
        d.survey = parseDate(d.survey);
    });

    data = data.sort(function(x, y){
        return d3.ascending(x.survey, y.survey);})
    console.log("parseDate: ", data);

    barcharts[0] = new BarChart("bar-0", data, configs[0]);
    barcharts[1] = new BarChart("bar-1", data, configs[1]);
    barcharts[2] = new BarChart("bar-2", data, configs[2]);
    barcharts[3] = new BarChart("bar-3", data, configs[3]);
    areachart = new AreaChart("area", data);

});

// React to 'brushed' event and update all bar charts
function brushed() {

    // Get the extent of the current brush
    let selectionRange = d3.brushSelection(d3.select(".brush").node());

    // Convert the extent into the corresponding domain values
    let selectionDomain = selectionRange.map(areachart.xScale.invert);
    //console.log("selectionDomain: ", selectionDomain);

    // Update focus chart (detailed information)
    barcharts[0].selectionChanged(selectionDomain);
    barcharts[1].selectionChanged(selectionDomain);
    barcharts[2].selectionChanged(selectionDomain);
    barcharts[3].selectionChanged(selectionDomain);

}
