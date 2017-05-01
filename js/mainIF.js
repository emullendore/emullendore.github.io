//a couple quirks that I couldn't quite work out. After hours of working I made little progress on:
//1. determining bar widths by number of values!=NaN. I could print the array of valid values, but
//could not incorporate it into the other functions.
//2. variable 5, political censorship, refuses to sort for whatever reason.-- probably take out variable 5 after grading
(function(){
//array to hold header names of csvData
keyArray=["Users_per_100", "Average_Connection_Speed","Political_Rights", "Civil_Liberties"] //"Political_Filtering"]
var expressed = keyArray[0];



//key to assign colors to each variable
var objectColors={
      Users_per_100:[  '#ffffcc','#c2e699','#78c679','#31a354','#006837'],
      Average_Connection_Speed:['#c2e699','#78c679','#31a354','#006837'],
      Political_Rights:['#005a32','#238443','#41ab5d','#78c679','#addd8e','#d9f0a3','#ffffcc' ],
      Civil_Liberties:['#005a32','#238443','#41ab5d','#78c679','#addd8e','#d9f0a3','#ffffcc' ],
      Political_Filtering:['#006837','#31a354','#78c679','#c2e699','#ffffcc']
};

//key to assign chart titles to each variable
var chartTitles={
      Users_per_100:['Internet Users per 100 People'],
      Average_Connection_Speed:['Average Connection Speed (kbps)'],
      Political_Rights:['Freedom House: Political Rights (1-7)'],
      Civil_Liberties:['Freedom House: Civil Liberties (1-7)']
      // Political_Filtering:['ONI: Political Censorship (0-4)']
};

var labelTitles={
      Users_per_100:['Internet Users per 100 People'],
      Average_Connection_Speed:['Average Connection Speed (kbps)'],
      Political_Rights:['Political Rights'],
      Civil_Liberties:['Civil Liberties']
      // Political_Filtering:['Political Censorship']
};
//chart dimensions
var chartWidth = 720,
    chartHeight = 697.5,
    leftPadding=29,//more room for scale
    rightPadding=20,
    topBottomPadding=20,
    chartInnerWidth=chartWidth - leftPadding - rightPadding,
    chartInnerHeight=chartHeight-(topBottomPadding*2),//make chartInnerHeight contined within padding
    translate="translate(" + leftPadding + "," + topBottomPadding + ")";



window.onload = setMap();

function setMap() {
  //set width, height
  var width= 648, //window.innerWidth * 0.9 -- this never looked how I wanted
      height=342,
      centered;
  //append map svg container to body
  var map=d3.select("body")
        .append("svg")
        .attr("class","map")
        .attr("width", width)
        .attr("height",height);


  //create natural earth projection of world
  var projection=d3.geo.naturalEarth()
      .scale(114)
      .translate([width/2,height/2])
      .precision(.1);

//apply path generator to apply projection to spatial data
  var path=d3.geo.path()
      .projection(projection);

//load data asynchronously
  var q=d3_queue.queue();
      q.defer(d3.csv, "data/internet_censorship.csv")//csv data
      q.defer(d3.json, "data/ne_50m_admin_0_countries_lakes.topojson")//spatial data
      q.await(callback);

  function callback(error, csvData, world){
    //set graticule on map
    setGraticule(map,path);
    //translate topojson to geojson
    var worldCountries=topojson.feature(world, world.objects.ne_50m_admin_0_countries_lakes).features;
    //create color scale

    //loop through csvData and assign ea attribute to values in geojson
    for (var i=0; i<csvData.length; i++) {
      var csvCountry=csvData[i]; //current region
      var csvCountryCode=csvCountry.ne_50m_admin_0_countries_lakes_adm0_a3; //the csv key

      var jsonCountries=world.objects.ne_50m_admin_0_countries_lakes.geometries;//linked to the geojson

      //loop to find correct region
      for (var j=0; j<jsonCountries.length;j++) {
        if (jsonCountries[j].properties.adm0_a3==csvCountryCode){ //aka if attribute exists both in geojson and csv...
          for (var key in keyArray){//for each variable in keyArray
            var attribute=keyArray[key];//each variable assigned to the country
            var value =parseFloat(csvCountry[attribute]);//position in array -- 0,1,2,3, or 4

            (jsonCountries[j].properties[attribute])=value;//find values both present in csv and geojson
          };
        };
      };
    };
    //link color scale with data
    var colorScale=makeColorScale(csvData);
    //for creating choropleth
    setEnumerationUnits(worldCountries, map, path, colorScale);
    //for implementing chart with data and color`
    setChart(csvData, worldCountries, colorScale);
    createDropdown(csvData, keyArray);
  };

//end setMap
};

//add dropdown
function createDropdown(csvData){
  var dropdown=d3.select("body")
      .append("select")
      .attr("class","dropdown")
      .on("change", function(){
        changeAttribute(this.value, csvData)
      });
//give title to dropdown
  var titleOption = dropdown.append("option")
      .attr("class", "titleOption")
      .attr("disabled", "true")
      .text("Select Variable");
//drop down options taken from array chartTitles
  var attrOptions=dropdown.selectAll("attrOptions")
      .data(keyArray)
      .enter()
      .append("option")
      .attr("value", function(d){return d})
      .text(function(d, i){return chartTitles[d]});
};

//implementing highlight funciton for mouseover
function highlight(props){
  var selected=d3.selectAll("."+props.adm0_a3)
      .style({
          "fill-opacity":"1",
          "stroke":"white",
          "stroke-width":"2"
      })
     setLabel(props);
};

//implementing dehighlight function for mouseout
function dehighlight(props){

   var selected=d3.selectAll("."+props.adm0_a3)
       .style({
         "stroke":function(){
              return getStyle(this, "stroke")
         },
         "stroke-width":function(){
              return getStyle(this, "stroke-width")
         }

        //  "fill-opacity":function(){
        //       return getStyle(this, "fill-opacity")
        //  }
      });
  //used to determine previous style so when you mouseoff and dehighlight, it returns to that previous style
  function getStyle(element, styleName){

    var styleText=d3.select(element)
        .select("desc")
        .text();

    var styleObject=JSON.parse(styleText);
    return styleObject[styleName];
  };
  //remove label when mouseoff from item
  d3.select(".infoLabel")
        .remove();
};

//implement label, provide content based on certain properties
function setLabel(props){

  if (isNaN(props[expressed])){//if there is no value, state No Data
    var labelAttribute="<h1>"+labelTitles[expressed]+"<b>"+":   "+'No Data'+"</b></h><h2>";
    var infoLabel=d3.select("body")
          .append("div")
          .attr({
              "class": "infoLabel",
              "id":props.adm0_a3+"_label"
          })
          .html(labelAttribute);

      var countryName=infoLabel.append("body")
          .attr("class","labelname")
          .html(props.name);

  }else{//else state the value
  var labelAttribute="<h1>"+labelTitles[expressed]+"<b>"+":   "+props[expressed]+"</b></h><h2>";

  var infoLabel=d3.select("body")
        .append("div")
        .attr({
            "class": "infoLabel",
            "id":"."+props.adm0_a3
        })
        .html(labelAttribute);

    var countryName=infoLabel.append("body")
        .attr("class","labelname")
        .html(props.name);

    }
};



//to move label
function moveLabel(){
//get label dimensions to determining positioning when mousing over
// var labelWidth=d3.select(".infoLabel")
//     .node()
//     .getBoundingClientRect()
//     .width;

// var labelWidth=d3.select(".infoLabel")
//     .node()
//     .style({"width": "10"});



//give to possible positions depending on position of mouse, distance to border
// var x1=d3.event.clientX,
//     y1=d3.event.clientY-35,
//     x2=d3.event.clientX-labelWidth,
//     y2=d3.event.clientY+10;
//
// //horizontal label coordinate, testing for overflow
// var x = d3.event.clientX > window.innerWidth - labelWidth - 10 ? x2 : x1;
// //vertical label coordinate, testing for overflow
// var y = d3.event.clientY < 75 ? y2 : y1;
// //put these specifications into action, indicate in .style of infolabel
//   d3.select(".infoLabel")
//       .style({
//         "left":x+"px",
//         "top": y + "px"
//       });
};

function setGraticule(map,path){
    //apply graticule with lines 5 units apart in both dimensions--lat,lon
    var graticule=d3.geo.graticule()
        .step([5,5]);

    //apply background to graticule
    var gratBackground=map.append("path")
        .datum(graticule.outline())
        .attr("class","gratBackground")
        .attr("d",path)

    //add graticule lines
    var gratLines=map.selectAll(".gratLines")
        .data(graticule.lines())
        .enter() //create an element for each datum
        .append("path")//append each element to the svg as path element
        .attr("class", "gratLines")//assign class equal to gratLines
        .attr("d",path);
};
//create color scale with data
 function makeColorScale(data){

     var colorScale=d3.scale.quantile()//use quantile for scale generator
          .range(objectColors[expressed]);//incorporate objectColors array to change depending on variable

//creating equal interval classifcation
  var minmax = [
        d3.min(data, function(d) { return parseFloat(d[expressed]); }),
        d3.max(data, function(d) { return parseFloat(d[expressed]); })
    ];
    //assign two-value array as scale domain
    colorScale.domain(minmax);
    return colorScale;
};



function setEnumerationUnits(worldCountries, map, path, colorScale){
    //add countries to map
    var selectCountries=map.selectAll(".selectCountries")
        .data(worldCountries)
        .enter()
        .append("path")
        .attr("d",path)//assign d with attribute path
        .attr("class", function(d){
          return "selectCountries " + d.properties.adm0_a3;
        })
        //color based on colorScale
        .style("fill", function(d){
            return choropleth(d.properties, colorScale);
        })
        //on mouseover implement highight
        .on("mouseover",function(d){
            highlight(d.properties);
        })
        //on mouseout, implement dehighlight
        .on("mouseout", function(d){
            dehighlight(d.properties);
        })
        //on mousemove implement move label
        .on("mousemove", moveLabel);
    //used to return previous style
    var desc=selectCountries.append("desc")
        .text('{"stroke":"#000", "stroke-width":"0.5px"}');
};

//creation of choropleth map
function choropleth(props, colorScale){
  var value = parseFloat(props[expressed]);

  if(isNaN(value)){
        return "grey";//no value
    } else if (value==0){
        return "lightgrey";//for case of Political_Filtering with a score of 0
    } else{
        return colorScale(value);
    }
  };

function setChart(csvData, worldCountries, colorScale){

//add chart element
  var chart = d3.select("body")
      .append("svg")
      .attr("width",chartWidth)
      .attr("height",chartHeight)
      .attr("class","chart");

//add chartBackground
  var chartBackground = chart.append("rect")
       .attr("class", "chartBackground")
       .attr("width", chartInnerWidth)
       .attr("height", chartInnerHeight)
       .attr("transform", translate);

  var yScale = d3.scale.linear()
              //change scale values dynamically with max value of each variable
              .domain([d3.max(csvData,function(d){ return parseFloat(d[expressed])})*1.02, 0])
              //output this between 0 and chartInnerHeight
              .range([0, chartInnerHeight]);

//bars element added
  var bars=chart.selectAll(".bars")
      .data(csvData)
      .enter()
      .append("rect")
      .sort(function(a,b){
        //list largest values first for easier of reading
        return b[expressed]-a[expressed];
      })
      .attr("class", function(d){
        //give clas name to bars--was switching out values to see how each variable plotted out
        return "bars " + d.adm0_a3;
      })
      //width depending on number of elements, in my case 192-1
      .attr("width", chartInnerWidth/csvData.length - 1)
      //determine position on x axis by number of elements, incl leftPadding
      .attr("x", function(d,i){
        return i*(chartInnerWidth/csvData.length) + leftPadding;
      })
      //height by yscale of each value, within chartInnerHeight
      .attr("height", function(d){
        return chartInnerHeight-yScale(parseFloat(d[expressed]));
      })
      //make bars 'grow' from bottom
      .attr("y", function(d){
        return yScale(parseFloat(d[expressed]))+topBottomPadding;

      })
      //color by colorScale
      .style("fill", function(d){
        return choropleth(d, colorScale)
      })

      .on("mouseover", highlight)//highlight selected  bars
      .on("mouseout", dehighlight)//de highlight selected bars with mouseout
      //.on("mousemove", moveLabel);//follow label with cursor

    //for returing style after an interaction
    var desc=bars.append("desc")
        .text('{"stroke":"black", "stroke-width":"0px", "fill-opacity":"1"}');    //add chart title

    //add chart title, change according to variable
    var chartTitle=chart.append("text")
        .attr("x", 250)
        .attr("y", 35)
        .attr("class","chartTitle")
        .text(chartTitles[expressed])

    //create vertical axis generator
    var yAxis = d3.svg.axis()
        .scale(yScale)
        .orient("left");

    //place axis
    var axis = chart.append("g")
        .attr("class", "axis")
        .attr("transform", translate)
        .call(yAxis);//for how actual numbers will be distributed

    //create frame for chart border
    var chartFrame = chart.append("rect")
        .attr("class", "chartFrame")
        .attr("width", chartInnerWidth)
        .attr("height", chartInnerHeight)
        .attr("transform", translate);

//IT RETURNS THE CORRECT ARRAY, I JUST CAN'T MAKE IT GO INTO OTHER FUNCITONS
//   function newData(worldCountries, csvData){
//     newDataArray=[];
//      for (var i=0; i<csvData.length; i++){
//        newDataArray.push(parseFloat(csvData[i][expressed]));
//     }
//     var filteredArray=newDataArray.filter(Boolean);
//     return filteredArray;
//
//   };
// newData(worldCountries, csvData)
//  var data2 = newData(worldCountries, csvData);


};


function changeAttribute(attribute, csvData){

  expressed=attribute;
  //dynamic y scaling, restated in both functions
  var yScale = d3.scale.linear()
              //change scale values dynamically with max value of each variable
              .domain([d3.max(csvData,function(d){ return parseFloat(d[expressed])})*1.02, 0])
              //output this between 0 and chartInnerHeight
              .range([0, chartInnerHeight]);
  //upon changin attribute, make color scale also change
  var colorScale=makeColorScale(csvData);
  //return countries colored to colorScale
  var selectCountries=d3.selectAll(".selectCountries")
      .transition()
      .duration(600)
      .style("fill", function(d){
        return choropleth(d.properties, colorScale)
      });

  var bars=d3.selectAll(".bars")
      .sort(function(a,b){
        //list largest values first for easier of reading
      return b[expressed]-a[expressed];
    })
      //cool transition effects
      .transition()
      .delay(function(d,i){
        return i*8
      })
      .duration(90)
      //determine position on x axis by number of elements, incl leftPadding
      .attr("x", function(d,i){
        return i*(chartInnerWidth/csvData.length) + leftPadding;
    })
      //height by yscale of each value, within chartInnerHeight
      .attr("height", function(d){
        return chartInnerHeight-yScale(parseFloat(d[expressed]));
    })
      //y positioning
      .attr("y", function(d){
        return yScale(parseFloat(d[expressed]))+topBottomPadding;

    })
      //color by colorScale
      .style("fill", function(d){
        return choropleth(d, colorScale);
    });
    //change chart title dynamically
    var chartTitle=d3.select(".chartTitle")
        .text((chartTitles[expressed]))
};

})();
