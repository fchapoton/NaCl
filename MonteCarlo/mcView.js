// Global handle to module
MonteCarloModule = null;

// Global status message
statusText = 'NO-STATUS';

lastClick = null;

nPtsSim = null;

function pageDidLoad() {
  var listener = document.getElementById("listener");
  listener.addEventListener("load", moduleDidLoad, true );
  listener.addEventListener("message", handleMessage, true );
  if ( MonteCarloModule == null ) {
    updateStatus( 'LOADING...' );
  } else {
    updateStatus();
  }
}

function moduleDidLoad() {
  MonteCarloModule = document.getElementById( "monte_carlo" );
  updateStatus( "OK" );
  var go = document.getElementById( "go" );
  var nPts = document.getElementById( "nPts" );
  go.onclick = function() {
    go.disabled = true;
    nPtsSim = Number( nPts.value );
    console.log( "Sending " + nPtsSim);
    lastClick = Date.now();
    MonteCarloModule.postMessage( nPtsSim ); }; 
  go.disabled = false;
  nPts.disabled = false;
}

function handleMessage(message_event) {
  var res = message_event.data;
  if ( Object.prototype.toString.call( res ) === "[object Array]") {
    console.log( "Received " + res.length + " results" );
    var tDiff = Date.now() - lastClick;
    updateStatus( "Received: " + res[res.length-1].Mean.toFixed(7) 
        + " +/- " + res[res.length-1].StdError.toFixed(7) 
        +  " after " + tDiff + "ms" + " for " + nPtsSim + " points" );
    updateTable( res );
    updatePlot( res );
    var go = document.getElementById( "go" );
    go.disabled = false;
  } else {
    d3.select("#results table").remove(); // Remove old data
    d3.select("#plot svg").remove(); // Remove old data
    updateStatus( "Received: " + res.Mean.toFixed(7) 
        + " +/- " + res.StdError.toFixed(7) 
        + " after " + 100*res.Samples/nPtsSim + "% completion" );
  }
}

function updateStatus( optMessage ) {
  if (optMessage)
    statusText = optMessage;
  var statusField = document.getElementById("statusField");
  if (statusField) {
    statusField.innerHTML = statusText;
  }
}

function updateTable( res ) {
  // D3 visualization
  d3.select("#results table").remove(); // Remove old data
  var table = d3.select("#results").append("table");
  var th = table.selectAll("th")
    .data(["Samples","Total","Mean","Std Error"])
    .enter().append("th").text( function (d) { return d; });
  var tr = table.selectAll("tr")
    .data( res )
    .enter().append("tr");
  var td = tr.selectAll("td")
    .data( function (d) { 
      return [d.Samples, d.Total, d.Mean.toFixed(7), d.StdError.toFixed(7)]; })
    .enter().append("td");
  td.text( function (d) { return d; });
}

function updatePlot( res ){
  d3.select("#plot svg").remove();
  var w=320, h=200;
  var x = d3.scale.linear().domain([0, res[res.length-1].Samples]).range( [0, w]);
  var y = d3.scale.linear().domain([0, 1]).range([0, h]);
  var chart = d3.select("#plot").append("svg").attr("width", w).attr("height", h);
  var rect = chart.selectAll("rect").data( res );
  var barWidth = 10;
  rect.enter()
    .append("rect")
    .attr("x", function (d,i) { return x(d.Samples) - barWidth;})
    .attr("y", function (d,i) { return h - y(d.Mean + d.StdError/2); })
    .attr("width", function (d,i) { return barWidth; })
    .attr("height", function (d,i) { return Math.max( y( d.StdError ), 1); })
    .style("fill", "steelblue");
  chart.append("line").attr("x1", 0).attr("x2",w).attr("y1",h).attr("y2",h).style("stroke","#000000");
  chart.append("line").attr("x1", 0).attr("x2",0).attr("y1",h).attr("y2",0).style("stroke","#000000");
}