//Clare Sullivan
//D3 Lab Module 9

//First line of main.js...wrap everything in a self-executing anonymous function to move to local scope
(function(){

//pseudo-global variables
var attrArray = ["NO_APTA", "APTITUD_BAJO", "APTITUD_MEDIA", "APTITUD_ALTA", "EXCLUSION_LEGAL"]; //list of attributes
var expressed = attrArray[0]; //initial attribute

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
        //maybe need to adust this
        .parallels([20, 50])
        .scale(2500)
        .translate([width / 2, height / 2]);

    var path = d3.geoPath()
        .projection(projection);

    //use Promise.all to parallelize asynchronous data loading
    var promises = [];
    //bar chart format is not working with my data so I am putting in dummy data need to adjust data to percentage of dept area
    promises.push(d3.csv("data/COL_adm1_AptitudPalma_dummy.csv")); //load attributes from csv
    //TO DO: change to 50m map, for better match
    promises.push(d3.json("data/ne_50m_land.json")); //load background spatial data
    promises.push(d3.json("data/COL_adm1_geojson.json")); //load choropleth spatial data
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
          var colRegions = topojson.feature(colombia, colombia.objects.COL_adm1_geojson).features; 	
		
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
    };
}; //end of setMap()


//Create bar chart container
//function to create coordinated bar chart
function setChart(csvData, colorScale){
    //chart frame dimensions
    var chartWidth = window.innerWidth * 0.425,
        chartHeight = 750,
        leftPadding = 25,
        rightPadding = 2,
        topBottomPadding = 5,
        chartInnerWidth = chartWidth - leftPadding - rightPadding,
        chartInnerHeight = chartHeight - topBottomPadding * 2,
        translate = "translate(" + leftPadding + "," + topBottomPadding + ")";


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

    //create a scale to size bars proportionally to frame
    var yScale = d3.scaleLinear()
        .range([0, chartHeight])
        .domain([0, 105]);

    //annotate bars with attribute value text
    var numbers = chart.selectAll(".numbers")
        .data(csvData)
        .enter()
        .append("text")
        .sort(function(a, b){
            return a[expressed]-b[expressed]
        })
        .attr("class", function(d){
            return "numbers " + d.adm1_code;
        })
        .attr("text-anchor", "middle")
        .attr("x", function(d, i){
            var fraction = chartWidth / csvData.length;
            return i * fraction + (fraction - 1) / 2;
        })
        .attr("y", function(d){
            return chartHeight - yScale(parseFloat(d[expressed])) + 15;
        })
        .text(function(d){
            return d[expressed];
        });

           //create a text element for the chart title
    var chartTitle = chart.append("text")
        .attr("x", 40)
        .attr("y", 40)
        .attr("class", "chartTitle")
        .text("Number of Variable " + expressed[3] + " in each region");

    //create vertical axis generator
    var yAxis = d3.axisLeft()
        .scale(yScale);

     //place axis
    var axis = chart.append("g")
        .attr("class", "axis")
        .attr("transform", translate)
        .call(yAxis);

    //create frame for chart border
    var chartFrame = chart.append("rect")
        .attr("class", "chartFrame")
        .attr("width", chartInnerWidth)
        .attr("height", chartInnerHeight)
        .attr("transform", translate);

  //set bars for each province
    var bars = chart.selectAll(".bars")
        .data(csvData)
        .enter()
        .append("rect")
        .sort(function(a, b){
            return a[expressed]-b[expressed]
        })
        .attr("class", function(d){
            return "bars " + d.adm1_code;
        })
        .attr("width", chartWidth / csvData.length - 1)
        .attr("x", function(d, i){
            return i * (chartWidth / csvData.length);
        })
        .attr("height", function(d){
            return yScale(parseFloat(d[expressed]));
        })
        .attr("y", function(d){
            return chartHeight - yScale(parseFloat(d[expressed]));
        })
         //apply color scale to bars
        .style("fill", function(d){
            return choropleth(d, colorScale);
        });
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
	//variables for data join
    var attrArray = ["NO_APTA", "APTITUD_BAJO", "APTITUD_MEDIA", "APTITUD_ALTA", "EXCLUSION_LEGAL"];

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
        "#ffffcc",
        "#c2e699",
        "#78c679",
        "#31a354",
        "#006837",
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

//function to test for data value and return color
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
        });
};

})(); //last line of main.js