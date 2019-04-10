//execute script when window is loaded
window.onload = setMap();

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
        .center([0, 2])
        .rotate([73, 0])
        .parallels([43, 62])
        .scale(1750)
        .translate([width / 2, height / 2]);

    var path = d3.geoPath()
        .projection(projection);

function setMap(){
    //use Promise.all to parallelize asynchronous data loading
    var promises = [];
    promises.push(d3.csv("data/COL_adm2_PalmaAptitud_objid.csv")); //load attributes from csv
    promises.push(d3.json("data/ne_110m_land.topojson")); //load background spatial data
    promises.push(d3.json("data/COL_adm2_topojson_v2.topojson")); //load choropleth spatial data
    Promise.all(promises).then(callback);

   function callback(data){
          //translate land to TopoJSON
          csvData = data[0];
	      land = data[1];
	      colombia = data[2];
          //translate land to TopoJSON
          var landSurrounding = topojson.feature(land, land.objects.ne_110m_land),
          	colRegions = topojson.feature(colombia, colombia.objects.COL_adm2_topojson).features; 	
	
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


	//add surrounding land to map
        var land = map.append("path")
            .datum(landSurrounding)
            .attr("class", "Land")
            .attr("d", path);

         //add Colombia municipalities to map
        var regions = map.selectAll(".regions")
            .data(colRegions)
            .enter()
            .append("path")
            .attr("class", function(d){
                return "regions " + d.properties.ID_2;
            })
            .attr("d", path);

       //  examine results
       //console.log(csvData);
       //console.log(landSurrounding);
       //console.log(colRegions);
    	};
};
