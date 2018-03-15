// Store our API endpoint inside queryUrl
var url = "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_day.geojson";
// store default map tile
var darkmap = L.tileLayer("https://api.mapbox.com/styles/v1/mapbox/dark-v9/tiles/256/{z}/{x}/{y}?" +
  "access_token=pk.eyJ1IjoiYmJhbGVzMTEiLCJhIjoiY2plYmptdmFwMGRydzJybzdpdzBxazk1aiJ9.ASSE0faIpkFAu87MR5RM0g");
// set empty layers for later population
var earthquakes = new L.layerGroup();
var faults = new L.layerGroup();
var timeplug = new L.layerGroup();
// set default map object
var myMap = L.map("map", {
  center: [46.06, -114.34],
  zoom: 4,
  layers: [darkmap, earthquakes]
});
// GET request
d3.json(url, function(response) {
  // set  quake appearance to 10 min per order of magnitude
  var getInterval = function(quake) {
      return {
        start: quake.properties.time,
        end:   quake.properties.time + 
          quake.properties.mag * 600000
      };
    };
    // set datetime appearance of plugin visual
    var timelineControl = L.timelineSliderControl({
      formatOutput: function(date){
        return moment(date).format("YYYY-MM-DD HH:MM:SS");
      }
    });
  // function to calc circle marker radius to be based on magnitude
  function circRad(r) {
      return r*10;
    }
  // function to assign circle marker color to be based on magnitude
  function getColor(d) {
      return d <= 1 ? "#ffffb2":
             d <= 2 ? "#fed976":
             d <= 3 ? "#feb24c":
             d <= 4 ? "#fd8d3c":
             d <= 5 ? "#f03b20":
             d > 5 ? "#bd0026":
                      "#ffffff";
    }
  // function to style circle marker appearance
  function styleData(feature) {
  return {
    stroke: false,
    fillOpacity: .7,
    fillColor: getColor(feature.properties.mag),
    radius: circRad(feature.properties.mag)    
    };
  }
  // assign circle marker appearances based on start and end time
  var timeline = L.timeline(response, {
    getInterval: getInterval,

    // L.geoJSON(response, {
        // needed to get called inside the L.geoJSON function
    pointToLayer: function(feature, latlng) {
      return L.circleMarker(latlng);
    },
    style: styleData,
    onEachFeature: function(feature, layer) {
  // these need to go in a style function applied as a set style method
      layer.bindPopup("<h3>" + feature.properties.place +
        "</h3><hr><p>" + new Date(feature.properties.time) +
        "</p><p>" + "Magnitude: " + feature.properties.mag + "</p>");
    }
  // add circle markers to pre-established layer
  }).addTo(earthquakes)
  // add earthquake circle marker layer to map
  earthquakes.addTo(myMap)
  // add timeline and control to map
    timelineControl.addTo(myMap);
    timelineControl.addTimelines(timeline);
    timeline.addTo(timeplug);
    timeplug.addTo(myMap);
})
// set faultline boundry url
boundariesURL = "https://raw.githubusercontent.com/fraxen/tectonicplates/master/GeoJSON/PB2002_boundaries.json"
// GET request of fault lines
d3.json(boundariesURL, function (response) {
  function polystyle(feature) {
    return {
      fillColor: 'green',
      weight: 2,
      opacity: 1,
      color: 'green', //Outline color
      fillOpacity: 0.7
    };
  }
  // read geoJSON into polyline on map
  L.geoJSON(response, {
    style: polystyle
  // add lines to pre-established layer
  }).addTo(faults);
  // add fault lines to map
  faults.addTo(myMap)
})
// Create a legend to display information about our map
var legend = L.control({position: "bottomright"});
function getColor(d) {
  return d <= 1 ? "#ffffb2":
         d <= 2 ? "#fed976":
         d <= 3 ? "#feb24c":
         d <= 4 ? "#fd8d3c":
         d <= 5 ? "#f03b20":
         d > 5 ? "#bd0026":
                  "#ffffff";
}
// When the layer control is added, insert a div with the class of "legend"
legend.onAdd = function(map) {
  var div = L.DomUtil.create('div', 'info legend'),
        grades = [0, 1, 2, 3, 4, 5],
        labels = [];
  // loop through our density intervals and generate a label with a colored square for each interval
  for (var i = 0; i < grades.length; i++) {
      div.innerHTML +=
          '<i style="background:' + getColor(grades[i] + 1) + '"></i> ' +
          grades[i] + (grades[i + 1] ? '&ndash;' + grades[i + 1] + '<br>' : '+');
  }
return div;
};
legend.addTo(myMap);
// Define outdoors and satmap layers
var outmap = L.tileLayer("https://api.mapbox.com/styles/v1/mapbox/outdoors-v10/tiles/256/{z}/{x}/{y}?" +
  "access_token=pk.eyJ1IjoiYmJhbGVzMTEiLCJhIjoiY2plYmptdmFwMGRydzJybzdpdzBxazk1aiJ9.ASSE0faIpkFAu87MR5RM0g");
var satmap = L.tileLayer("https://api.mapbox.com/styles/v1/mapbox/satellite-v9/tiles/256/{z}/{x}/{y}?" +
  "access_token=pk.eyJ1IjoiYmJhbGVzMTEiLCJhIjoiY2plYmptdmFwMGRydzJybzdpdzBxazk1aiJ9.ASSE0faIpkFAu87MR5RM0g");
// Define a baseMaps object to hold our base layers
var baseMaps = {
  "Dark Map": darkmap,
  "Outdoors Map": outmap,
  "Satellite Map": satmap
};
// Create overlay object to hold our overlay layer
var overlayMaps = {
   "Earthquakes": earthquakes,
   "Plate Boundries": faults
};
// Create a layer control; Pass in our baseMaps and overlayMaps
L.control.layers(baseMaps, overlayMaps, {
  collapsed: false
// Add the layer control to the map  
}).addTo(myMap);
