$("document").ready(function() {

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

	// 2010 aerial photo tiles
	var metro10URL = 'http://gis.wicomicocounty.org/metro2010/{z}/{x}/{y}.png';
	var metro10 = new L.TileLayer(metro10URL, {maxZoom: 19, attribution: mapboxAttrib, tms: true, opacity: 1});

	// CartoDB City Quadrants
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

	// move attribution to left side
	var attribOverride = new L.Control.Attribution({position: 'bottomleft'}).addTo(map);

	// if map zoom is greater than 17, load 2010 aerials
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

// Get City Quadrant polygons from Cart0DB
(function getCityQuads() {
	var poly;
	var quadGeoQry = encodeURIComponent('SELECT quad_name, the_geom FROM cityquads');
	var quadGeoUrl = 'https://nickchamberlain.cartodb.com/api/v1/sql/?format=geojson&q=' + quadGeoQry + '&callback=?';

	function highlightFeature(e) {
		var layer = e.target;

		layer.setStyle({
			opacity: 1,
			fillOpacity: 0,
			weight: 2
		});

		if (!L.Browser.ie && !L.Browser.opera) {
			layer.bringToFront();
		}
	}
	function resetHighlight(e) {
		poly.resetStyle(e.target);
	}
	function zoomToFeature(e) {
		map.fitBounds(e.target.getBounds());
	}

	$.getJSON(quadGeoUrl, function(data) {
		var style = {
			weight: 1,
			color: '#fff',
			fillColor: '#ee791c',
			opacity: 1,
			fillOpacity: 0.2
		};
		function onEachFeature(feature, layer) {
			layer.on({
				mouseover: highlightFeature,
				mouseout: resetHighlight,
				click: zoomToFeature
			});
		}
		poly = L.geoJson(data.features, {style: style, onEachFeature: onEachFeature}).addTo(map);
	});
})();

// Get Service Requests from CartoDB
(function getSvcJSON() {
	var svcGeoQry = encodeURIComponent('SELECT id, problemcod, the_geom FROM svcrq');

	var svcGeoUrl = 'https://nickchamberlain.cartodb.com/api/v1/sql/?format=geojson&q=' +svcGeoQry + '&callback=?';
	
	$.getJSON(svcGeoUrl, function(data) {
		var clusters = new L.MarkerClusterGroup({showCoverageOnHover: false});
		var points = L.geoJson(data.features, {
			pointToLayer: function(feature, latlng) {
				var marker = L.marker(latlng);
				clusters.addLayer(marker);
				return clusters;
			}
		}).addTo(map);
		map.fitBounds(clusters.getBounds());
	});
})();

});

// Query to total by Quadrant - REMEMBER WHY YOU HAD TO USE ST_SetSRID!!!!

// SELECT cityquads.quad as q, count(svcrq.id) 
// FROM svcrq, cityquads 
// WHERE ST_Intersects(ST_SetSRID(cityquads.geom, 4326), ST_SetSRID(svcrq.geom, 4326)) 
// GROUP BY q ORDER BY q