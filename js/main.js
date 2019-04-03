//execute script when window is loaded
window.onload = fsetMap();

//set up choropleth map
function setMap(){
    
    //map frame dimensions
    var width = 960,
        height = 460;

    //create new svg container for the map
    var map = d3.select("body")
        .append("svg")
        .attr("class", "map")
        .attr("width", width)
        .attr("height", height);

  //create Albers equal area conic projection centered on Colombia
    var projection = d3.geoAlbers()
        .center([6.910, -73.910])
        .rotate([-2, 0, 0])
        .parallels([43, 62])
        .scale(2500)
        .translate([width / 2, height / 2]);

    var path = d3.geoPath()
        .projection(projection);
    
    //use Promise.all to parallelize asynchronous data loading
    var promises = [];
    promises.push(d3.csv("data/unitsData.csv")); //load attributes from csv
    promises.push(d3.json("data/SouthAmerica.topojson")); //load background spatial data
    promises.push(d3.json("data/ColombiaRegions.topojson")); //load choropleth spatial data
    Promise.all(promises).then(callback);

    function callback(data){
            //translate south america to TopoJSON
        var SouthAmericaCountries = topojson.feature(SouthAmerica, SouthAmerica.objects.SouthAmericaCountries),
            colombiaRegions = topojson.feature(Colombia, Colombia.objects.ColombiaRegions).features;
    
      //add South American countries to map
        var countries = map.append("path")
            .datum(SouthAmerica)
            .attr("class", "countries")
            .attr("d", path);

        //add France regions to map
        var regions = map.selectAll(".regions")
            .data(colombiaRegions)
            .enter()
            .append("path")
            .attr("class", function(d){
                return "regions " + d.properties.adm1_code;
            })
            .attr("d", path);

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

    csvData = data[0];
    SouthAmerica= data[1];
    colombia = data[2];
        console.log(csvData);
        console.log(SouthAmerica);
        console.log(colombia);
    };
};