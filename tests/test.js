/*jslint indent: 2, node: true, nomen: true, plusplus: true, todo: true */
"use strict";

var fleece = require("../lib/fleece");

let msg_url = "https://github.com/Floobits/floobits-sublime";

fleece.get_url_msg(msg_url, function (err, result) {
  if (err) {
    console.error("URL %s error: %s", msg_url, err);
    return;
  }
  if (!result) {
    console.log("URL %s: No result", msg_url);
    return;
  }
  console.log(result);
});
