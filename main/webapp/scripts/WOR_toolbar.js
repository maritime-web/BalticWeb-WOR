
//move this before release - also cleanup and prepare content plz.
WORToolbarControl = function (opt_options) {
	var options = opt_options || {};

	//menu button
	var button1 = document.createElement('button'); //TODO - put this in a container div with float right and auto resize the button to scale right
	button1.innerHTML = '&#9776;';
	button1.id = 'routecontrols_button1';
	button1.className = 'ol-WORBarOptionsButton';

	var this_ = this;
	var button1Func = function (e) { //TODO - change name of this function
		WORSetShipIconPosition();
		console.log("direction:", WORDetectRouteDirection());
	};
	button1.addEventListener('click', button1Func, false);
	button1.addEventListener('touchstart', button1Func, false);

	//route container
	var routecontainer = document.createElement('div');
	routecontainer.id = 'WORroutecontainer';
	routecontainer.className = 'ol-unselectable ol-WORBarRouteMainContainer';

	//WOR bar container
	var element = document.createElement('div');
	element.className = 'ol-unselectable ol-WORBarMenuContainer';
	element.id = 'WORBarMenuContainer';

	//Appending to WOR bar
	element.appendChild(button1);
	element.appendChild(routecontainer);

	ol.control.Control.call(this, {
		element: element,
		target: options.target
	});
};
ol.inherits(WORToolbarControl, ol.control.Control);





WORSaveShipIconPosition = function () { //get and save the dragged position on the routebar in percentage - set after drag.
	var offsetdiff = $('#WORRouteStartDot').offset().left - $('#WORRouteEndDot').offset().left;
	var leftMD = 0; rightMD = 0, shipPos = 0;
	if ($('#WORRouteStartDot').offset().left < $('#WORRouteEndDot').offset().left) {
		offsetdiff = (offsetdiff * -1) + 6; //make it positive and add the adjustment pixels
		leftMD = $('#WORRouteStartDot').offset().left - 3;
		rightMD = $('#WORRouteEndDot').offset().left;
		shipPos = $('#WORBarShipIconContainer').offset().left + 24; //adjustment pixels
	} else {
		leftMD = $('#WORRouteEndDot').offset().left;
		rightMD = $('#WORRouteStartDot').offset().left - 3;
		shipPos = $('#WORBarShipIconContainer').offset().left + 24; //adjustment pixels
	}
	WOR.ShipIconPosition = (100 / offsetdiff) * (shipPos - leftMD);
	//console.log("WOR.ShipIconPosition:",WOR.ShipIconPosition);
}

WORSetShipIconPosition = function (position) { //sets the ship icon on the routebar in percentage, relative to left/right with correct scaling - set AFTER scale/move of map.
	var offsetdiff = $('#WORRouteStartDot').offset().left - $('#WORRouteEndDot').offset().left;
	var leftMD = 0; rightMD = 0, shipPos = 0;
	//if ($('#WORRouteStartDot').offset().left < $('#WORRouteEndDot').offset().left) {
	//	offsetdiff = (offsetdiff * -1) + 6; //make it positive and add the adjustment pixels
	//	leftMD = $('#WORRouteStartDot').offset().left - 3;
	//	rightMD = $('#WORRouteEndDot').offset().left;
	//	shipPos = $('#WORBarShipIconContainer').offset().left + 24; //adjustment pixels
	//} else {
	//	leftMD = $('#WORRouteEndDot').offset().left;
	//	rightMD = $('#WORRouteStartDot').offset().left - 3;
	//	shipPos = $('#WORBarShipIconContainer').offset().left + 24; //adjustment pixels
	//}
	//WOR.startDotOffset is
	alert("here");
	console.log("offsetdiff:", offsetdiff)
	$('#WORBarShipIconContainer').animate({
		left: "-=150",
	}, 500, function () {
		// Animation complete.
	});
	//$('#WORBarShipIconContainer').offset()
	//WOR.ShipIconPosition = (100 / offsetdiff) * (shipPos - leftMD);
	//console.log("WOR.ShipIconPosition:",WOR.ShipIconPosition);
}





//generates and appends the actual route item in the WOR bar.
//Inits and sets dragging.
//Inits and sets resize control of menu and dragicon
//points is array, direction is 'left'(to right) or 'right'(to left), pending on course direction. Value is in nautical miles.
//startpoint is green, endpoint is red, all others are black dots with grey ring
WORRouteControl = function (points, direction) {
	var totallength = 0;
	var legRatioArr = [];
	for (var i = 0; i != points.length; i++) { totallength += points[i]; } //total length - use as reference for percentage of totallength
	var compoundOfRatio = 0; //startpos from left in percent
	var decompoundOfRatio = 100; //startpos from right in percent
	var height = 12;
	var html = "";
	//add the lines


	for (var i = 0; i != points.length; i++) {
		var tmpcolor = "rgba(0,200,0,1)"; //Todo: change line colour according to weather warnings of those legs.
		legRatioArr[i] = Math.round(((100 / totallength) * points[i])); //calc ratios of leg distances to place in dots UI
		var left = 0;
		direction == 'right' ? left = decompoundOfRatio - legRatioArr[i] : left = compoundOfRatio
		//First line in route
		if (i == 0) {
			html += "<div class='roundedbar' style='position:absolute;width:" + legRatioArr[i] + "%;top:30%;left:" + left + "%;height:" + (height * 0.4) + "px;background:" + tmpcolor + "'>&nbsp;</div>"
		} else {
			html += "<div class='roundedbar' style='position:absolute;width:" + legRatioArr[i] + "%;top:30%;left:" + left + "%;height:" + (height * 0.4) + "px;background:" + tmpcolor + "'>&nbsp;</div>"
		}
		decompoundOfRatio -= legRatioArr[i];
		compoundOfRatio += legRatioArr[i]; //update ratio for the next leg starting point in % of available space.

	}

	compoundOfRatio = 0; //reset startpos
	decompoundOfRatio = 100; //reset endpos
	var startdotleft = compoundOfRatio;
	if (direction == 'right') {
		startdotleft = decompoundOfRatio;
	}

	var htmlstartdot = "<div id='WORRouteStartDot' class='round' style=\"position:absolute;top:" + (6 - (height * 0.5)) + "px;left:" + startdotleft + "%;width:" + height + "px;height:" + height + "px;border:1px solid rgba(100,100,100,1);border-radius:" + (height * 0.5) + "px;background:rgba(0,230,0,1)\">&nbsp;</div>";
	for (var i = 0; i != points.length; i++) {
		var left = 0;
		if (direction == 'right') {
			left = decompoundOfRatio - legRatioArr[i]
			if (i == points.length - 1) { //overrule if is enddot
				left = 0;
			}
		} else {
			left = (legRatioArr[i] + compoundOfRatio)
		}
		//add the dots
		if (i != points.length - 1) {
			html += "<div class='round' id='WORRouteDot_" + i + "' style=\"position:absolute;top:20%;left:" + left + "%;width:" + (height * 0.6) + "px;height:" + (height * 0.6) + "px;border-radius:" + (height * 0.5) + "px;background:rgba(100,100,100,1)\">&nbsp;</div>"
		} else {
			html += "<div id='WORRouteEndDot' class='round' style=\"position:absolute;top:0%;left:" + left + "%;width:" + height + "px;height:" + height + "px;border:1px solid rgba(100,100,100,1);border-radius:" + (height * 0.5) + "px;background:rgba(230,0,0,1\">&nbsp;</div>"
		}
		decompoundOfRatio -= legRatioArr[i];
		compoundOfRatio += legRatioArr[i]; //update ratio for the next leg starting point in % of available space.




	}
	html += htmlstartdot; //force the startdot as first to ensure it is on top


	//container
	var element = document.createElement('div');
	element.innerHTML = html;
	element.className = 'ol-unselectable ol-WORBarRoute';
	element.id = "WORBarRouteMainContainer";

	var shipElement = document.createElement('div');
	shipElement.id = "WORBarShipIconContainer";
	var directionclass = "";
	if (direction == 'right') {//flip the ship icon if reversed direction
		directionclass = 'ol-WORBarShipIconRight';
	} else {
		directionclass = 'ol-WORBarShipIconLeft';
	}
	shipElement.className = 'ol-unselectable ol-WORBarShipIconContainer WORdraggable ' + directionclass;
	shipElement.innerHTML = "<div id='WORBarShipIconCircle' class='ol-WORBarShipIconCircle round'>&nbsp;</div>"; //cant be empty

	//Append to element, then to WOR bar
	element.appendChild(shipElement);
	$('#WORroutecontainer').append($(element));



	//Set dragging options and drag controls
	var tmpoffset = $('#WORRouteStartDot').offset();
	$(".ol-WORBarShipIconContainer").offset({ top: (tmpoffset.top - 20), left: (tmpoffset.left - 30 + 6) });
	var $draggable = $('.draggable').draggabilly({ /*init dragging There is an angular directive for this: https://github.com/Jimdo/angular-draggabilly */ });
	var draggable = $('.WORdraggable').draggabilly({
		axis: 'x',
		grid: [3, 3],
	});

	//stops dragging from out of bounds
	WORShipIconDragContain = function () {//prevent shipicon to move beyond startdot/enddot
		var tmpstartoff = $('#WORRouteStartDot').offset();
		var tmpendoff = $('#WORRouteEndDot').offset();
		var tmpshipiconoff = $('.ol-WORBarShipIconContainer').offset();

		if (tmpstartoff.left > tmpendoff.left) { //right to left
			if ((tmpshipiconoff.left + 30 - 6) > tmpstartoff.left) {
				$(".ol-WORBarShipIconContainer").offset({ top: (tmpstartoff.top - 20), left: (tmpstartoff.left - 30 + 6) })
			} else if ((tmpshipiconoff.left + 30 - 6) < tmpendoff.left) {
				$(".ol-WORBarShipIconContainer").offset({ top: (tmpendoff.top - 20), left: (tmpendoff.left - 30 + 6) })
			}
		} else { //left to right
			if ((tmpshipiconoff.left + 30 - 6) < tmpstartoff.left) {
				$(".ol-WORBarShipIconContainer").offset({ top: (tmpstartoff.top - 20), left: (tmpstartoff.left - 30 + 6) })
			} else if ((tmpshipiconoff.left + 30 - 6) > tmpendoff.left) {
				$(".ol-WORBarShipIconContainer").offset({ top: (tmpendoff.top - 20), left: (tmpendoff.left - 30 + 6) })
			}
		}
	}
	draggable.on('dragStart', function (event, pointer) {
		if (event.target.id == "") {
			console.log($('#' + event.target.id).offset())
			//console.log(event.target.offset)
		}
	});
	draggable.on('dragEnd', function (event, pointer) {
		if (event.target.id == "WORBarShipIconContainer") {
			WORShipIconDragContain();
			WORSaveShipIconPosition(); //set WOR.ShipIconPosition with percentage position of ship icon on bar
		}
	});
	draggable.on('dragMove', function (event, pointer, moveVector) {
		if (event.target.id == "WORBarShipIconContainer") {
			WORShipIconDragContain();
		}
	})
	WOR.startDotOffset = $('#WORRouteStartDot').offset();
	WOR.endDotOffset = $('#WORRouteEndDot').offset();

	WORResizeEventFunction = function () {
		//scaling window moves the absolute pos of the shipicon. Calc relative distance of entire routebar, then place shipicon at correct relative position at every move.
		var tmpPreviousWindowSize = 0;
		WOR.startDotOffset = $('#WORRouteStartDot').offset();
		WOR.endDotOffset = $('#WORRouteEndDot').offset();
		//Keeps shipicon from passing left side container
		var tmpshipiconoffset = $('.ol-WORBarShipIconContainer').offset();
		if ((tmpshipiconoffset.left + 30 - 6) < WOR.startDotOffset.left) {
			$(".ol-WORBarShipIconContainer").offset({ top: (WOR.startDotOffset.top - 20), left: (WOR.startDotOffset.left - 30 + 6) })
		}
		if ((tmpshipiconoffset.left + 30 - 6) > WOR.endDotOffset.left) {
			$(".ol-WORBarShipIconContainer").offset({ top: (WOR.endDotOffset.top - 20), left: (WOR.endDotOffset.left - 30 + 6) })
		}

		//console.log($(window).width());

	}
	var WORWindowResizeEventEnd;
	$(window).resize(function () {
		WORResizeEventFunction();
	});


	//try {
	//After moving or scaling the map, put the shipicon back to the correct position on the bar
	var offsetdiff = $('#WORRouteStartDot').offset().left - $('#WORRouteEndDot').offset().left;
	//console.log("WORRouteStartDot", $('#WORRouteStartDot').offset().left);
	//console.log("WORRouteEndDot", $('#WORRouteEndDot').offset().left);
	var leftMD = 0; rightMD = 0, shipPos = 0;
	if ($('#WORRouteStartDot').offset().left < $('#WORRouteEndDot').offset().left) {
		offsetdiff = (offsetdiff * -1) + 6; //make it positive and add the adjustment pixels
		leftMD = $('#WORRouteStartDot').offset().left - 3;
		rightMD = $('#WORRouteEndDot').offset().left;
		shipPos = $('#WORBarShipIconContainer').offset().left + 24; //adjustment pixels
	} else {
		leftMD = $('#WORRouteEndDot').offset().left;
		rightMD = $('#WORRouteStartDot').offset().left - 3;
		shipPos = $('#WORBarShipIconContainer').offset().left + 24; //adjustment pixels
	}
	//console.log("leftMD:", leftMD);
	//console.log("rightMD:", rightMD);
	//console.log("diff:", offsetdiff);
	//console.log("shipPospx:", shipPos - leftMD, " -> ", 100 / offsetdiff);
	//console.log("shipPos%:", (100 / offsetdiff) * (shipPos - leftMD));
	//console.log("WOR.ShipIconPosition:", WOR.ShipIconPosition);
	//WOR.ShipIconPosition = (100 / offsetdiff) * (shipPos - leftMD);

	//} catch (mapnotloadedyeterror) { }


}
