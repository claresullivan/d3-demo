//execute script when window is loaded
window.onload = function(){
	//SVG dimension variables
    var w = 900, h = 500;

    var container = d3.select("body") //get the <body> element from the DOM
    	.append("svg") //put a new svg in the body
    	.attr("width", w) //assign the width
        .attr("height", h) //assign the height
        .attr("class", "container") //always assign a class (as the block name) for styling and future selection
    	.style("background-color", "rgba(0,0,0,0.2)"); //only put a semicolon at the end of the block!
    
    //innerRect block
    var innerRect = container.append("rect") //put a new rect in the svg
        .datum(400)
        .attr("width", function(d){ //rectangle width
            return d * 2; //400 * 2 = 800
        }) 
        .attr("height", function(d){ //rectangle height
            return d; //400
        })
        .attr("class", "innerRect") //class name
        .attr("x", 50) //position from left on the x (horizontal) axis
        .attr("y", 50) //position from top on the y (vertical) axis
        .style("fill", "#FFFFFF"); //fill color

        //create data array
        var cityPop = [
        	{
        		city: 'Leticia',
        		population: 42000
        	},
        	{
        		city: 'Florencia',
        		population: 183323
        	},
        	{
        		city: 'San Jose del Guaviare',
        		population: 45705
        	},
        	{
        		city: 'Puerto Asis',
        		population: 33362
        	}
        	];
        
        var circles = container.selectAll(".circles") //but wait--there are no circles yet!
        .data(cityPop) //here we feed in an array
        .enter() //one of the great mysteries of the universe
        .append("circle") //add a circle for each datum
        .attr("class", "circles") //apply a class name to all circles
        .attr("id", function(d){
            return d.city;
        })
        .attr("r", function(d){ //circle radius
             //calculate the radius based on population value as circle area
            var area = d.population * 0.02;
            return Math.sqrt(area/Math.PI);
        })
         .attr("cx", function(d, i){
            //use the index to place each circle horizontally
            return 90 + (i * 180);
        })
     	.attr("cy", function(d){
            //subtract value from 450 to "grow" circles up from the bottom instead of down from the top of the SVG
            return 450 - (d.population * 0.0005);
        });
};
