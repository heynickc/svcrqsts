$("document").ready(function() {

// SR Frequency by Month
(function getSvcGraph() {

  var svcQry = encodeURIComponent('SELECT  month, count(id) FROM ((SELECT id, EXTRACT(EPOCH FROM (date_trunc(\'month\', datetimecl)))*1000 as month FROM svc)) as A GROUP BY month ORDER BY month');

  // var qry = encodeURIComponent('SELECT  month, year, count(id) FROM ((SELECT id, date_part(\'year\', datetimecl) as year, date_part(\'month\', datetimecl) as month FROM svc)) as A WHERE month > 6 or year > 2010 GROUP BY year, month ORDER BY year, month;');

  // var qry = encodeURIComponent('SELECT  month, count(id) FROM ((SELECT id, date_trunc(\'month\', CAST(datetimecl AS timestamp)) as month FROM svc)) as A GROUP BY month ORDER BY month');

  // SQL for selecting highest frequency of problem codes:
  // var qry = SELECT problemcod, count(problemcod) as cnt FROM svc GROUP BY problemcod ORDER BY cnt DESC LIMIT 5

  var svcQryUrl = 'https://nickchamberlain.cartodb.com/api/v1/sql/?format=json&q=' + svcQry + '&callback=?';

  $.getJSON(svcQryUrl, function(data) {
    var items = [];

    $.each(data.rows, function(key, val) {
      items.push([val.month, val.count]);
    });

    lineGraph(document.getElementById("svcGraph"), items);
  });

})();

// Top 5 Problem Categories
(function getProbGraph() {

  var probQry = encodeURIComponent('SELECT problemcod, count(problemcod) as cnt FROM svc GROUP BY problemcod ORDER BY cnt DESC LIMIT 5');

  var probQryUrl = 'https://nickchamberlain.cartodb.com/api/v1/sql/?format=json&q=' + probQry + '&callback=?';

  $.getJSON(probQryUrl, function(data) {
    var items = [],
        ticks = [];

    $.each(data.rows, function(key, val) {
      items.push([key, val.cnt]);
      ticks.push([key, val.problemcod]);
    });

    probGraph(document.getElementById("probGraph"), items, ticks);
  });

})();


var lineGraph = function timeLine(container, data) {
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
        track : false,
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
        color: '#fff',
        verticalLines: false,
        horizontalLines: false
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

var probGraph = function probGraph(container, data, ticks) {

  var d1 = data,
      labels = ticks;

  // Draw the graph
  Flotr.draw(
    container,
    [d1],
    {
      HtmlText: false,
      title: 'Top 5 Service Request Types',
      ieBackgroundColor: '#232323',
      bars : {
        show : true,
        horizontal : false,
        shadowSize : 0,
        barWidth : 0.75
      },
      mouse : {
        track : false,
        relative : true
      },
      yaxis : {
        min : 0,
        autoscaleMargin : 1,
        color: '#fff',
        title: '# of Requests'
      },
      xaxis: {
        color: '#fff',
        // title: 'Request Type',
        ticks: labels,
        labelsAngle: 45
      },
      grid: {
        verticalLines: false,
        horizontalLines: false,
        color: '#fff'
      }
    }
  );
};

});