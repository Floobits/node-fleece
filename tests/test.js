/*jslint indent: 2, node: true, nomen: true, plusplus: true, todo: true */
"use strict";

var log = require("floorine");

var fleece = require("../lib/fleece");

let msg_url = "https://github.com/Floobits/fleece";

fleece.get_url_msg(msg_url, function (err, result) {
  if (err) {
    log.warn("URL %s error: %s", msg_url, err);
    return;
  }
  if (!result) {
    log.log("URL %s: No result", msg_url);
    return;
  }
  log.log(result);
});
