$("document").ready(function () {

	// Mapbox Light tiles
	var mapboxAttrib = 'Map data &copy; 2012 OpenStreetMap contributors, Imagery &copy; 2012 CloudMade';

	// Mapbox Streets tiles
	var mapboxStUrl = 'http://{s}.tiles.mapbox.com/v3/nickspw.i93a393f/{z}/{x}/{y}.png';
	var mapboxSt = new L.TileLayer(mapboxStUrl, {
		maxZoom: 19,
		attribution: mapboxAttrib,
		// tms: true
	});

	// Contour Tiles on Mapbox Graphite
	var mapboxContourUrl = 'http://api.tiles.mapbox.com/v1/nickspw.map-ypm2tgy9/{z}/{x}/{y}.png';
	var mapboxContour = new L.TileLayer(mapboxContourUrl, {
		maxZoom: 19,
		attribution: mapboxAttrib,
		tms: true
	});

	// 2010 aerial photo tiles
	var metro10URL = 'http://gis.wicomicocounty.org/metro2010/{z}/{x}/{y}.png';
	var metro10 = new L.TileLayer(metro10URL, {
		maxZoom: 19,
		attribution: mapboxAttrib,
		tms: true,
		opacity: 1
	});

	// Marker/Overlay tile groups used later
	var markerGroup = new L.LayerGroup();
	var overlayGroup = new L.LayerGroup();

	// Create map
	var salisbury = new L.LatLng(38.3672, -75.5748);
	var map = new L.Map('map', {
		center: salisbury,
		layers: [mapboxContour],
		attributionControl: false
	});

	// move attribution to left side
	var attribOverride = new L.Control.Attribution({
		position: 'bottomleft'
	}).addTo(map);

	// if map zoom is greater than 17, load 2010 aerials
	map.on('zoomend', function (e) {
		var zoom = map.getZoom();
		if (zoom > 17 && map.hasLayer(mapboxContour) || map.hasLayer(mapboxSt)) {
			map.removeLayer(mapboxContour, mapboxSt);
			map.addLayer(metro10);
		}
		if (zoom <= 17 && $('.heatSwitch').hasClass('btn-inverse')) {
			map.removeLayer(metro10);
			map.addLayer(mapboxSt);
		}
		if (zoom <= 17 && !$('.heatSwitch').hasClass('btn-inverse')) {
			map.removeLayer(metro10);
			map.addLayer(mapboxContour);
		}
	});

	// Refresh map
	function refreshMap() {
		map.setView(salisbury, 13);
		markerGroup.clearLayers();
		overlayGroup.clearLayers();
	} //resets map zoom and center, clears all markers
	refreshMap();

	$("form").submit(function (event) {
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
					var loc = new L.LatLng(y, x);
					var locMarker = new L.Marker(loc, {
						draggable: true
					});
					markerGroup.addLayer(locMarker);
					//map.addLayer(markerGroup);
					map.setView(loc, 16);
					// listeners for .distance range input and dragging the marker
					locMarker.on('drag', function (e) {
						mrkLatLng = locMarker.getLatLng();
						loc = new L.LatLng(mrkLatLng.lat, mrkLatLng.lng);
						overlayGroup.clearLayers();
					});
				} else {
					refreshMap();
					$('#street').val('Address Invalid');
				} //test address and geocode it if a location is returned by the iMap service
			}).error(function () {
				refreshMap();
			}); //get geocoding JSON
		} else {
			refreshMap();
		} //if something is in #street field, do geocoding else reset the map
	}); //geocode address on submit

	// Get Service Requests from CartoDB
	(function getSvcJSON() {
		var svcGeoQry = encodeURIComponent('SELECT id, problemcod, the_geom FROM svc');

		var svcGeoUrl = 'https://nickchamberlain.cartodb.com/api/v1/sql/?format=geojson&q=' + svcGeoQry + '&callback=?';

		$.getJSON(svcGeoUrl, function (data) {
			var clusters = new L.MarkerClusterGroup({
				showCoverageOnHover: false,
				singleMarkerMode: true
			});

			function onEachFeature(feature, layer) {
				if (feature.properties && feature.properties.problemcod) {
					layer.bindPopup(feature.properties.problemcod);
				}
			}

			var points = L.geoJson(data.features, {
				onEachFeature: onEachFeature
			});
			points.eachLayer(function (layer) {
				clusters.addLayer(layer);
			});
			map.addLayer(clusters);
			map.fitBounds(clusters.getBounds());
			map.panBy([160, 0]);

			$('.ptSwitch').click(function () {
				$(this).toggleClass('btn-inverse');
				if ($(this).hasClass('btn-inverse')) {
					map.removeLayer(clusters);
				} else map.addLayer(clusters);
			});

			$('.heatSwitch').click(function () {
				$(this).toggleClass('btn-inverse');
				if ($(this).hasClass('btn-inverse')) {
					if (map.getZoom() > 17) {
						return null;
					} else {
						map.removeLayer(mapboxContour);
						map.addLayer(mapboxSt);
					}
				} else {
					if (map.getZoom() <= 17) {
						map.removeLayer(mapboxSt);
						map.addLayer(mapboxContour);
					}
				}
			});
		});
	})();

});