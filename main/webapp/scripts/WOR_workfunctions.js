

window.onload = function () { // GEOLOCATION & COMPASS

	//COMPASS
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
			//rotateMapVesselIcon('vesselactual', CompassHeadingActual);
	}



	var startPos;
	var geoOptions = {
		maximumAge: 5 * 60 * 1000, //timeout for request return
	}
	var geoSuccess = function (position) {
		startPos = position;
		var time = new Date();
		time.setTime(time.getTime());
		console.log("Current location:", startPos.coords.latitude, ",", startPos.coords.longitude);
		GPSLocationActual = [startPos.coords.latitude, startPos.coords.longitude]
		//getWeatherDataAsync('vesselactual', time, null, GPSLocationActual); //get current location weather right now.

		vesselactualMarker = generateShip('vesselactual', GPSLocationActual[1], GPSLocationActual[0], 1);
		mapSource.addFeatures(vesselactualMarker);

		mapSource.addFeatures(generateVesselWORM('vesselactualWORM', 'vesselactual', GPSLocationActual[1], GPSLocationActual[0], 1, route.weatherdata.ghostvessel.wid, route.weatherdata.ghostvessel.wis, route.weatherdata.ghostvessel.cud, route.weatherdata.ghostvessel.cus, route.weatherdata.ghostvessel.wad, route.weatherdata.ghostvessel.wah));

		rotateWeatherIndicators(); //rotates all weather indicators to align correctly with text - also called on map move/change
	};
	var geoError = function (error) {
		console.log('Error occurred. Error code: ' + error.code);
		//   0: unknown error
		//   1: permission denied
		//   2: position unavailable (error response from location provider)
		//   3: timed out
	};
	navigator.geolocation.getCurrentPosition(geoSuccess, geoError, geoOptions);

};





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