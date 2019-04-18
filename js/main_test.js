//Clare Sullivan
//D3 Lab 2
//Bugs to fix
//1. chart dehighlight might still not work
//2. Is it possible to wrap the title in the bar chart
//3. Label that is not dynamic changes attribute and name, and piles up
//4. Moving label does not have a dynamic attribute 
//6. Correct Labels are piling up at the bottom



//First line of main.js...wrap everything in a self-executing anonymous function to move to local scope
(function(){

//pseudo-global variables
var attrArray = ["Moderately Suitable for Oil Palm", "Highly Suitable for Oil Palm", "in Pasture", "in Forest", "in Protected Areas", "Former FARC Territory", "Former ELN Territory"]; //list of attributes
var expressed = attrArray[0]; //initial attribute

//chart frame dimensions
var chartWidth = window.innerWidth * 0.4,
    chartHeight = 750,
    leftPadding = 25,
    rightPadding = 2,
    //could change this to move charts lower on the page?
    topBottomPadding = 5,
    chartInnerWidth = chartWidth - leftPadding - rightPadding,
    chartInnerHeight = chartHeight - topBottomPadding * 2,
    translate = "translate(" + leftPadding + "," + topBottomPadding + ")";

//create a scale to size bars proportionally to frame
var yScale = d3.scaleLinear()
        .range([chartHeight,0])
        .domain([0, 105]);

//execute script when window is loaded
window.onload = setMap();

function setMap(){


	//set up choropleth map
    //map frame dimensions
    var width = window.innerWidth * 0.5,
        height = 750;

    //create new svg container for the map
    var map = d3.select("body")
        .append("svg")
        .attr("class", "map")
        .attr("width", width)
        .attr("height", height);

    //create Albers equal area conic projection centered on Colombia
    var projection = d3.geoAlbers()
        .center([0, 3.9])
        .rotate([73, 0])
        .parallels([20, 20])
        .scale(2500)
        .translate([width / 2, height / 2]);

    var path = d3.geoPath()
        .projection(projection);

    //use Promise.all to parallelize asynchronous data loading
    var promises = [];
    //bar chart format is not working with my data so I am putting in dummy data need to adjust data to percentage of dept area
    promises.push(d3.csv("data/COL_adm1_AptitudPalma.csv")); //load attributes from csv
    //TO DO: change to 50m map, for better match
    promises.push(d3.json("data/ne_50m_land.json")); //load background spatial data
    promises.push(d3.json("data/COL_adm1_topojson_0417.json")); //load choropleth spatial data
    Promise.all(promises).then(callback);

   function callback(data, csvData, landSurrounding, colRegions){
          //translate land to TopoJSON
          csvData = data[0];
	      land = data[1];
	      colombia = data[2];

	      //place graticule on the map
          setGraticule(map, path);

          //translate land to TopoJSON
          var landSurrounding = topojson.feature(land, land.objects.ne_50m_land)
          var colRegions = topojson.feature(colombia, colombia.objects.COL_adm1_topojson_0417).features; 	
		
			//add surrounding land to map
          var land = map.append("path")
            .datum(landSurrounding)
            .attr("class", "Land")
            .attr("d", path);

           //join csv data to GeoJSON enumeration units
        	colRegions = joinData(colRegions, csvData);

           //create the color scale
           var colorScale = makeColorScale(csvData);

           //add enumeration units to the map
           setEnumerationUnits(colRegions, map, path, colorScale);
           setChart(csvData, colorScale);
           //Am I calling the right items here??
           createDropdown(csvData);
    };
}; //end of setMap()


//Create bar chart container
//function to create coordinated bar chart
function setChart(csvData, colorScale){

    //create a second svg element to hold the bar chart
    var chart = d3.select("body")
        .append("svg")
        .attr("width", chartWidth)
        .attr("height", chartHeight)
        .attr("class", "chart");

     //create a rectangle for chart background fill
    var chartBackground = chart.append("rect")
        .attr("class", "chartBackground")
        .attr("width", chartInnerWidth)
        .attr("height", chartInnerHeight)
        .attr("transform", translate);

    //create a bar for each department
    var bars = chart.selectAll(".bar")
        .data(csvData)
        .enter()
        .append("rect")
        .sort(function(a, b){
          return b[expressed]-a[expressed]
        })
        .attr("class", function(d){
           return "bars " + d.ID_1;
        })
        .attr("width", chartWidth / csvData.length - 1)
        .on("mouseover", highlight)
        .on("mouseout", dehighlight)
        .on("mousemove", moveLabel);

    //annotate bars with attribute value text
    var numbers = chart.selectAll(".numbers")
        .data(csvData)
        .enter()
        .append("text")
        .sort(function(a, b){
            return b[expressed]-a[expressed]
        })
        .attr("class", function(d){
            return "numbers " + d.ID_1;
        })
        .attr("text-anchor", "middle")
        .attr("x", function(d, i){
            var fraction = chartWidth / csvData.length;
            return i * fraction + (fraction - 1) / 2;
        })
        .attr("y", function(d){
// var yScale = d3.scaleLinear()
//         .range([chartHeight],0)
//         .domain([0, 105]);
         //console.log(chartHeight);
            //return chartHeight - yScale(100-parseFloat(d[expressed]))+ 15;
        //return (chartHeight -  parseFloat(d[expressed]) )-40;
        })
        .text(function(d){
            return d[expressed];
        });

           //create a text element for the chart title
    var chartTitle = chart.append("text")
        .attr("x", 40)
        .attr("y", 40)
        .attr("class", "chartTitle")
        .selectAll("text")
        //.call(wrap, x.rangeBand());
        //.text("Number of Variable " + expressed[3] + " in each region");

    //create vertical axis generator
    var yAxis = d3.axisLeft()
        .scale(yScale);

     //place axis
    var axis = chart.append("g")
        .attr("class", "axis")
        .attr("transform", translate)
        .call(yAxis);

    //create a frame for chart border
    var chartFrame = chart.append("rect")
        .attr("class", "chartFrame")
        .attr("width", chartInnerWidth)
        .attr("height", chartInnerHeight)
        .attr("transform", translate);

  

     var desc = bars.append("desc")
        .text('{"stroke": "none", "stroke-width": "0px"}');
        //.attr("x", function(d,i){
        //    return i * (chartWidth/csvData.length);
        //})
        // .attr("y", function(d){
        //    return chartHeight -yScale(parseFloat(d[expressed]));
        //})
        //.style("fill", function(d){
        //    return choropleth(d, colorScale);
        //.attr("height", 750)
        //.attr("y", 0);

        //set bar positions, heights, and colors
        updateChart(bars, csvData.length, colorScale,expressed);

    };//end of SetChart()




//Drop-down menu
//This is too high, it is not on top of the map
//function to create a dropdown menu for attribute selection

function createDropdown(csvData){
    //add select element
    var dropdown = d3.select("#drop")
        .append("select")
        .attr("class", "dropdown")
        .on("change", function(){
            changeAttribute(this.value, csvData)
        });

    //add initial option
    var titleOption = dropdown.append("option")
        .attr("class", "titleOption")
        .attr("disabled", "true")
        .text("Select Land Attributes");

    //add attribute name options
    var attrOptions = dropdown.selectAll("attrOptions")
        .data(attrArray)
        .enter()
        .append("option")
        .attr("value", function(d){ return d })
        .text(function(d){ return d });
};

//dropdown change listener handler
function changeAttribute(attribute, csvData){

    //change the expressed attribute
    expressed = attribute;

    //recreate the color scale
    var colorScale = makeColorScale(csvData);

    //recolor enumeration units
    var regions = d3.selectAll(".regions")
        .transition()
        .duration(1000)
        .style("fill", function(d){
            return choropleth(d.properties, colorScale)
        });

    //re-sort, resize, and recolor bars
    var bars = d3.selectAll(".bars")
        //re-sort bars
        .sort(function(a, b){
            return b[expressed] - a[expressed];
        })
          .transition() //add animation
        .delay(function(d, i){
            return i * 20
        })
        .duration(500);
       //console.dir(bars.keys);
        //  var bars = chart.selectAll(".bar")
        // .data(csvData)
        // .enter()
        // .append("rect")
        // .sort(function(a, b){
        //   return b[expressed]-a[expressed]
        // })
        // .attr("class", function(d){
        //    return "bars " + d.ID_1;
        // })
        // .attr("width", chartWidth / csvData.length - 1);
        //.attr("x", function(d, i){
        //    return i * (chartInnerWidth / csvData.length) + leftPadding;
        //})
        //resize bars
        //.attr("height", function(d, i){
        //    return 750 - yScale(parseFloat(d[expressed]));
        //})
        //.attr("y", function(d, i){
        //    return yScale(parseFloat(d[expressed])) + topBottomPadding;
        //})
        //recolor bars
        //.style("fill", function(d){
        //    return choropleth(d, colorScale);
        //});

        //is this in the correct spot?
     updateChart(bars, csvData.length, colorScale, attribute);
    }; //end of changeAttribtue()

//function to position, size, and color bars in chart
function updateChart(bars, n, colorScale, expressed){
    //position bars

    bars.attr("x", function(d, i){
            return i * (chartInnerWidth / n) + leftPadding;
        })
        //size/resize bars
        .attr("height", function(d, i){
            return 750 - yScale(parseFloat(d[expressed]));
        })
        .attr("y", function(d, i){
            return yScale(parseFloat(d[expressed])) + topBottomPadding - 12;
        })
        //color/recolor bars
        .style("fill", function(d){
            return choropleth(d, colorScale);
        });
        //Correct the chartTitle to stop printing single letters - look at array notatin
        var chartTitle = d3.select(".chartTitle")
            .text("Percent of Area " + expressed + " in Each Department");

};

//Graticules
function setGraticule(map, path){
  	   //create graticule generator
        var graticule = d3.geoGraticule()
            .step([5, 5]); //place graticule lines every 5 degrees of longitude and latitude

                    //create graticule background
        var gratBackground = map.append("path")
            .datum(graticule.outline()) //bind graticule background
            .attr("class", "gratBackground") //assign class for styling
            .attr("d", path) //project graticule

                    //create graticule lines
        var gratLines = map.selectAll(".gratLines") //select graticule elements that will be created
            .data(graticule.lines()) //bind graticule lines to each element to be created
            .enter() //create an element for each datum
            .append("path") //append each element to the svg as a path element
            .attr("class", "gratLines") //assign class for styling
            .attr("d", path); //project graticule lines
};

//Data join
function joinData(colRegions, csvData){
	//variables for data  - moved this up to global
    //var attrArray = ["Moderately Suitable for Oil Palm", "Highly Suitable for Oil Palm", "in Protected Area", "Cattle Population","Former FARC Territory", "Former ELN Territory"];

    //loop through csv to assign each set of csv attribute values to geojson region
    for (var i=0; i<csvData.length; i++){
        var csvRegion = csvData[i]; //the current region
        var csvKey = csvRegion.ID_1; //the CSV primary key

        //loop through geojson regions to find correct region
        for (var a=0; a<colRegions.length; a++){

            var geojsonProps = colRegions[a].properties; //the current region geojson properties
            var geojsonKey = geojsonProps.ID_1; //the geojson primary key

            //where primary keys match, transfer csv data to geojson properties object
            if (geojsonKey == csvKey){

                //assign all attributes and values
                attrArray.forEach(function(attr){
                    var val = parseFloat(csvRegion[attr]); //get csv attribute value
                    geojsonProps[attr] = val; //assign attribute and value to geojson properties
                });

            };
        };
    };


    return colRegions;
};


//function to create color scale generator
function makeColorScale(data){
    var colorClasses = [
       "#ffffd4",
        "#fed98e",
        "#fe9929",
        "#d95f0e",
        "#993404",
        //"#ffffcc",
        //"#c2e699",
        //"#78c679",
        //"#31a354",
        //"#006837",
    ];

    //create color scale generator (choosing quantile for now, natural breaks may be a better choice)
    var colorScale = d3.scaleQuantile()
        .range(colorClasses);

    //build array of all values of the expressed attribute
    var domainArray = [];
    for (var i=0; i<data.length; i++){
        var val = parseFloat(data[i][expressed]);
        domainArray.push(val);
    };

    //assign array of expressed values as scale domain
    colorScale.domain(domainArray);

    return colorScale;
    console.log(colorScale.quantiles()) 
};

//tests for data value and return color
function choropleth(props, colorScale){
    //make sure attribute value is a number
    var val = parseFloat(props[expressed]);
    //if attribute value exists, assign a color; otherwise assign gray
    if (typeof val == 'number' && !isNaN(val)){
        return colorScale(val);
    } else {
        return "#CCC";
    };
};

//Add Colombian departments to the map
function setEnumerationUnits(colRegions, map, path, colorScale){
     //add Colombia municipalities to map
        var regions = map.selectAll(".regions")
            .data(colRegions)
            .enter()
            .append("path")
            .attr("class", function(d){
                return "regions " + d.properties.ID_1;
            })
            .attr("d", path)
            .style("fill", function(d){
                return choropleth(d.properties, colorScale);
            })
            .on("mouseover", function(d){
                highlight(d.properties);
            })
            .on("mouseout", function(d){
            dehighlight(d.properties);
            })
            .on("mousemove", moveLabel);

        var desc = regions.append("desc")
            .text('{"stroke": "#000", "stroke-width": "0.5px"}');
};

//function to highlight enumeration units and the bar chart
function highlight(props){
    //change stroke
    var selected = d3.selectAll("." + props.ID_1)
        .style("stroke", "#ffffd4")  
        .style("stroke-width", "3");
    setLabel(props);
};

//function to create dynamic label
function setLabel(props){
    //label content
    var labelAttribute = "<h1>" + props[expressed] +
        "</h1><b>" + expressed + "</b>";
        
        //create info label div
    var infolabel = d3.select("body")
        .append("div")
        .attr("class", "infolabel")
        .attr("id", props.ID_1 + "_label")
        .html(labelAttribute);

    var regionName = infolabel.append("div")
        .attr("class", "labelname")
        .html(props.NAME_1);
};

//function to reset the element style on mouseout
function dehighlight(props){
    var selected = d3.selectAll("." + props.ID_1)
        .style("stroke", function(){
            return getStyle(this, "stroke")
        })
        .style("stroke-width", function(){
            return getStyle(this, "stroke-width")
        });

    function getStyle(element, styleName){
        var styleText = d3.select(element)
            .select("desc")
            .text();

        var styleObject = JSON.parse(styleText);

        return styleObject[styleName];
    };

    //remove the info label
     d3.select(".infolabel")
        .remove();
};

function moveLabel(){
    //use coordinates of mousemove event to set label coordinates
    var x = d3.event.clientX + 10,
        y = d3.event.clientY - 75;

    d3.select(".infolabel")
        .style("left", x + "px")
        .style("top", y + "px");
};

})(); //last line of main.js