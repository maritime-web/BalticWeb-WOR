//Handles communication with weather service provider



//Handles communication with weather service provider
getWeatherDataAsync = function (request, time, eta, latlon, lonlat2, datatypes, number) {
	//datatypes can be any combination of "'sealevel', 'current', 'wave', 'wind', 'density'".
	//lonlats are always as coordinates array.[xx.xx,xx.xx]


	//FTP_PROBLEM(404, 1000, "Unable to load upstream data from weather provider."),
	//DATA_NOT_LOADED(404, 1001, "Data is not available yet, please try again later."),
	//OUT_OF_DATE_RANGE(404, 1002, "No data in the requested range."),
	//NO_PARAMETERS(400, 1003, "You must specify at least one parameter (wind, wave, seaLevel, current, density) on the URL"),
	//INVALID_RTZ(400, 1004, "The provided RTZ is not valid."),
	//INVALID_SCALING(400, 1005, "Can't scale one axis up and another axis down"),

	//general user input errors
	//REQUEST_NOT_PARSED(400, 2005, "Could not parse request."),

	//general Grid errors
	//INVALID_GRID_LAT(400, 5001, "The south coordinate is larger than the north coordinate."),
	//INVALID_GRID_LOT(400, 5002, "The west coordinate is larger than the east coordinate."),
	//OUTSIDE_GRID(404, 5003, "The requested coordinates are outside the supported grid."),

	//UNCAUGHT_EXCEPTION(500, 10000, "Internal server error.")

	//Time format example: 2017-04-19T00:00:00z


	var req = {
		"parameters": {
			"wind": true, //returns in angle & m/sec
			"current": true, //returns in angle & m/sec
			"wave": true //returns in angle & height in metres
		},
		"northWest": {
			"lon": latlon[1],
			"lat": latlon[0]
		},
		"southEast": {
			"lon": latlon[1],
			"lat": latlon[0]
		},
		"time": time//"2017-04-19T14:10:00Z"
	}

	//passing datatypes needs handling
	if (datatypes) {
		//set to false
		req.parameters.wind = false;
		req.parameters.current = false;
		req.parameters.wave = false;
		//only set what is wanted
		if (datatypes.indexOf("wind") != -1) req.parameters.wind = true;
		if (datatypes.indexOf("current") != -1) req.parameters.current = true;
		if (datatypes.indexOf("wave") != -1) req.parameters.wave = true;
	}

	//area is needed
	if (lonlat2) {
		req.southEast.lon = lonlat2[0];
		req.southEast.lat = lonlat2[1];
	}



	//console.log("req", req);
	$.ajax({
		cache: false,
		type: "POST",
		crossDomain: true,
		url: "https://service-lb.e-navigation.net/weather/grid",
		data: JSON.stringify(req),
		dataType: "text",
		contentType: 'application/json',

		timeout: 10000, //error after timeout
		success: function (data) {
			try {
				data = JSON.parse(data);
				if (request == "windmap") console.log("data:", data);
				weatherDataCleaner(data, latlon, request, number); //expects a timer to deal with updating whatever needs updating - see "request".
			} catch (ExceptionDataParseError) {
				console.log("Returned data is not JSON!\ndata:", data);
			}
		},
		error: function (xhr, ajaxOptions, thrownError) {
			if (thrownError === 'timeout') {
				console.log('WEATHER SERVICE TIMEOUT!')
				weatherDataCleaner(data, latlon, request, number); //expects a timer to deal with updating whatever needs updating - see "request".
			} else {
				try {
					console.log(JSON.parse(xhr.responseText));
				} catch (ExceptionErrorFail) {
					console.log("Communication error with weather service:'", thrownError);
				}
			}
		},
	});
}

weatherDataCleaner = function (data, latlon, request, number) { //validates data and puts into route object
	var winddirection, windspeed, waveheight, wavedirection, currentdirection, currentspeed;

	//WIND
	try {
		winddirection = Math.round(data.points[0].windDirection * 10) / 10
		if (isNaN(winddirection)) winddirection = 0;
	} catch (ExceptionNoWindDirection) {
		winddirection = 0
	};
	try {
		windspeed = Math.round(data.points[0].windSpeed * 10) / 10
		if (isNaN(windspeed)) windspeed = 0;
	} catch (ExceptionNoWindSpeed) {
		windspeed = 0
	};

	//WAVE
	try {
		waveheight = Math.round(data.points[0].waveHeight * 10) / 10
		if (isNaN(waveheight)) waveheight = 0;
	} catch (ExceptionNoWaveHeight) {
		waveheight = 0
	};
	try {
		wavedirection = Math.round(data.points[0].waveDirection * 10) / 10;
		if (isNaN(wavedirection)) wavedirection = 0;
	} catch (ExceptionNoWaveHeight) {
		wavedirection = 0
	};

	//CURRENT
	try {
		currentdirection = Math.round(data.points[0].currentDirection * 10) / 10
		if (isNaN(currentdirection)) currentdirection = 0;
	} catch (ExceptionNoWaveHeight) {
		currentdirection = 0
	};
	try {
		currentspeed = Math.round(data.points[0].currentSpeed * 10) / 10
		if (isNaN(currentspeed)) currentspeed = 0;
	} catch (ExceptionNoWaveHeight) {
		currentspeed = 0
	};
	//put weather into route object - see "WOR_declarations.js"
	if (request == "ghostvessel") { //time projected vessel
		if (winddirection != null) route.weatherdata.ghostvessel.winddirection = winddirection;
		if (windspeed != null) route.weatherdata.ghostvessel.windspeed = windspeed;
		if (waveheight != null) route.weatherdata.ghostvessel.waveheight = waveheight;
		if (wavedirection != null) route.weatherdata.ghostvessel.wavedirection = wavedirection;
		if (currentdirection != null) route.weatherdata.ghostvessel.currentdirection = currentdirection;
		if (currentspeed != null) route.weatherdata.ghostvessel.currentspeed = currentspeed;
	} else if (request == "vesselactual") { //real vessel
		if (winddirection != null) route.weatherdata.vesselactual.winddirection = winddirection;
		if (windspeed != null) route.weatherdata.vesselactual.windspeed = windspeed;
		if (waveheight != null) route.weatherdata.vesselactual.waveheight = waveheight;
		if (wavedirection != null) route.weatherdata.vesselactual.wavedirection = wavedirection;
		if (currentdirection != null) route.weatherdata.vesselactual.currentdirection = currentdirection;
		if (currentspeed != null) route.weatherdata.vesselactual.currentspeed = currentspeed;
	} else if (request == "clickmarker") { //clicked location on map
		if (winddirection != null) route.weatherdata.clickmarker.winddirection = winddirection;
		if (windspeed != null) route.weatherdata.clickmarker.windspeed = windspeed;
		if (waveheight != null) route.weatherdata.clickmarker.waveheight = waveheight;
		if (wavedirection != null) route.weatherdata.clickmarker.wavedirection = wavedirection;
		if (currentdirection != null) route.weatherdata.clickmarker.currentdirection = currentdirection;
		if (currentspeed != null) route.weatherdata.clickmarker.currentspeed = currentspeed;
	} else if (request == "routemarker") { //along the route on map - using "number"
		if (winddirection != null) route.scheduleElement[number].winddirection = winddirection;
		if (windspeed != null) route.scheduleElement[number].windspeed = windspeed;
		if (waveheight != null) route.scheduleElement[number].waveheight = waveheight;
		if (wavedirection != null) route.scheduleElement[number].wavedirection = wavedirection;
		if (currentdirection != null) route.scheduleElement[number].currentdirection = currentdirection;
		if (currentspeed != null) route.scheduleElement[number].currentspeed = currentspeed;
		updateRouteWORMFunction(number); //adds a weathermarker to the map
	}
	weatherFetchComplete = true;
}
