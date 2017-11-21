var width = Math.max(960, window.innerWidth), //Use the whole browser viewport (not screen)
  height = Math.max(500, window.innerHeight);
    
var pi = Math.PI, tau = 2 * pi; //For spherical projections later

var projection = d3.geoMercator() //Web mercator proj setup
  .scale(1 / tau)
  .translate([0,0]);
  
var path = d3.geoPath() //Geospatial data path generator
  .projection(projection);
  
var tile = d3.tile() //Set up a map quadtree
  .size([width, height]);
  
var zoom = d3.zoom() //D3's zoom object for generally zooming in on SVGs
  .scaleExtent([ //Min and max zoom level
    1 << 11, //Bit shifting, represents 1^12
    1 << 24
  ])
  .on('zoom', zoomed); //Browser zoom event listener
  
var radius = d3.scaleSqrt() //Scale for sizing up circles appropriately  
  .range([0, 10]);  
    
//SVG setup
var svg = d3.select("body").append("svg").attr("width", width).attr("height", height);
  
var raster = svg.append("g"); //Main group for holding path objects
var vector = svg.append("path"); //Draw all elements to one path element

d3.json('./data/earthquakes_4326_cali.geojson', function(err, geojson) {
  if (err) throw err; 
  
  vector = vector.datum(geojson); //Bind all geodata
  
  
  
  var center = projection([-119.663, 37.414]); //Set center of proj (latlon) to California
  svg.call(zoom) //Use the zoom event to display the svg in correct zoom
    .call(zoom.transform, d3.zoomIdentity
      .translate(width/2, height/2)
      .scale(1 << 14)
      .translate(-center[0], -center[1]
    )
  );
  
  
  
}); //Async json/geojson
  
//Utility function to turn a zoom-like object into a translate string, which we've used previously in SVGs
function stringify(scale, translate) {
  var k = scale / 256;
  var r = scale % 1 ? Number : Math.round; 
  return "translate(" + r(translate[0] * scale) + "," + r(translate[1] * scale) + ") scale(" + k + ")";
}  
  
function zoomed() {
  var transform = d3.event.transform; //Get data found in event listener
  var tiles = tile.scale(transform.k).translate(transform.x, transform.y)();
  //Get the tiles transformed by the mouse's 2D movement as well as its mouse wheel zoom
  
  //Change the projection as well to handle the points
  projection.scale(transform.k / tau).translate([transform.x, transform.y]);
  
  vector.attr("d", path); //Redraw path accordingly
  
  var image = raster.attr("transform", stringify(tiles.scale, tiles.translate))
    .selectAll('image') //Empty selection for general update pattern
    .data(tiles, function(d) {return d;});
    
  image.exit().remove(); //Remove old elements
  
  image.enter().append("image")
    .attr("xlink:href", function(d) {
      return "https://" + "abc"[d[1] % 3] + ".basemaps.cartocdn.com/rastertiles/voyager" +
      d[2] + "/" + d[0] + "/" + d[1] + ".png"; //Use the RESTful API and send in parameters z,x,y. I'm getting flashbacks of OpenStreetMap (CS 61B)
    })
    .attr("x", function(d) {return d[0] * 256;}) //Position tiles at the correct places
    .attr("y", function(d) {return d[1] * 256;}) //Note the size is constant, but affected by zooms
    .attr("width", 256).attr("height", 256);
    
}









//A comment to hold the line.