# Fleece

Node.js/io.js module. Fetch and describe URLs (Tweets, GitHub repos, YouTube videos, etc). Useful for IRC bots.

[![Floobits Status](https://floobits.com/Floobits/node-fleece.svg)](https://floobits.com/Floobits/node-fleece/redirect)

## Install

Add `fleece` to your `package.json` or `npm install fleece`.

## Use

The main function you'll want to use is `get_url_msg()`. Give it a URL and it will give you a one-line description:

```javascript
let fleece = require("fleece");
fleece.get_url_msg("https://github.com/Floobits/floobits-sublime", function (err, result) {
  if (err) {
    console.error("Error fetching URL:", err);
    return;
  }
  if (!result) {
    // Empty <title>, URL is an image, etc
    console.log("No result");
    return;
  }
  console.log(result);
});
```

Output:

    floobits-sublime (11 stars 213 forks) Floobits real-time collaboration plugin for Sublime Text 2 and 3
