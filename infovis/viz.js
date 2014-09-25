// Authors: Matthew Townsend and Rahul Singh
function displayData(year) {
    console.log(year);
    year = parseInt(year);
    console.log(year);
    var series1 = [];
    var series2 = [];
    var series3 = [];

    var year;
    d3.json("population.json", function(data) {
        console.log(data);
        console.log(data.length);
        console.log(data[0]);

        for(var i = data.length-1; i >= 0; i--) {
            if (data[i].year === year && data[i].sex === 1) {
                series1.push({
                    x:data[i].age, y:data[i].people
                });  
            } 
            else if (data[i].year === year && data[i].sex === 2)  {
                series2.push({
                    x:data[i].age, y: -Math.abs(data[i].people)
                }); 
            }
        }

        var output = [
            {
                key: "Males",
                values: series1
            },
            {
                key: "Females",
                values: series2
            }
        ];
        // sum all populations
        // check if age is 60 or greater 
        // add to older_pop sum 
        // 
        var totalPopulation = 0;
        var olderPopulation = 0;
        var numWorking = 0;
        var numYounger = 0;

        for(var i = data.length-1; i >= 0; i--) {
            if (data[i].year === year) {
                totalPopulation += data[i].people;
                if (data[i].age >= 60) {
                    olderPopulation += data[i].people;
                }
                if (data[i].age >= 15 && data[i].age < 60) {
                    numWorking += data[i].people;

                }
                if(data[i].age < 15) {
                    numYounger += data[i].people;
                }
            } 
            
        }
        var olderPieData = [
            {
                "label": "# over 60",
                "value": parseInt(olderPopulation)
            } ,
            {
                "label": "Everyone else", 
                "value": parseInt(totalPopulation - olderPopulation)
            }
        ]



        var workingPop = [
            {
                "label": "# between 15 and 60",
                "value": parseInt(numWorking)
            } ,
            {
                "label": "Everyone else", 
                "value": parseInt(totalPopulation - numWorking)
            }
        ]

        var youngerPop = [
            {
                "label": "# below 15",
                "value": parseInt(numYounger)
            } ,
            {
                "label": "Everyone else", 
                "value": parseInt(totalPopulation - numYounger)
            }
        ]


        renderChart(output);
        renderOlderPieChart(olderPieData);
        renderWorkingPieChart(workingPop);
        renderYoungerPieChart(youngerPop);

        $('#centerLabel').text(year);
    });

}

function renderChart(data) {
    nv.addGraph(function() {
        var chart = nv.models.multiBarHorizontalChart()
        .showLegend(false)
        .showControls(false)
        .stacked(true)
        .margin({top: 40, right: 40, bottom: 40, left: 40})
        ;

        chart.yAxis
            .axisLabel("# of people")
            .tickFormat(d3.format("d"))
            ;

        // chart.xAxis
        //    .axisLabel("X-axis Label")
        //    ;

        d3.select("#chart svg")
            .datum(data)
            .transition().duration(500).call(chart);

         nv.utils.windowResize(
                 function() {
                     chart.update();
                 }
             );
        return chart;
    });
}

function renderOlderPieChart(data) {
    nv.addGraph(function() {
      var chart = nv.models.pieChart()
          .x(function(d) { return d.label })
          .y(function(d) { return d.value })
          .showLabels(true)
          .showLegend(false);

        d3.select("#pieChart svg")
            .datum(data)
            .transition().duration(350)
            .call(chart);

      return chart;
    });
}
function renderWorkingPieChart(data) {
    nv.addGraph(function() {
      var chart = nv.models.pieChart()
          .x(function(d) { return d.label })
          .y(function(d) { return d.value })
          .showLabels(true)
          .showLegend(false);

        d3.select("#workingPieChart svg")
            .datum(data)
            .transition().duration(350)
            .call(chart);

      return chart;
    });
}
function renderYoungerPieChart(data) {
    nv.addGraph(function() {
      var chart = nv.models.pieChart()
          .x(function(d) { return d.label })
          .y(function(d) { return d.value })
          .showLabels(true)
          .showLegend(false);

        d3.select("#youngerPieChart svg")
            .datum(data)
            .transition().duration(350)
            .call(chart);

      return chart;
    });
}

var timeout;
var animate = (function () {;
    var dates = [1850, 1860, 1870, 1880, 
    1900, 1910, 1920, 1930, 1940, 1950, 1960, 1970, 1980, 1990, 2000];
    var index = 0;
    timeout = 1500;

    return function () {
        if (timeout !== 1000000) {
            displayData(dates[index]);
        }
        index = (index + 1) % dates.length;
        timeId = setTimeout(animate, timeout);
    }
}());

window.onload = animate;


$(document).ready(function() {
        $('.btn-default').click(function() {
            console.log("hello");
            if(($(this).attr("value")) === "Stop") {
                timeout = 1000000;
            } else if(($(this).attr("value")) === "Play") {
                location.reload();
            } else {
                timeout = 1000000;
                displayData($(this).attr("value"));

            }
        });
});

displayData(1850);
