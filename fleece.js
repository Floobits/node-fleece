"use strict";

var util = require("util");

var fleece = require("./lib/fleece");

function run() {
  var url;

  if (process.argv.length !== 3) {
    console.error(util.format("Usage: %s http://url.to.describe/", process.argv[1]));
    process.exit(0);
    return;
  }

  url = process.argv[2];

  fleece.describe_url(url, function (err, result) {
    if (err) {
      console.error("Error:", err);
      process.exit(1);
      return;
    }
    console.log(url, "\n", result);
  });
}

exports.run = run;
