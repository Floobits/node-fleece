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
      throw new Error(util.format("Expected '%s' but got '%s'", expected, result));
    }
    if (!result) {
      console.log("URL %s: No result", url);
      return;
    }
    console.log(url, "\n", result);
  });
}

test_url(
  "https://twitter.com/ggreer/status/588220411529297921",
  "<@ggreer> An emoji haiku titled, Drinking on a School Night[\\s]+📝🕙😐🍺😊  😏🍻😜🍻✨😴💤  🌄⏰😩🕘😱[\\s]+\\([\\d,]+ retweets, [\\d,]+ favorites\\)"
);

test_url(
  "https://github.com/Floobits/floobits-sublime",
  "^floobits-sublime \\(\\d+ stars \\d+ forks\\).*$"
);

test_url(
  "https://www.youtube.com/watch?v=taaEzHI9xyY#t=26m50s",
  "^Crockford on JavaScript - Section 8: Programming Style & Your Brain \\d:\\d\\d:\\d\\d [\\d,]+ views \\d+% like$"
);

test_url(
  "https://twitter.com/SpaceX/status/556131313905070081",
  "^<@SpaceX> Close, but no cigar. This time. vine.co/v/OjqeYWWpVWK[\\s]+\\([\\d,]+ retweets, [\\d,]+ favorites\\)"
);

test_url(
  "https://twitter.com/Bootleg_Stuff/status/752694646682169344",
  "^<@Bootleg_Stuff> 9/11 was a part time job pic.twitter.com/SKSBMLzt0L [\\s]+\\([\\d,]+ retweets, [\\d,]+ favorites\\)"
);

// TODO: this test is rather brittle. Any small change to whitespace on HN could break it.
test_url(
  "https://news.ycombinator.com/item?id=6577671",
  "Accidentally Turing-Complete \\(http:\\/\\/beza1e1\\.tuxen\\.de\\/articles\\/accidentally_turing_complete\\.html\\)[\\s]+\\d+ points by ggreer \\d+ days ago[\\s]+\\| \\d+ comments$"
);

test_url(
  "https://www.reddit.com/r/pics/comments/92dd8/test_post_please_ignore/",
  "test post please ignore | submitted \\d+ years ago by qgyh2 | [\\s]+\\d+ points, \\d+ comments"
);

test_url(
  "https://www.reddit.com/r/videos/",
  "/r/Videos"
);

test_url(
  "https://www.reddit.com/r/videos/comments/43wsdi/history_of_japan/",
  "History of Japan \\(https://www.youtube.com/watch\\?v=Mh5LY4Mz15o\\) | submitted \\d+ (month|year)s ago by MannschaftPilz | [\\s]+\\d+ points, \\d+ comments"
);
