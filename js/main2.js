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
    var width = 960,
        height = 660;

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
        .parallels([43, 62])
        .scale(2500)
        .translate([width / 2, height / 2]);

    var path = d3.geoPath()
        .projection(projection);

    //use Promise.all to parallelize asynchronous data loading
    var promises = [];
    promises.push(d3.csv("data/COL_adm2_PalmaAptitud.csv")); //load attributes from csv
    promises.push(d3.json("data/ne_110m_land.topojson")); //load background spatial data
    promises.push(d3.json("data/COL_adm2_topojson_v2.topojson")); //load choropleth spatial data
    Promise.all(promises).then(callback);

   function callback(data){
          //translate land to TopoJSON
          csvData = data[0];
	      land = data[1];
	      colombia = data[2];

	      //place graticule on the map
          setGraticule(map, path);

          //translate land to TopoJSON
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
           setEnumerationUnits(colRegions, map, path);
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
	//variables for data join
    var attrArray = ["NO_APTA", "APTITUD_BAJO", "APTITUD_MEDIA", "APTITUD_ALTA", "EXCLUSION_LEGAL"];

    //loop through csv to assign each set of csv attribute values to geojson region
    for (var i=0; i<csvData.length; i++){
        var csvRegion = csvData[i]; //the current region
        var csvKey = csvRegion.ID_2; //the CSV primary key

        //loop through geojson regions to find correct region
        for (var a=0; a<colRegions.length; a++){

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

//function to create color scale generator
function makeColorScale(data){
    var colorClasses = [
        "#D4B9DA",
        "#C994C7",
        "#DF65B0",
        "#DD1C77",
        "#980043"
    ];

    //create color scale generator
    var colorScale = d3.scaleQuantile()
        .range(colorClasses);

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

function setEnumerationUnits(colRegions, map, path, colorScale){
     //add Colombia municipalities to map
        var regions = map.selectAll(".regions")
            .data(colRegions)
            .enter()
            .append("path")
            .attr("class", function(d){
                return "regions " + d.properties.ID_2;
            })
            .attr("d", path)
            .style("fill", function(d){
            return colorScale(d.properties, colorScale);
        });
};
       


})(); //last line of main.js
