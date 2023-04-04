/* * * * * * * * * * * * * *
*         PieChart         *
* * * * * * * * * * * * * */


class Chart {

    // constructor method to initialize Timeline object
    constructor(parentElement, data,) {
        this.parentElement = parentElement;
        this.data = data;
        this.displayData = [];
        //this.circleColors = ['#b2182b', '#d6604d', '#f4a582', '#fddbc7'];

        this.prepareData()
    }

    prepareData(){

        let vis = this;

        vis.dataLength = vis.data.length;
        vis.dataUpdated = vis.data;

        for(let i=0; i< vis.dataLength; i++){
            let val = vis.dataUpdated[i]['Priorates'];
            if (Number.isNaN(val)){
                vis.dataUpdated[i]['Priorates'] = 0;
            }
        }

        console.log("updatedData: ", vis.dataUpdated);


        // loading data
        console.log("dataOriginal: ", vis.data);
        // console.log("dataLength: ", vis.dataLength)
        // console.log("dataMarriages: ", dataMarriages);
        // console.log("dataBusiness: ", dataBusiness);


        vis.displayData = []

        for(let i=0; i< vis.dataLength; i++){
            vis.displayData[i] =
                {
                    "index": i,
                    "name": vis.data[i]['Family'],
                    "allRelations": dataBusiness[i].filter(x => x==1).length
                        + dataMarriages[i].filter(x => x==1).length,
                    // + vis.data[i]['Priorates'] + vis.data[i]['Wealth'],

                    "businessTies": dataBusiness[i].filter(x => x==1).length,
                    "businessValues": dataBusiness[i],
                    "marriages": dataMarriages[i].filter(x => x==1).length,
                    "marriageValues": dataMarriages[i],
                    "numberPriorates": vis.data[i]['Priorates'],
                    "wealth": vis.data[i]['Wealth']
                }
        }

        console.log("displayData", vis.displayData);
        console.log("dataLength", vis.dataLength);

        vis.initVis();
    }

    initVis() {
        let vis = this;

        // margin conventions
        vis.margin = {top: 50, right: 50, bottom: 10, left: 50};
        vis.width = document.getElementById(vis.parentElement).getBoundingClientRect().width - vis.margin.left - vis.margin.right;
        vis.height = document.getElementById(vis.parentElement).getBoundingClientRect().height - vis.margin.top - vis.margin.bottom;

        // init drawing area
        vis.svg = d3.select("#" + vis.parentElement).append("svg")
            .attr("width", vis.width + vis.margin.left + vis.margin.right)
            .attr("height", vis.height + vis.margin.top + vis.margin.bottom)
            .append("g")
            .attr("transform", "translate(" + vis.margin.left + "," + vis.margin.top + ")");


        // add title
        vis.svg.append('g')
            .attr('class', 'title')
            .append('text')
            .text('Florentine Family')
            .attr('transform', `translate(${vis.width / 2}, 20)`)
            .attr('text-anchor', 'middle');

        // legend
        vis.svg.append('g')
            .attr('class', 'legend')
            .append("text")
            .text("Marriage")
            .attr("x", vis.width-200)
            .attr("y", vis.height-50);

        vis.svg.append('g')
            .attr('class', 'legend')
            .append("text")
            .text("Business")
            .attr("x", vis.width-200)
            .attr("y", vis.height-25);

        vis.svg.append('rect')
            .attr("width", 15)
            .attr("height", 15)
            .attr("fill", "#4e41bf")
            .attr("x", vis.width-230)
            .attr("y", vis.height-62);

        vis.svg.append('rect')
            .attr("width", 15)
            .attr("height", 15)
            .attr("fill", "orange")
            .attr("x", vis.width-230)
            .attr("y", vis.height-37);

        // create matrix
        vis.size =  20;
        vis.cellPadding = 5;
        vis.rowLength = (vis.width - (vis.size + vis.cellPadding)  * vis.dataLength)/2;
        vis.buffer = 15;
        vis.trans_v = 150;

        // call next method in pipeline
        vis.wrangleData();
    }

    // wrangleData method
    wrangleData() {
        let vis = this

        if (selectedCategory){
            console.log("sel: ", selectedCategory);
        }
        else{
            selectedCategory = 'index';
            console.log("sel: ", selectedCategory);
        }

        vis.sortedData = vis.displayData;

        vis.sortedData.sort((a, b) => {
            return a[selectedCategory] - b[selectedCategory];
        });

        console.log('updated data: ', vis.displayData)

        vis.updateVis()
    }

    // updateVis method
    updateVis() {
        let vis = this;

        console.log("test3: ",vis.sortedData);

        vis.dataJoin = vis.svg.selectAll(".row")
            .data(vis.sortedData, function(d) { return d.name; });

        vis.row = vis.dataJoin
            .enter()
            .append("g")
            .attr("class", "row");

        vis.row.merge(vis.dataJoin)
            .style("opacity",0.3)
            .transition()
            .duration(500)
            .style("opacity",1)
            .attr("transform", function(d, i) {
                return "translate(0,"+ (vis.size + vis.cellPadding)*i + ")" ;})

        // triangle business
        vis.trianglePath_business = vis.row.selectAll(".triangle-path-business")
            .data(function(d,i){
                console.log("test: ",d.businessValues);
                return d.businessValues;
            })
            .enter()
            .append("path")
            .attr("class", "triangle-path-business")
            .merge(vis.row)
            .attr("d", function(d, i) {
                let x = (vis.size + vis.cellPadding) * i;
                let y = 0;

                return 'M ' + x +' '+ y
                    + ' l ' + vis.size + ' ' + '0'
                    + ' l' + '0' + ' ' + vis.size
                    + ' z';
            })
            .attr('fill', function(d,i){
                if (d === 1){
                    return 'orange'
                }
                else{
                    return '#d3d3d3'
                }
            })
        vis.trianglePath_business.attr("transform", "translate(" + vis.rowLength + "," + vis.trans_v + ")");

        // triangle marriage
        vis.trianglePath_marriage = vis.row.selectAll(".triangle-path-marriage")
            .data(function(d,i){
                return d.marriageValues;})
            .enter()
            .merge(vis.row)
            .append("path")
            .attr("class", "triangle-path-marriage")
            .attr("d", function(d, i) {
                let x = (vis.size + vis.cellPadding) * i;
                let y = 0;
                return 'M ' + x +' '+ y
                    + ' l' + '0' + ' ' + vis.size
                    + ' l ' + vis.size + ' ' + '0'
                    + ' z';
            })
            .attr('fill', function(d,i){
                if (d === 1){
                    return '#4e41bf'
                }
                else{
                    return '#d3d3d3'
                }
            })
        vis.trianglePath_marriage.attr("transform", "translate(" + vis.rowLength + "," + vis.trans_v + ")");

        // vis.label_v = vis.row.append("g")
        // vis.label_v = vis.row
        //     .append("text")
        //     .attr("class", "row-label")
        //     .attr("transform", "translate(" + (vis.rowLength-vis.buffer)
        //         + "," + (vis.trans_v+vis.cellPadding*2) + ")")
        //     .attr('text-anchor','end')
        //     .attr('alignment-baseline','middle')
        //     .text(d => d['name'])


        vis.row.append("text")
            .attr("class", "row-label")
            .attr("x", (vis.rowLength-vis.buffer))
            .attr("y", function(d, i) { return vis.trans_v+vis.cellPadding*2; })
            .attr("text-anchor", "end")
            .attr("dy", "0.35em")
            .text(function(d) {
                return d.name;
            });


        // label horizontal
        vis.label_h = vis.svg.selectAll(".row-label-h")
            .data(vis.sortedData)

        vis.label_h
            .enter()
            .append("text")
            .attr("class", "row-label-h")
            .attr('text-anchor','start')
            .text(d => d['name'])


    }
}