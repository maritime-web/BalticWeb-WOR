//Handles communication with weather service provider





getWeatherDataAsync = function (request, time, eta, lonlat, lonlat2, datatypes) {
	function rendertimeformat(tm) {
		if (tm && tm != "") return tm.toISOString().substring(0, tm.toISOString().length - 4) + "000+0000";
	}


	//request can be: point, line, area.
	//datatypes can be any combination of "'sealevel', 'current', 'wave', 'wind', 'density'".
	//lonlats are always as coordinates array.[xx.xx,xx.xx]
	var mssi = 999999999; // weather service provider knows what this is.
	var requesttype = "&request=" + request;
	var data = "&datatypes="; //data=datatypes, sealevel, current, wave, wind, density. (sealevel is tide height +-, density is salinity index. WOR only uses current, wave, wind. Must be separated by escaped single quotation"\'"
	var dt = "&dt=20"; //Can be from 20 to ca. 1500, returns how many prognosis points there are, number seems to be area (radius) in metres. Lower than 20 can return nothing.
	var wp = "&wp=" + lonlat; //waypoints. Has to have at least 2, can be just 10 metres apart for single point.
	var wp2 = "&wp2="; //second waypoint. Used only for line and area.
	var tnow = "&time=";
	var teta = "&eta="; //is only used with line, but still needed with points and areas because weather service requires a time window
	var retsuccess = false;
	var retdata;

	if (request == "point" || request == "ghostvessel" || request == "vesselactual") { //an area consists of many points, handled in backend
		tnow += rendertimeformat(time);
		var now = new Date();
		now.setTime(now.getTime() + (1000*60*10)); //add 10 minutes to satisfy weather service requirements
		teta += rendertimeformat(now);
		wp2 += lonlat[0] + 0.0001 + "," + lonlat[1]; //add a few metres to the coords to satisfy requirements
	} else if (request == "line") {
		if (!eta || eta == "") {
			console.log("Line was used but no eta was defined. Please add an ETA.");
			return;
		} else {
			tnow += rendertimeformat(time);
			teta += rendertimeformat(eta);
		}
	}

	var req = "?mssi=" + mssi;
	req += requesttype; //
	(!datatypes || datatypes == "") ? req += data + "\'sealevel\',\'density\',\'current\',\'wave\',\'wind\'" : req += data + datatypes; //types of weather data requested. Can be manually set. Used for area if wind only is needed.
	req += dt;  //resolution always lowest for single points
	req += wp; //position as point
	req += wp2; //
	req += tnow.replace("+", "%2B"); //time at now - plus sign is regarded as space, will have issues when encoding if not encoded now.
	req += teta.replace("+", "%2B"); //time at ETA
	console.log("req:",req);

	$.ajax({
		cache: false,
		type: "POST",
		crossDomain: true,
		url: "https://beeres.dk/wor/worservice/handler.ashx",
		data: req,
		dataType: "text",
		crossDomain: true,
		timeout: 10000, //error after timeout
		success: function (data) {
			try {
				data = JSON.parse(data);
				console.log("request:", request, "data:", data);
				//console.log("request:", request, "current data:", data.metocForecast.forecasts[0]["current-dir"].forecast);
			} catch (ExceptionDataParseError) {
				console.log("Returned data is not JSON!\ndata:", data);
			}
			if (data.error == 9) {
				console.log("Communication error with weather service:", data.errorMsg, " - Probably a bad request.");
				console.log(data);
			} else if (data.error == 0) {
				weatherDataCleaner(data, lonlat, request); //expects a timer to deal with updating whatever needs updating - see "request".
			}
		},
		error: function (xhr, ajaxOptions, thrownError) {
			if (thrownError === 'timeout') {
				console.log('WEATHER SERVICE TIMEOUT!')
			} else {
				console.log("Communication error with weather service:'", thrownError, "' - Probably due to no 'Access-Control-Allow-Origin' in header of resource.\nPlease use Chrome plugin: https://chrome.google.com/webstore/detail/allow-control-allow-origi/nlfbmbojpeacfghkpbjhddihlkkiljbi/related?hl=en-US - Rob - the developer.");
			}
		},
	});

}




weatherDataCleaner = function (data, GPSLocation, request) { //type: point, leg, area
	var winddirection, windspeed, waveheight, wavedirection, currentdirection, currentspeed;

	//WIND
	try {
		winddirection = Math.round(data.metocForecast.forecasts[0]["wind-dir"].forecast * 10) / 10
	} catch (ExceptionNoWindDirection) {
		winddirection = 0
	};
	try {
		windspeed = Math.round(data.metocForecast.forecasts[0]["wind-speed"].forecast * 10) / 10
	} catch (ExceptionNoWindSpeed) {
		windspeed = 0
	};

	//WAVE
	try {
		waveheight = Math.round(data.metocForecast.forecasts[0]["wave-height"].forecast * 10) / 10
	} catch (ExceptionNoWaveHeight) {
		waveheight = 0
	};
	try {
		wavedirection = Math.round(data.metocForecast.forecasts[0]["wave-dir"].forecast * 10) / 10
	} catch (ExceptionNoWaveHeight) {
		wavedirection = 0
	};

	//CURRENT
	try {
		currentdirection = Math.round(data.metocForecast.forecasts[0]["current-dir"].forecast * 10) / 10
	} catch (ExceptionNoWaveHeight) {
		currentdirection = 0
	};
	try {
		currentspeed = Math.round(data.metocForecast.forecasts[0]["current-speed"].forecast * 10) / 10
	} catch (ExceptionNoWaveHeight) {
		currentspeed = 0
	};



	//put weather into route object - in "WOR_declarations.js"
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
	}
	weatherFetchComplete = true;
	rotateWeatherIndicators();
	try {
	} catch (ExceptionNoData) { }
}