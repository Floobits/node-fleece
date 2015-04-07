# Fleece

Node.js/io.js module. Fetch and describe URLs (Tweets, GitHub repos, YouTube videos, etc). Useful for IRC bots.

[![npm version](https://badge.fury.io/js/fleece.svg)](http://badge.fury.io/js/fleece)

[![Build Status](https://travis-ci.org/Floobits/node-fleece.svg)](https://travis-ci.org/Floobits/node-fleece)

[![Floobits Status](https://floobits.com/Floobits/node-fleece.svg)](https://floobits.com/Floobits/node-fleece/redirect)

## Install

Add `fleece` to your `package.json` or `npm install fleece`.

## Use

The main function you'll want to use is `describe_url()`. Give it a URL and it will give you a one-line description:

```javascript
let fleece = require("fleece");
fleece.describe_url("https://github.com/Floobits/floobits-sublime", function (err, result) {
  if (err) {
    console.error("Error fetching URL:", err);
    return;
  }
  if (!result) {
    // No outright error, but empty <title>, URL is an image, etc
    console.log("No result");
    return;
  }
  console.log(result);
});
```

Assuming no network errors, the output should be:

floobits-sublime (11 stars 213 forks) Floobits real-time collaboration plugin for Sublime Text 2 and 3

This works for more than just GitHub URLs. Fleece also supports Twitter, YouTube, and Hacker News:

describe_url("https://www.youtube.com/watch?v=taaEzHI9xyY#t=26m50s");

Crockford on JavaScript - Section 8: Programming Style & Your Brain 1:06:46 79,990 views 100% like

---

describe_url("https://twitter.com/SpaceX/status/556131313905070081");

&lt;@SpaceX&gt; Close, but no cigar. This time. https://vine.co/v/OjqeYWWpVWK  (12,216 retweets, 9,328 favorites)

---

describe_url("https://github.com/Floobits/floobits-sublime");

floobits-sublime (11 stars 213 forks) Floobits real-time collaboration plugin for Sublime Text 2 and 3

---

describe_url("https://news.ycombinator.com/item?id=6577671");

Accidentally Turing-Complete (http://beza1e1.tuxen.de/articles/accidentally_turing_complete.html) 107 points by ggreer 533 days ago  | 48 comments

---

For another usage example, see [floobot](https://github.com/Floobits/floobot/blob/c02905bbdcc4eaee57ce9e7275cfbf954d4bef53/lib/server.js#L104).
