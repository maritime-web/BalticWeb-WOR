



var useGPS = true;
var WeatherServiceRequestURL = "";
var GPSLocationActual = [55.072917200215191, 13.711061468866212] //has latlon of current position. (Timer or listener constantly updating GPS is probably required)
var CompassHeadingActual = 0.0; //heading of vesselactual
var mapRenderComplete = false;
var weatherFetchComplete = false; //instead of making callbacks after data request, timers are used in tis prototype, should make angular integration easier.
var ghostvesselMarker, vesselactualMarker; //both ship icons


var route = {
	waypoints: [
	{ id: 0, name: "pos1", legspeedmin: 12, legspeedmax: 13, lon: 13.711061468866212, lat: 55.072917200215191, winddirection: 190, windspeed: 24, airtemperature: 9, currentdirection: 155, currentspeed: 3.2 },
	{ id: 1, name: "pos2", legspeedmin: 11, legspeedmax: 12, lon: 12.663240423944345, lat: 54.880610640482985, winddirection: 120, windspeed: 28, airtemperature: 9, currentdirection: 140, currentspeed: 3.1 },
	{ id: 2, name: "pos3", legspeedmin: 11, legspeedmax: 12, lon: 12.005518697218807, lat: 54.535904500233981, winddirection: 122, windspeed: 30, airtemperature: 9, currentdirection: 136, currentspeed: 3.4 },
	{ id: 3, name: "pos4", legspeedmin: 10, legspeedmax: 11, lon: 11.930997774565851, lat: 54.569907839824936, winddirection: 145, windspeed: 30, airtemperature: 9, currentdirection: 130, currentspeed: 3.8 },
	{ id: 4, name: "pos5", legspeedmin: 10, legspeedmax: 11, lon: 11.883514521671373, lat: 54.567784008455305, winddirection: 160, windspeed: 30, airtemperature: 9, currentdirection: 130, currentspeed: 3.6 }
	],
	sheduleElement: [
	{ waypointId: 0, eta: "2016-11-09T00:00:01.000Z" },
	{ waypointId: 1, eta: "2016-11-09T02:00:01.000Z" },
	{ waypointId: 2, eta: "2016-11-09T04:00:01.000Z" },
	{ waypointId: 3, eta: "2016-11-09T06:00:01.000Z" },
	{ waypointId: 4, eta: "2016-11-09T08:00:01.000Z" },
	],
	weatherdata: { //returned data from weather service
		ghostvessel: {}, //time projected weather on pos of ghostvessel
		vesselactual: {}, //current weather on GPS pos of ship or start pos on route if no GPS
		weatherWaypointsProjected: {}, //Each waypoint has a weather forecast
		weatherRouteLegsProjected: {}, //Each leg has a 10 step weather forecast, each an hour apart according to weather service provider.
		weatherAreaActual: {}, //entire route area has an actual wind map at zoom level covering the entire route on screen
		weatherAreaProjected: {}, //optional wind map projected along the route at zoom level covering approx 10nm radius. (data hungry, approx 100kb for a 10 point route at a 10x10 point resolution)
	}

}

//var RouteDotRadius = 20; //radius of route markers, determines size of all route dots.
var WOR = {};
WOR.RouteDotRadius = 20;
WOR.windowWidthAtInit = $(window).width();
WOR.windowWidthAfterResize = 0;
WOR.ShipIconPosition = 0; //position in percentage of the routebar - saved everytime icon is moved - repositioned everytime map and browser is scaled or moved to fit.
