/*jslint indent: 2, node: true, nomen: true, plusplus: true, todo: true */
"use strict";

var url = require("url");
var util = require("util");

var _ = require("lodash");
var cheerio = require("cheerio");
var log = require("floorine");
var request = require("request");

var registered_domains = [];

const max_req_len = 1000000; // 1MB

request = request.defaults({
  sendImmediately: true,
  timeout: 10000,
  headers: {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10_1) AppleWebKit/600.2.5 (KHTML, like Gecko) Version/8.0.2 Safari/600.2.5"
  }
});

function parse_generic(url_path, $) {
  var title = $("html head title").text();

  if (title.length > 100) {
    title = title.slice(0, 100);
    title += "...";
  }

  return title;
}

function parse_github(url_path, $) {
  var description,
    forks,
    name,
    stargazers,
    ul;

  if (url_path.match("^\\/\\w+\\/\\w+\\/?$") === null) {
    return parse_generic(url_path, $);
  }

  ul = $("ul.pagehead-actions > li > a.social-count");
  stargazers = $(ul[0]).text().replace(/\s/g, "");
  forks = $(ul[1]).text().replace(/\s/g, "");
  description = $("div.repository-description").text().trim();
  name = $("a.js-current-repository").text();
  if (name) {
    return util.format("%s (%s stars %s forks) %s", name, stargazers, forks, description);
  }
  return parse_generic(url_path, $);
}

function parse_hn(url_path, $) {
  var href,
    subtext,
    title;

  if (url_path.match("^\\/item\\?id=\\d+") === null) {
    return parse_generic(url_path, $);
  }
  title = $(".title > a");
  subtext = $(".subtext").text();
  href = title.attr("href");
  if (title.text() && subtext && href) {
    return util.format("%s (%s) %s", title.text(), href, subtext);
  }
  return parse_generic(url_path, $);
}

function parse_twitter(url_path, $) {
  var username,
    title,
    retweets,
    favorites;

  if (url_path.match("^\\/\\w+\\/status\\/\\d+") === null) {
    return parse_generic(url_path, $);
  }

  // TODO: only do this for paths that make sense
  username = $("div.permalink-tweet-container div.permalink-header a > span.username.js-action-profile-name > b").text();
  title = $("div.permalink-tweet-container p.tweet-text").text();
  retweets = $("div.tweet-stats-container > ul.stats > li.js-stat-count.js-stat-retweets.stat-count > a > strong").text().replace(/\s/g, "");
  favorites = $("div.tweet-stats-container > ul.stats > li.js-stat-count.js-stat-favorites.stat-count > a > strong").text().replace(/\s/g, "");

  return util.format("<@%s> %s (%s retweets, %s favorites)", username, title, retweets || 0, favorites || 0);
}

function parse_youtube(url_path, $) {
  var dislikes,
    duration,
    // Durations are ISO 8601 format: "PT48M42S"
    duration_regex = /^PT(?:(\d+)H)?(?:(\d+)M)?(\d+)S$/,
    likes,
    matches,
    rating,
    title,
    views;

  if (url_path.match("^\\/watch") === null) {
    return parse_generic(url_path, $);
  }

  // TODO: only do this for paths that make sense
  title = $("meta[itemprop=name]").attr("content");
  views = $("#watch7-views-info > div.watch-view-count").text().split(" ")[0] || 0;
  likes = $("#watch-like > span.yt-uix-button-content").text().replace(/[\s,]/g, "") || 0;
  dislikes = $("#watch-dislike > span.yt-uix-button-content").text().replace(/[\s,]/g, "") || 0;
  likes = parseInt(likes, 10);
  dislikes = parseInt(dislikes, 10);
  rating = Math.round(100 * likes / (likes + dislikes));
  duration = $("meta[itemprop=duration]").attr("content");
  matches = duration_regex.exec(duration);
  if (matches) {
    matches = {
      hours: parseInt(matches[1], 10),
      minutes: parseInt(matches[2], 10),
      seconds: parseInt(matches[3], 10),
    };
    // Youtube often sets hours to zero and minutes to >= 60
    if (matches.minutes >= 60) {
      matches.hours = Math.floor(matches.minutes / 60);
      matches.minutes = matches.minutes % 60;
    }
    _.each(matches, function (v, k) {
      if (k === "hours" || v >= 10) {
        return;
      }
      matches[k] = "0" + v;
    });
    duration = util.format("%s:%s", matches.minutes, matches.seconds);
    if (matches.hours) {
      duration = util.format("%s:%s", matches.hours, duration);
    }
  } else {
    duration = "";
  }
  return util.format("%s %s %s views %s%% like", title, duration, views, rating);
}

function parse(msg_url, body) {
  var domain,
    f,
    parsed_url,
    title,
    $;

  try {
    $ = cheerio.load(body);
  } catch (e) {
    log.error("Error loading response from %s: %s", msg_url, e.toString());
    return null;
  }

  parsed_url = url.parse(msg_url);
  // So hacky
  domain = parsed_url.hostname.split(".").slice(-2).join(".");
  f = registered_domains[domain];
  if (f) {
    title = f(parsed_url.path, $);
  } else {
    title = parse_generic(parsed_url.path, $);
  }

  return title.replace(/[\r\n]/g, " ").trim();
}

function get_url_msg(msg_url, cb) {
  let req_len = 0;
  let req = request.get(msg_url, function (err, response, body) {
    var title, processed_title;

    if (err || !body) {
      return cb(err, response);
    }

    if (response.statusCode >= 400) {
      title = util.format("%s", response.statusCode);
    } else {
      title = parse(msg_url, body);
    }

    if (!title) {
      return cb(null, title);
    }

    processed_title = "    \u001F" + title;
    return cb(null, processed_title);
  });
  req.on("data", function (d) {
    req_len += d.length;
    if (req_len > max_req_len) {
      req.destroy();
    }
  });
}

function register(domain, f) {
  registered_domains[domain] = f;
}

register("github.com", parse_github);
register("ycombinator.com", parse_hn);
register("twitter.com", parse_twitter);
register("youtube.com", parse_youtube);

module.exports = {
  get_url_msg: get_url_msg,
  parse: parse,
  parse_generic: parse_generic,
  register: register,
};
