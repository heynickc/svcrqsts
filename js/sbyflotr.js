$("document").ready(function() {

(function getSvcGraph() {

  var qry = encodeURIComponent('SELECT  month, count(id) FROM ((SELECT id, EXTRACT(EPOCH FROM (date_trunc(\'month\', datetimecl)))*1000 as month FROM svcrq)) as A GROUP BY month ORDER BY month');

  // var qry = encodeURIComponent('SELECT  month, year, count(id) FROM ((SELECT id, date_part(\'year\', datetimecl) as year, date_part(\'month\', datetimecl) as month FROM svcrq)) as A WHERE month > 6 or year > 2010 GROUP BY year, month ORDER BY year, month;');

  // var qry = encodeURIComponent('SELECT  month, count(id) FROM ((SELECT id, date_trunc(\'month\', CAST(datetimecl AS timestamp)) as month FROM svcrq)) as A GROUP BY month ORDER BY month');

  var svcQryUrl = 'https://nickchamberlain.cartodb.com/api/v1/sql/?format=json&q=' + qry + '&callback=?';

  $.getJSON(svcQryUrl, function(data) {
    var items = [];

    $.each(data.rows, function(key, val) {
      items.push([val.month, val.count]);
    });

    lineGraph(document.getElementById("flotr2"), items);
  });
})();


var lineGraph = function basic_bars(container, data) {
  var
    d1 = data,
    options,
    graph;

  options =  {
      title: 'Service Requests/Month',
      ieBackgroundColor: '#232323',
      fontColor: '#fff',
      HtmlText: false,
      mouse : {
        track : true,
        relative : true
      },
      yaxis : {
        color: '#fff',
        title: '# of Requests',
        min : 0,
        autoscaleMargin : 1
      },
      selection : {
        mode : 'x'
      },
      xaxis : {
        color: '#fff',
        labelsAngle : 45,
        showMinorLabels: true,
        mode : 'time'
      },
      grid : {
        color: '#fff'
      }
    };

    function drawGraph (opts) {
      o = Flotr._.extend(Flotr._.clone(options), opts || {});
      return Flotr.draw(
        container,
        [d1], o
      );
    }
    graph = drawGraph();

    Flotr.EventAdapter.observe(container, 'flotr:select', function(area) {
      graph = drawGraph({
        xaxis : { min : area.x1, max : area.x2, mode : 'time', labelsAngle : 45 },
      yaxis : { min : area.y1, max : area.y2 }
    });
  });

  Flotr.EventAdapter.observe(container, 'flotr:click', function () { graph = drawGraph(); });
};
});