

// convert degrees to radians
function degToRad(deg) {
	return deg * Math.PI * 2 / 360;
}


// convert radians to degrees
function radToDeg(rad) {
	return rad * 360 / (Math.PI * 2);
}

function getRandomInt(min, max) {
	min = Math.ceil(min);
	max = Math.floor(max);
	return Math.floor(Math.random() * (max - min)) + min;
}

function calcSinCosFromAngle(xy, angle, radius) { //requires ('x' or 'y'), angle in degrees and radius in px.
	var SinCos;
	if (xy == 'x') SinCos = radius * Math.cos(angle); // Calculate the x position of the element.
	if (xy == 'y') SinCos = radius * Math.sin(angle); // Calculate the y position of the element.
	return SinCos;
}

function getAngleFromPoints(cx, cy, ex, ey) { //returns the angle of a line fom 2 points xy - xy -> careful if using negative numbers. This is for the Baltic, which is in positive.
	var dy = ey - cy;
	var dx = ex - cx;
	var theta = Math.atan2(dy, dx); // range (-PI, PI]
	theta *= 180 / Math.PI; // rads to degs, range (-180, 180]
	//if (theta < 0) theta = 360 + theta; // range [0, 360)
	return theta;
}

var getDistanceFromCoords = function (lonlat1, lonlat2) { //returns distance in nautical miles between 2 points. format: lonlatX=[xx.xx,xx.xx]
	var wgs84Sphere = new ol.Sphere(6378137); //define spherical math layout
	var length;
	var coordinates = []; coordinates.push(lonlat1); coordinates.push(lonlat2);
	length = 0;
	var sourceProj = map.getView().getProjection();
	for (var i = 0, ii = coordinates.length - 1; i < ii; ++i) {
		var c1 = ol.proj.transform(coordinates[i], sourceProj, 'EPSG:3857');
		var c2 = ol.proj.transform(coordinates[i + 1], sourceProj, 'EPSG:3857');
		length += wgs84Sphere.haversineDistance(c1, c2);
	}
	var output = length * 0.539956803;
	output = (Math.round(output / 1000 * 100) / 100)
	return output;
};


function calculateAndSaveDistanceBetweenRouteMarkers() { //saves distance between markers to handle zooming behaviour of route weathermarkers
	var distdebug = "";

	for (var i = 0; i != route.waypoints.length-1; i++) {

		var thiswaypoint = [route.waypoints[i].lon, route.waypoints[i].lat],
			nextwaypoint = [route.waypoints[i+1].lon, route.waypoints[i+1].lat];

		route.scheduleElement[i].nextwaypointdistance = getDistanceFromCoords(thiswaypoint, nextwaypoint);
	}
}


function updateRouteWORMFunction(routemarkernumber) { //create route weather marker when data is available.

	var winddirection = route.scheduleElement[routemarkernumber].winddirection;
	var windspeed = route.scheduleElement[routemarkernumber].windspeed;
	var currentdirection = route.scheduleElement[routemarkernumber].currentdirection;
	var currentspeed = route.scheduleElement[routemarkernumber].currentspeed;
	var wavedirection = route.scheduleElement[routemarkernumber].wavedirection;
	var waveheight = route.scheduleElement[routemarkernumber].waveheight;

	var timehours = (route.scheduleElement[routemarkernumber].eta.split("T")[1]).split(".")[0]; //get hours & minutes from 2017-04-19T11:00:01.000Z
	timehours = timehours.substring(0,timehours.length-3);

	var markertext = retDayFromRTZ(route.scheduleElement[routemarkernumber].eta) + "\n" + timehours + " UTC";
	if (!control_displaymarkertext) markertext = "";
	//adds a new clickmarker with updated info
	mapSource.addFeatures(generateWORM('ROUTEWEATHERMARKER', 'routeweathermarker_' + routemarkernumber, route.waypoints[routemarkernumber].lon, route.waypoints[routemarkernumber].lat, control_scale, winddirection, windspeed, currentdirection, currentspeed, wavedirection, waveheight, markertext));
	
}



//test route weathermarkers for overlapping on zoom, remove the lowest overlapping one in order from start to end
function cleanWeatherMarkersOverlapping() {
	function hideshowmarkerswithindistance(showhidedistance) {
		var totalDistance = 0;
		for (var i = 0; i != route.scheduleElement.length - 1; i++) {//loop through all waypoints, remove any that are closer than (distance)
			for (var y = i; y != route.scheduleElement.length - 1; y++) {
				totalDistance = parseFloat(route.scheduleElement[i].nextwaypointdistance) + parseFloat(route.scheduleElement[i + 1].nextwaypointdistance); //add up distances
				if (showhidedistance > totalDistance) {
					try { //remove the marker
						mapSource.removeFeature(mapSource.getFeatureById("routeweathermarker_" + (i) + "_wavemarker"));
						mapSource.removeFeature(mapSource.getFeatureById("routeweathermarker_" + (i) + "_currentmarker"));
						mapSource.removeFeature(mapSource.getFeatureById("routeweathermarker_" + (i) + "_windmarker"));
					} catch (ExceptionNoFeature) { }
					route.scheduleElement[i].zoomdisplay = mapZoomLevel; //save at which zoomlevel to show this marker again
				}
			}
			//add markers that are within acceptable distance again on zoom change
			if (route.scheduleElement[i].zoomdisplay > 0 && mapZoomLevel > (route.scheduleElement[i].zoomdisplay)) {
				updateRouteWORMFunction(i);
				route.scheduleElement[i].zoomdisplay = 0; //reset marker zoom behaviour
			}
		}
	}
	var showhidedistance = 0;
	switch (mapZoomLevel) {

		case 11:
			showhidedistance = 0.9;
			break;
		case 10:
			showhidedistance = 1.8;
			break;
		case 9:
			showhidedistance = 3.5;
			break;
		case 8:
			showhidedistance = 6;
			break;
		case 7:
			showhidedistance = 11;
			break;
		case 6:
			showhidedistance = 22;
			break;
		case 5:
			showhidedistance = 33;
			break;
		case 4:
			showhidedistance = 66;
			break;
	}
	hideshowmarkerswithindistance(showhidedistance);
}



function rendertimeformat(tm) {
	if (tm && tm != "") return tm.toISOString().substring(0, tm.toISOString().length - 4) + "00Z";
}

function retDayFromRTZ(tm) { //returns which day it is from a timestamp
	var days,
		tm = tm.split("T")[0],
		tmnew = new Date(tm);
	days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
	return days[tmnew.getUTCDay()];
}






