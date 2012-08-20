$("document").ready(function() {

	// Cloudmade tiles
	var cloudmadeUrl = 'http://{s}.tile.cloudmade.com/903a54a369114f6580f12400d931ece6/997/256/{z}/{x}/{y}.png';
	var cloudmadeAttrib = 'Map data &copy; 2012 OpenStreetMap contributors, Imagery &copy; 2012 CloudMade';
	var cloudmade = new L.TileLayer(cloudmadeUrl, {maxZoom: 19, attribution: cloudmadeAttrib});
	// Mapbox Light tiles
	var mapboxUrl = 'http://a.tiles.mapbox.com/v1/mapbox.mapbox-light/{z}/{x}/{y}.png';
	var mapboxAttrib = 'Map data &copy; 2012 OpenStreetMap contributors, Imagery &copy; 2012 CloudMade';
	var	mapbox = new L.TileLayer(mapboxUrl, {maxZoom: 17, attribution: mapboxAttrib, tms: true});
	// Mapbox Streets tiles
	var mapboxStUrl = 'http://a.tiles.mapbox.com/v1/mapbox.mapbox-streets/{z}/{x}/{y}.png';
	var	mapboxSt = new L.TileLayer(mapboxStUrl, {maxZoom: 19, attribution: mapboxAttrib, tms: true});
	// Mapbox Graphite
	var mapboxGrpUrl = 'http://a.tiles.mapbox.com/v1/mapbox.mapbox-graphite/{z}/{x}/{y}.png';
	var	mapboxGrp = new L.TileLayer(mapboxGrpUrl, {maxZoom: 19, attribution: mapboxAttrib, tms: true});

	// 2006 aerial photo tiles
	var metro06URL = 'http://gis.wicomicocounty.org/metro2006/{z}/{x}/{y}.png';
	var metro06 = new L.TileLayer(metro06URL, {maxZoom: 19, attribution: mapboxAttrib, tms: true, opacity: 1});
	// 2008 aerial photo tiles
	var metro08URL = 'http://gis.wicomicocounty.org/metro2008/{z}/{x}/{y}.png';
	var metro08 = new L.TileLayer(metro08URL, {maxZoom: 19, attribution: mapboxAttrib, tms: true, opacity: 1});
	// 2010 aerial photo tiles
	var metro10URL = 'http://gis.wicomicocounty.org/metro2010/{z}/{x}/{y}.png';
	var metro10 = new L.TileLayer(metro10URL, {maxZoom: 19, attribution: mapboxAttrib, tms: true, opacity: 1});

	// CartoDB building footprint tiles
	var	bldgTileURL = 'http://nickchamberlain.cartodb.com/tiles/buildings/{z}/{x}/{y}.png';
	var bldgTiles = new L.TileLayer(bldgTileURL);
	// CartoDB building footprint tiles
	var	quadTileURL = 'http://nickchamberlain.cartodb.com/tiles/cityquads/{z}/{x}/{y}.png';
	var quadTiles = new L.TileLayer(quadTileURL);

	// Marker/Overlay tile groups used later
	var markerGroup = new L.LayerGroup();
	var overlayGroup = new L.LayerGroup();

	// Create map
	var	salisbury = new L.LatLng(38.3672, -75.5748);
	var map = new L.Map('map', {
			center: salisbury,
			layers: [mapboxGrp],
			attributionControl: false
		});

	var baseMaps = {
		"Mapbox Graphite": mapboxGrp,
		"Mapbox Light": mapbox,
		"2006 Aerials": metro06,
		"2008 Aerials": metro08,
		"2010 Aerials": metro10
	};

	// Add layer picker
	var layersControl = new L.Control.Layers(baseMaps);
	map.addControl(layersControl);

	// move attribution to left side
	var attribOverride = new L.Control.Attribution({position: 'bottomleft'}).addTo(map);

	map.on('zoomend', function(e) {
		var zoom = map.getZoom();
		if (zoom > 17) {
			map.removeLayer(mapboxGrp);
			map.addLayer(metro10);
		} if (zoom <= 17) {
			map.removeLayer(metro10);
			map.addLayer(mapboxGrp);
		}

	});

	// Refresh map
	function refreshMap () {
		map.setView(salisbury, 13);
		markerGroup.clearLayers();
		overlayGroup.clearLayers();
	}//resets map zoom and center, clears all markers
	refreshMap();

$("form").submit(function(event) {
	event.preventDefault();
	if ($("#street").val() !== "") {
		//refreshMap();
		markerGroup.clearLayers();
		overlayGroup.clearLayers();
		var street = $("#street").val();
		var zip = $("#zip").val();
		var geocode_url = 'http://mdimap.towson.edu/ArcGIS/rest/services/GeocodeServices/MD.State.MDStatewideLocator_LatLong/GeocodeServer/findAddressCandidates?Street=' + street + '&Zone=' + zip + '&outFields=&f=json&callback=?';
		var xhr = $.getJSON(geocode_url, function (data) {
			if (data.candidates[0]) {
				var x = data.candidates[0].location.x;
				var y = data.candidates[0].location.y;
				var loc = new L.LatLng(y,x);
				var locMarker = new L.Marker(loc, {draggable: true});
					markerGroup.addLayer(locMarker);
					// map.addLayer(markerGroup);
					map.setView(loc,16);
				// listeners for .distance range input and dragging the marker
				locMarker.on('drag', function(e) {
					mrkLatLng = locMarker.getLatLng();
					loc = new L.LatLng(mrkLatLng.lat, mrkLatLng.lng);
					overlayGroup.clearLayers();
				});
			} else {
				refreshMap();
				$('#street').val('Address Invalid');
			}//test address and geocode it if a location is returned by the iMap service
		}).error(function() {refreshMap();}); //get geocoding JSON
	} else {
		refreshMap();
	}//if something is in #street field, do geocoding else reset the map
});//geocode address on submit

(function getBldgJSON() {
	map.on('click', onMapClick);
	function onMapClick(e) {
		var latlngStr = 'ST_Point(' + e.latlng.lng + ',' + e.latlng.lat + ')';
		var bldgQryURL = 'http://nickchamberlain.cartodb.com/api/v1/sql/?q=SELECT bldg_type FROM buildings WHERE ST_Contains(buildings.the_geom,ST_SetSRID(' + latlngStr + ',4326))&format=json&callback=?';
		$.getJSON(bldgQryURL, function(data) {
			var items = [];
			if ($.type(data.rows[0]) !== "undefined") {
				//console.log(data.rows[0]);
				$.each(data.rows[0], function(key, val) {
						items.push('<li id="' + key + '"><strong>' + key + '</strong>: ' + val + '</li>');
				});
				var popupHTML = $('<ul/>', {
					'id': 'my-new-list',
					html: items.join('')
				});//.appendTo(popupHTML);
				//console.log(popupHTML)
				//console.log(e.latlng);
				$.each(popupHTML, function(index) {
					console.log(popupHTML.text());
				});
				var popup = new L.Popup();
					popup.setLatLng(e.latlng);
					popup.setContent(popupHTML.html());
				map.openPopup(popup);
			}//if the user clicks a feature make the popup
		});//populates popup with cartodb JSON
	}
})();

(function getSvcJSON() {
	var svcQryUrl = 'https://nickchamberlain.cartodb.com/api/v1/sql/?format=geojson&q=SELECT%20id,%20problemcod,%20the_geom%20FROM%20svcrq&callback=?';
	
	$.getJSON(svcQryUrl, function(data) {
		var clusters = new L.MarkerClusterGroup({showCoverageOnHover: false});
		var points = L.geoJson(data.features, {
			pointToLayer: function(feature, latlng) {
				var marker = L.marker(latlng);
				clusters.addLayer(marker);
				return clusters;
			}
		}).addTo(map);
	});
})();

$(function() {
		$("#slider").slider({
		min: 0,
		max: 2000,
		value: 500,
		slide: function( event, ui ) {
				$( "#buffAmt" ).val(ui.value + " meters");
			}
		});
		$( "#buffAmt" ).val($( "#slider" ).slider( "value" ) + " meters");
});

});