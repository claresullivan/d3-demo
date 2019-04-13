/***********************************************
* A JavaScript document by Carl Sack           *
* D3 Coordinated Visualization Example Code    *
* Creative Commons 4.0 license, 2017           *
***********************************************/

//wrap everything in a self-executing anonymous function to move to local scope
(function(){

//pseudo-global variables
var attrArray = ["NO_APTA", "APTITUD_BAJO", "APTITUD_MEDIA", "APTITUD_ALTA", "EXCLUSION_LEGAL"]; //list of attributes
var expressed = attrArray[0]; //initial attribute


//begin script when window loads
window.onload = setMap();

//set up choropleth map
function setMap(){
    //map frame dimensions
    var width = 960,
        height = 660;

	//create new svg container for the map
	var map = d3.select("body")
		.append("svg")
		.attr("class", "map")
		.attr("width", width)
		.attr("height", height);

	//create Albers equal area conic projection centered on France
	var projection = d3.geoAlbers()
		.center([0, 3.9])
		.rotate([73, 0])
		.parallels([43, 62])
		.scale(2500)
		.translate([width / 2, height / 2]);

	var path = d3.geoPath()
		.projection(projection);

	 //use Promise.all to parallelize asynchronous data loading HELLO!!!!!
 var promises = [];
		promises.push(d3.csv, "data/COL_adm2_PalmaAptitud.csv"); //load attributes from csv
		promises.push(d3.json, "data/ne_110m_land.topojson"); //load background spatial data
		promises.push(d3.json, "data/COL_adm2_topojson_v2.topojson"); //load choropleth spatial data
		Promise.all(promises).then(callback);

	function callback(data, csvData, landSurrounding, colRegions){
		//translate land to TopoJSON
          csvData = data[0];
	      land = data[1];
	      colombia = data[2];
		
		//place graticule on the map
		//setGraticule(map, path);
		
		//translate land and colombia admin boundaries to TopoJSON
          var landSurrounding = topojson.feature(land, land.objects.ne_110m_land),
          	colRegions = topojson.feature(colombia, colombia.objects.COL_adm2_topojson).features; 

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

		//add coordinated visualization to the map
		//setChart(csvData, colorScale);
	};
}; //end of setMap()

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
	//loop through csv to assign each set of csv attribute values to geojson region
	for (var i=0; i<csvData.length; i++){
		var csvRegion = csvData[i]; //the current region
		var csvKey = csvRegion.ID_2; //the CSV primary key

		//loop through geojson regions to find correct region
		for (var a=0; a<franceRegions.length; a++){
			
			var geojsonProps = colRegions[a].properties; //the current region geojson properties
			var geojsonKey = geojsonProps.ID_2; //the geojson primary key

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

function setEnumerationUnits(colRegions, map, path, colorScale){

	//add France regions to map
	var regions = map.selectAll(".regions")
		.data(colRegions)
		.enter()
		.append("path")
		.attr("class", function(d){
			return "regions " + d.properties.ID_2;
		})
		.attr("d", path)
		.style("fill", function(d){
			return choropleth(d.properties, colorScale);
		});
};

//function to create color scale generator
function makeColorScale(data){
	var colorClasses = [
		"#ffffcc",
        "#c2e699",
        "#78c679",
        "#31a354",
        "#006837"
	];

	/*//QUANTILE SCALE
	//create color scale generator
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
	*/

	/*//EQUAL INTERVAL SCALE
	//create color scale generator
	var colorScale = d3.scaleQuantile()
		.range(colorClasses);

	//build two-value array of minimum and maximum expressed attribute values
	var minmax = [
		d3.min(data, function(d) { return parseFloat(d[expressed]); }), 
		d3.max(data, function(d) { return parseFloat(d[expressed]); })
	];
	//assign two-value array as scale domain
	colorScale.domain(minmax);
	*/

	//NATURAL BREAKS SCALE
	//create color scale generator
	var colorScale = d3.scaleThreshold()
		.range(colorClasses);

	//build array of all values of the expressed attribute
	var domainArray = [];
	for (var i=0; i<data.length; i++){
		var val = parseFloat(data[i][expressed]);
		domainArray.push(val);
	};

	//cluster data using ckmeans clustering algorithm to create natural breaks
	var clusters = ss.ckmeans(domainArray, 5);
	//reset domain array to cluster minimums
	domainArray = clusters.map(function(d){
		return d3.min(d);
	});
	//remove first value from domain array to create class breakpoints
	domainArray.shift();

	//assign array of last 4 cluster minimums as domain
	colorScale.domain(domainArray);

	return colorScale;
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

//function to create coordinated bar chart
function setChart(csvData, colorScale){
	//chart frame dimensions
	var chartWidth = window.innerWidth * 0.425,
		chartHeight = 473,
		leftPadding = 25,
		rightPadding = 2,
		topBottomPadding = 5,
		innerWidth = chartWidth - leftPadding - rightPadding,
		innerHeight = chartHeight - topBottomPadding * 2,
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
		.attr("width", innerWidth)
		.attr("height", innerHeight)
		.attr("transform", translate);

	//create a scale to size bars proportionally to frame and for axis
	var yScale = d3.scaleLinear()
		.range([463, 0])
		.domain([0, 100]);

	//set bars for each province
	var bars = chart.selectAll(".bar")
		.data(csvData)
		.enter()
		.append("rect")
		.sort(function(a, b){
			return b[expressed]-a[expressed]
		})
		.attr("class", function(d){
			return "bar " + d.adm1_code;
		})
		.attr("width", innerWidth / csvData.length - 1)
		.attr("x", function(d, i){
			return i * (innerWidth / csvData.length) + leftPadding;
		})
		.attr("height", function(d, i){
			return 463 - yScale(parseFloat(d[expressed]));
		})
		.attr("y", function(d, i){
			return yScale(parseFloat(d[expressed])) + topBottomPadding;
		})
		.style("fill", function(d){
			return choropleth(d, colorScale);
		});

	//annotate bars with attribute value text
	/*var numbers = chart.selectAll(".numbers")
		.data(csvData)
		.enter()
		.append("text")
		.sort(function(a, b){
			return b[expressed]-a[expressed]
		})
		.attr("class", function(d){
			return "numbers " + d.adm1_code;
		})
		.attr("text-anchor", "middle")
		.attr("x", function(d, i){
			var fraction = (chartWidth - 27) / csvData.length;
			return (i * fraction + (fraction - 1) / 2) + 25;
		})
		.attr("y", function(d){
			return yScale(parseFloat(d[expressed])) + 20;
		})
		.text(function(d){
			return d[expressed];
		});*/

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
		.attr("width", innerWidth)
		.attr("height", innerHeight)
		.attr("transform", translate);
};

})();