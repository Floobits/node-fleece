"use strict";

const url = require("url");
const util = require("util");

const cheerio = require("cheerio");
let request = require("request");

const registered_domains = {};

const max_req_len = 1000000; // 1MB

request = request.defaults({
  sendImmediately: true,
  timeout: 10000,
  headers: {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/67.0.3396.62 Safari/537.36",
    "Accept" :"text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.8",
    "Cache-Control": "max-age=0",
  }
});

// Modified/extended version of Cheerio's elems.text()
function textify(elems, filter, sep) {
  sep = sep || "";
  let ret = "";
  elems = filter(elems);
  const len = elems.length;

  for (let i = 0; i < len; i++) {
    let elem = elems[i];
    if (elem.type === "text") {
      ret += elem.data + sep;
    } else if (elem.children && elem.type !== "comment") {
      if (elem.name === "img" && elem.attribs.alt && elem.attribs.alt.length < 3) {
        // Javascript strings are UCS-2 or whatever, so it counts one emoji as 2ish chars
        ret += elem.attribs.alt;
      } else {
        ret += textify(elem.children, filter, sep);
      }
    }
  }

  return ret;
}

function parse_generic(url_path, $) {
  let title = $("html head title").text();

  if (title.length > 100) {
    title = title.slice(0, 100);
    title += "...";
  }

  return title;
}

function parse_github(url_path, $) {
  if (url_path.match("^\\/[\\w-]+\\/[\\w-]+\\/?$") === null) {
    return parse_generic(url_path, $);
  }

  let ul = $("ul.pagehead-actions > li > a.js-social-count");
  const stargazers = $(ul[0]).text().replace(/\s/g, "");
  ul = $("ul.pagehead-actions > li > a.social-count");
  let forks = $(ul[2]).text().replace(/\s/g, "");
  // Horrible hack. Github sometimes switches the order of these.
  if (forks === stargazers) {
    forks = $(ul[1]).text().replace(/\s/g, "");
  }
  const description = $("div.repository-meta").text().trim();
  const name = $("h1.public > strong > a").text();
  if (name) {
    return util.format("%s (%s stars %s forks) %s", name, stargazers, forks, description);
  }
  return parse_generic(url_path, $);
}

function parse_hn(url_path, $) {
  if (url_path.match("^\\/item\\?id=\\d+") === null) {
    return parse_generic(url_path, $);
  }
  const title = $(".title > a");
  let subtext = $(".subtext").text().replace(/\s+/g, " ");
  const href = title.attr("href");
  if (title.text() && subtext && href) {
    subtext = subtext.replace(/\| hide \| past \| web /g, "");
    subtext = subtext.replace(/\| favorite/g, "");
    return util.format("%s (%s) %s", title.text(), href, subtext);
  }
  return parse_generic(url_path, $);
}

function parse_reddit(url_path, $) {
  if (url_path.match("^\\/r\\/\\w+\\/comments/\\d+") === null) {
    return parse_generic(url_path, $);
  }
  const thing = $("#siteTable div.thing");
  let href = thing.attr("data-url");
  const author = thing.attr("data-author");
  const title = $("#siteTable div.thing div.entry p.title a.title").text();
  const time = $("#siteTable div.thing div.entry p.tagline time").text();
  const comments = $("#siteTable div.thing div.entry ul li.first a.comments").text();
  const score = $("#siteTable div.thing div.unvoted div.score.unvoted").text();

  if (title && time && comments && score) {
    const parsed_url = url.parse(href);
    // debugger;
    if (parsed_url.host) {
      href = util.format("(%s) ", href);
    } else {
      href = "";
    }
    return util.format("%s %s| submitted %s by %s | %s points, %s", title, href, time, author, score, comments);
  }
  return parse_generic(url_path, $);
}

function parse_twitter(url_path, $) {
  const matches = new RegExp("^\\/(\\w+)\\/status\\/\\d+").exec(url_path);
  if (!matches) {
    return parse_generic(url_path, $);
  }
  const username = matches[1];
  const title = textify($("div.permalink-tweet-container p.tweet-text"), function (elems) {
    return elems = $(elems).not(".invisible");
  }, " ");
  const retweets = $("div.tweet-stats-container > ul.stats > li.js-stat-count.js-stat-retweets.stat-count > a > strong").text().replace(/\s/g, "");
  const favorites = $("div.tweet-stats-container > ul.stats > li.js-stat-count.js-stat-favorites.stat-count > a > strong").text().replace(/\s/g, "");

  return util.format("<@%s> %s (%s retweets, %s favorites)", username, title, retweets || 0, favorites || 0);
}

// eslint-disable-next-line no-unused-vars
function parse_youtube(url_path, $) {
  // Durations are ISO 8601 format: "PT48M42S"
  const duration_regex = /^PT(?:(\d+)H)?(?:(\d+)M)?(\d+)S$/;

  if (url_path.match("^\\/watch") === null) {
    return parse_generic(url_path, $);
  }

  // TODO: only do this for paths that make sense
  const title = $("meta[itemprop=name]").attr("content");
  const views = $("#watch7-views-info > div.watch-view-count").text().split(" ")[0] || 0;
  let likes = $("#watch-header .like-button-renderer span.yt-uix-button-content").first().text().replace(/[\s,]/g, "") || 0;
  let dislikes = $("#watch-header .like-button-renderer span.yt-uix-button-content").get(3);
  dislikes = $(dislikes).text().replace(/[\s,]/g, "") || 0;
  likes = parseInt(likes, 10);
  dislikes = parseInt(dislikes, 10);
  const rating = Math.round(100 * likes / (likes + dislikes));
  let duration = $("meta[itemprop=duration]").attr("content");
  let matches = duration_regex.exec(duration);
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
    if (matches.minutes < 10) {
      matches.minutes = "0" + matches.minutes;
    }
    if (matches.seconds < 10) {
      matches.seconds = "0" + matches.seconds;
    }
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
  // This can throw. Caught in describe_url()
  const $ = cheerio.load(body);

  const parsed_url = url.parse(msg_url);
  // So hacky
  const domain = parsed_url.hostname.split(".").slice(-2).join(".");
  const f = registered_domains[domain];
  let title;
  if (f) {
    title = f(parsed_url.path, $);
  } else {
    title = parse_generic(parsed_url.path, $);
  }

  return title.replace(/[\r\n]/g, " ").trim();
}

function describe_url(msg_url, cb) {
  let req_len = 0;
  const req = request.get(msg_url, function (err, response, body) {
    if (err) {
      return cb(err, body || response);
    }

    let title;
    if (response.statusCode >= 400) {
      title = util.format("%s", response.statusCode);
      return cb(null, title);
    }

    if (!body) {
      return cb("No body in response", response);
    }

    try {
      title = parse(msg_url, body);
    } catch (e) {
      return cb(e, title);
    }

    return cb(null, title);
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
register("reddit.com", parse_reddit);
register("mobile.twitter.com", parse_generic);
register("twitter.com", parse_twitter);
// Disabled now that YouTube changed their HTML.
// register("youtube.com", parse_youtube);

module.exports = {
  describe_url: describe_url,
  parse: parse,
  parse_generic: parse_generic,
  register: register,
};
