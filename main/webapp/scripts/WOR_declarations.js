



var useGPS = true;
var WeatherServiceRequestURL = "";
var GPSLocationActual = [55.072917200215191, 13.711061468866212] //has latlon of current position. (Timer or listener constantly updating GPS is probably required)
var GPSRefreshInterval = 5000; //millsec between update vesselactual position
var GPSRefreshCounter = 0;
var weatherRefreshInterval = (10 * 60 * 1000) //ten minuts
var weatherRefreshCounter = 0;
var weatherFetchComplete = false;
var CompassHeadingActual = 0.0; //heading of vesselactual
var CompassHeadingOffset = 0; //set in options
var mapRenderComplete = false;
var ghostvesselMarker, vesselactualMarker; //both ship icons
var mapZoomLevel = 9;




var route = {
	waypoints: [
	{ id: 0, name: "pos1", legspeedmin: 12, legspeedmax: 13, lon: 13.711061468866212, lat: 55.072917200215191},
	{ id: 1, name: "pos2", legspeedmin: 11, legspeedmax: 12, lon: 12.663240423944345, lat: 54.880610640482985},
	{ id: 2, name: "pos3", legspeedmin: 11, legspeedmax: 12, lon: 12.165501166131834, lat: 54.58569106501511 },
	{ id: 3, name: "pos4", legspeedmin: 11, legspeedmax: 12, lon: 12.005518697218807, lat: 54.535904500233981 },
	{ id: 4, name: "pos5", legspeedmin: 10, legspeedmax: 11, lon: 11.930997774565851, lat: 54.569907839824936 },
	{ id: 5, name: "pos6", legspeedmin: 10, legspeedmax: 11, lon: 11.883514521671373, lat: 54.567784008455305}
	],
	sheduleElement: [ //waypoint weatherdata is saved in scheduleelement
	{ waypointId: 0, eta: "2017-04-11T00:00:01.000Z", nextwaypointdistance: 0, zoomdisplay: 0, winddirection: 0, windspeed: 0, waveheight: 0, wavedirection: 0, currentdirection: 0, currentspeed: 0 },
	{ waypointId: 1, eta: "2017-04-11T02:00:01.000Z", nextwaypointdistance: 0, zoomdisplay: 0, winddirection: 0, windspeed: 0, waveheight: 0, wavedirection: 0, currentdirection: 0, currentspeed: 0 },
	{ waypointId: 2, eta: "2017-04-11T04:00:01.000Z", nextwaypointdistance: 0, zoomdisplay: 0, winddirection: 0, windspeed: 0, waveheight: 0, wavedirection: 0, currentdirection: 0, currentspeed: 0 },
	{ waypointId: 3, eta: "2017-04-11T06:00:01.000Z", nextwaypointdistance: 0, zoomdisplay: 0, winddirection: 0, windspeed: 20, waveheight: 0, wavedirection: 0, currentdirection: 0, currentspeed: 0 },
	{ waypointId: 4, eta: "2017-04-11T08:00:01.000Z", nextwaypointdistance: 0, zoomdisplay: 0, winddirection: 0, windspeed: 0, waveheight: 0, wavedirection: 0, currentdirection: 0, currentspeed: 0 },
	{ waypointId: 4, eta: "2017-04-11T10:00:01.000Z", nextwaypointdistance: 0, zoomdisplay: 0, winddirection: 0, windspeed: 0, waveheight: 0, wavedirection: 0, currentdirection: 0, currentspeed: 0 },
	],
	weatherdata: { //returned data from weather service
		ghostvessel: { //time projected weather on pos of ghostvessel
			winddirection: 0,
			windspeed: 0,
			waveheight: 0,
			wavedirection: 0,
			currentdirection: 0,
			currentspeed: 0,
		},
		vesselactual: { //current weather on GPS pos of ship or start pos on route if no GPS
			winddirection: 0,
			windspeed: 0,
			waveheight: 0,
			wavedirection: 0,
			currentdirection: 0,
			currentspeed: 0,
		},
		clickmarker: { //current weather on position clicked on map (tap also works)
			winddirection: 0,
			windspeed: 0,
			waveheight: 0,
			wavedirection: 0,
			currentdirection: 0,
			currentspeed: 0,
		},
	},
	mapfeatures: { //scale features down to 0 instead of removing them. Is used to hide features.
		ghostvessel: {
			currentmarkerscale: 0.64,
			wavemarkerscale: 0.64,
			windmarkerscale: 1.3,
			compassscale: 0.6,
		},
		vesselactual: {
			currentmarkerscale: 0.84,
			wavemarkerscale: 0.84,
			windmarkerscale: 1.5,
			compassscale: 0.8,
		},
		clickmarker: {
			currentmarkerscale: 0.84,
			wavemarkerscale: 0.84,
			windmarkerscale: 1.5,
			compassscale: 0.8,
			lon: 0,
			lat:0,
		}
},

}


//var RouteDotRadius = 20; //radius of route markers, determines size of all route dots.
var WOR = {};
WOR.RouteDotRadius = 12;
WOR.windowWidthAtInit = $(window).width();
WOR.windowWidthAfterResize = 0;
WOR.ShipIconPosition = 0; //position in percentage of the routebar - saved everytime icon is moved - repositioned everytime map and browser is scaled or moved to fit.






//FOR TESTING PURPOSES - sets the time of the route 24 hours from client time
for (var i = 0; i != route.waypoints.length; i++) {
	var now = new Date();
	now.setTime(now.getTime() + (1000 * 60 * 60 * 24)); //add 24 hours to now
	route.sheduleElement[i].eta = now.toISOString().split("T")[0] + "T"+(route.sheduleElement[i].eta).split("T")[1];
}