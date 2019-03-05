var express = require('express');
var router = express.Router();
var path = require('path');
var csvParser  = require('csv-parse');
var fs         = require('fs');
var glob       = require("glob");

var sensorFilesBasePath    = path.join(__dirname, "../python/sensor-values/");
var histSensorFilesPaths   = glob.sync(sensorFilesBasePath + "@(temperature|humidity)_*_log_*.csv");
var latestSensorFilesPaths = glob.sync(sensorFilesBasePath + "@(temperature|humidity)_*_latest_value.csv");
var valuesFilenameRegex    = /\b(temperature|humidity)_([^_]*)_(log|latest_value)_?(\d{4})?/;
console.log("Found %d files in directory %s", (histSensorFilesPaths.length + latestSensorFilesPaths.length), sensorFilesBasePath);

Array.prototype.addValues = function (otherArray) { otherArray.forEach(function(v) { this.push(v); }, this); };

function buildResultRec(resultAcc, filesPaths, fromTs, toTs, expressRes) {
  if (filesPaths.length === 0) {
    expressRes.json(resultAcc);
    return; 
  }
  var filePath = filesPaths.pop();
  var matches  = filePath.match(valuesFilenameRegex);
  if (matches.length !== 5) { throw "filepath '" + filePath + "' is not in the expected format"; }
  var sensorKind = matches[1];
  var sensorName = matches[2];
  var dataType   = matches[3];
  var yearOfData = matches[4];
  console.log("sensorKind: " + sensorKind + ", sensorName: " + sensorName + ", dataType: " + dataType + ", yearOfData: " + yearOfData);
  fs.readFile(filePath, 'utf8', function (err, data) {
    if (err) {
      return console.log(err);
    }
    csvParser(data, function(err, output){
      var rows   = output.slice(1);
      var values = [];
      rows.forEach(function(line) {
        var ts = Date.parse(line[0]);
        if ((isNaN(fromTs) || ts >= fromTs) && 
            (isNaN(toTs) || ts <= toTs)) {
          values.push({x: ts, y: parseFloat(line[1])});
        }
      });
      //because the year is in the filename, it is possible that several files contain data for the same sensor
      var existing = resultAcc.filter(function(item) { return item.sensorName == sensorName && item.sensorKind == sensorKind; });
      if (existing.length > 0) {
        existing[0].values.addValues(values); 
      }
      else {
        resultAcc.push({sensorName: sensorName, sensorKind: sensorKind, values: values}); 
      }
      buildResultRec(resultAcc, filesPaths, fromTs, toTs, expressRes); 
    });
  });
}

router.get('/', function (req, res) {
  res.render('sensor', { title: 'Sensors' });
});

router.get('/historical-sensordata', function(req, res) {
  res.header("Access-Control-Allow-Origin", "*"); //to allow the client calling this script be on another ip
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept"); //see comment above
  res.type('application/json');
  var fromTs = parseInt(req.param('fromtimestamp'));
  var toTs   = parseInt(req.param('totimestamp'));
  console.log("fromtimestamp: " + fromTs + ", totimestamp: " + toTs);
  buildResultRec([], histSensorFilesPaths.slice(), fromTs, toTs, res); 
});
 
router.get('/latest-sensordata', function(req, res) {
  res.header("Access-Control-Allow-Origin", "*"); //to allow the client calling this script be on another ip
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept"); //see comment above
  res.type('application/json');
  buildResultRec([], latestSensorFilesPaths.slice(), NaN, NaN, res);
});
 

module.exports = router;