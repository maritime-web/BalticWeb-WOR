

window.onload = function () { // GEOLOCATION & COMPASS

	//COMPASS - vesselactual rotation is handled by a timer
	if (window.DeviceOrientationEvent) {
		// Listen for the deviceorientation event and handle the raw data
		window.addEventListener('deviceorientation', function (eventData) {
			var compassdir;
			if (event.webkitCompassHeading) {
				compassdir = event.webkitCompassHeading;// Apple products
			}
			else compassdir = event.alpha;
			CompassHeadingActual = compassdir;
		});
	}
};

//GPS COORDINATE - handled by same timer as compass, just every 5 sec.
refreshGPSCoordinates = function () {
	var startPos;
	var geoOptions = {
		maximumAge: 5 * 60 * 1000, //timeout for request return
	}
	var geoSuccess = function (position) {
		//startPos = position;
		//var time = new Date();
		//time.setTime(time.getTime());
		GPSLocationActual = [position.coords.longitude, position.coords.latitude]
		console.log("GPSLocationActual:", GPSLocationActual);

	};
	var geoError = function (error) {
		console.log('Error occurred. Error code: ' + error.code);
		//   0: unknown error
		//   1: permission denied
		//   2: position unavailable (error response from location provider)
		//   3: timed out
	};
	navigator.geolocation.getCurrentPosition(geoSuccess, geoError, geoOptions);
}





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

//ENcode/Decode is used for comm with DMI for weather data - expects doublequotes
function URLencode(data) {
	data = data.replace(/'/g, '"');
	return encodeURIComponent(data)//.replace(/'/g, "%27").replace(/"/g, "%22");
}
function URLdecode(data) {
	return decodeURIComponent(data.replace(/\+/g, " "));
}





function refreshVesselActualPosition() {
	try {//rotate vesselactual according to compass
		//iconFeature.getGeometry().translate(deltaX, deltaY);
		//item.getGeometry().setCoordinates(modifiedCoordinate);

		//mapSource.getFeatureById("ROUTESHIPMARKER_vesselactual").getStyle().getImage().setRotation(degToRad(-(CompassHeadingActual + CompassHeadingOffset)));
		//mapSource.getFeatureById("COMPASS_vesselactual").getStyle().getImage().setRotation(degToRad(-(CompassHeadingActual + CompassHeadingOffset)));
		


		//mapSource.getFeatureById("ROUTESHIPMARKER_vesselactual").getGeometry().setCoordinates([10,50])
		//mapSource.getFeatureById("ROUTESHIPMARKER_vesselactual").getGeometry().setCoordinates(GPSLocationActual)
		//mapSource.getFeatureById("COMPASS_vesselactual").getGeometry().setCoordinates(GPSLocationActual)

		//mapSource.changed(); //update map
	} catch (ExceptionRotateVesselActualError) { console.log("move vesselactual failed");/*probably not yet added to map if GPS is disabled*/ }
	mapSource.getFeatureById("ROUTESHIPMARKER_vesselactual").setPosition(GPSLocationActual)
}






function calculateAndSaveDistanceBetweenRouteMarkers() { //saves distance between markers to handle zooming behaviour of route weathermarkers
	var distdebug = "";

	for (var i = 0; i != route.waypoints.length-1; i++) {

		var thiswaypoint = [route.waypoints[i].lon, route.waypoints[i].lat],
			nextwaypoint = [route.waypoints[i+1].lon, route.waypoints[i+1].lat];

		route.sheduleElement[i].nextwaypointdistance = getDistanceFromCoords(thiswaypoint, nextwaypoint);
		//distdebug += route.sheduleElement[i].nextwaypointdistance + ", ";
	}
	//console.log("distdebug:", distdebug);
}


//test route weathermarkers for overlapping on zoom, remove the lowest overlapping one in order from start to end
function cleanWeatherMarkersOverlapping() {
	function hideshowmarkerswithindistance(showhidedistance) {
		var totalDistance = 0;
		for (var i = 0; i != route.sheduleElement.length - 1; i++) {//loop through all waypoints, remove any that are closer than (distance)
			for (var y = i; y != route.sheduleElement.length - 1; y++) {
				totalDistance = parseFloat(route.sheduleElement[i].nextwaypointdistance) + parseFloat(route.sheduleElement[i + 1].nextwaypointdistance); //add up distances
				if (showhidedistance > totalDistance) {
					try { //remove the marker
						mapSource.removeFeature(mapSource.getFeatureById("routeweathermarker_" + (i) + "_wavemarker"));
						mapSource.removeFeature(mapSource.getFeatureById("routeweathermarker_" + (i) + "_currentmarker"));
						mapSource.removeFeature(mapSource.getFeatureById("routeweathermarker_" + (i) + "_windmarker"));
					} catch (ExceptionNoFeature) { }
					route.sheduleElement[i].zoomdisplay = mapZoomLevel; //save at which zoomlevel to show this marker again
				}
			}
			//add markers that are within acceptable distance again on zoom change
			if (route.sheduleElement[i].zoomdisplay > 0 && mapZoomLevel > (route.sheduleElement[i].zoomdisplay)) {
				updateRouteWORMFunction(i);
				//mapSource.addFeatures(generateWORM('ROUTEWEATHERMARKER', 'routeweathermarker_' + i, route.waypoints[i].lon, route.waypoints[i].lat, 0.7, 0, 0, 0, 0, 0, 0))
				route.sheduleElement[i].zoomdisplay = 0; //rest marker zoom behaviour
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
	if (tm && tm != "") return tm.toISOString().substring(0, tm.toISOString().length - 4) + "000+0000";
}







