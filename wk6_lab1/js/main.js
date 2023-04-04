
// The function is called every time when an order comes in or an order gets processed
// The current order queue is stored in the variable 'orders'
let svg = d3.select("body").append("svg")
	.attr("width", 800)
	.attr("height", 200);

let text = svg.append("text")
	.attr("x", 20)
	.attr("y", 20);


function updateVisualization(orders) {
	console.log("orders: ", orders);
	circle_len = orders.length;

	let circle = svg.selectAll("circle")
		.data(orders);

	let coffee_color = "#707086";
	let tea_color = "#00d0ff";

	circle.enter()
		.append("circle")
		.attr("class", "dot")
		.attr("fill", function(d){
			if (d.product == "coffee"){
				return coffee_color;
			}
			else{
				return tea_color;
			}
		})
		.merge(circle)
		.attr("r", 30)
		.attr("cx",(d,circle_len)=>(circle_len * 80) + 50 )
		.attr("cy", 80);

	text.text("orders: "+ circle_len);
	circle.exit().remove();
	text.exit().remove();
}