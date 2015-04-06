/*jslint indent: 2, node: true, nomen: true, plusplus: true, todo: true */
"use strict";

var util = require("util");

var fleece = require("../lib/fleece");

function test_url(url, expected) {
  fleece.describe_url(url, function (err, result) {
    if (err) {
      console.error("URL %s error: %s", url, err);
      throw new Error(err);
    }
    if (result.match(expected) === null) {
      throw new Error(util.format("Expected %s but got %s", expected, result));
    }
    if (!result) {
      console.log("URL %s: No result", url);
      return;
    }
    console.log(url, "\n" ,result);
  });
}

test_url(
  "https://github.com/Floobits/floobits-sublime",
  "^floobits-sublime \\(\\d+ stars \\d+ forks\\) .*$"
);

test_url(
  "https://www.youtube.com/watch?v=taaEzHI9xyY#t=26m50s",
  "^Crockford on JavaScript - Section 8: Programming Style & Your Brain \\d:\\d\\d:\\d\\d [\\d,]+ views \\d+% like$"
);

test_url(
  "https://twitter.com/SpaceX/status/556131313905070081",
  "^<@SpaceX> Close, but no cigar. This time. https://vine.co/v/OjqeYWWpVWK  \\([\\d,]+ retweets, [\\d,]+ favorites\\)"
);

// TODO: this test is rather brittle. Any small change to whitespace on HN could break it.
test_url(
  "https://news.ycombinator.com/item?id=6577671",
  "Accidentally Turing-Complete \\(http:\\/\\/beza1e1\\.tuxen\\.de\\/articles\\/accidentally_turing_complete\\.html\\) \\d+ points by ggreer \\d+ days ago  \\| \\d+ comments"
);
