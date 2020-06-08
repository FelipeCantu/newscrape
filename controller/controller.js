const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
var db = require('../models/News');

var path = require('path');
var router = express.Router();

var Note = require('../models/notes.js');
var News = require('../models/News.js');

router.get('/', function (req, res) {
  res.redirect('/news');
})

router.get('/scrape', function (req, res) {
  axios.get('http://www.theverge.com').then(function (response) {
    var $ = cheerio.load(response);
    var titleArray = [];

    $('.c-entry-box--compact__title').each(function (i, element) {
      var results = {};

      results.title = $(this)
        .text();
      results.link = $(this)
        .children()
        .attr('href');
      // var title = $(element).text();
      // var link = $(element)
      //   .children()
      //   .attr('href');

      // News.create(results).then(function (dbNews) {
      //   console.log(dbNews);
      // }).catch(function (err) {
      //   console.log(err);
      // })


      if (results.title !== "" && results.link !== "") {
        if (titleArray.indexOf(results.title) == -1) {
          titleArray.push(results.title);

          News.count({ title: results.title }, function(err, test) {
            if (test === 0) {
              var entry = new News(results);

              entry.save(function(err, doc) {
                if (err) {
                  console.log(err);
                } else {
                  console.log(doc);
                }
              });
            }
          });
        } else {
          console.log("Article already exists.");
        }
      } else {
        console.log("Not saved to DB, missing data");
      }
    });
    res.redirect("/");
  });
});
router.get("/news", function(req, res) {
  News.find()
    .sort({ _id: -1 })
    .exec(function(err, doc) {
      if (err) {
        console.log(err);
      } else {
        var newsl = { news: doc };
        res.render("index", newsl);
      }
    });
});

router.get("/news-json", function(req, res) {
  News.find({}, function(err, doc) {
    if (err) {
      console.log(err);
    } else {
      res.json(doc);
    }
  });
});

router.get("/clearAll", function(req, res) {
  News.remove({}, function(err, doc) {
    if (err) {
      console.log(err);
    } else {
      console.log("removed all articles");
    }
  });
  res.redirect("/news-json");
});

router.get("/readNews/:id", function(req, res) {
  var newsId = req.params.id;
  var hbsObj = {
    news: [],
    body: []
  };

  News.findOne({ _id: newsId })
    .populate("comment")
    .exec(function(err, doc) {
      if (err) {
        console.log("Error: " + err);
      } else {
        hbsObj.news = doc;
        var link = doc.link;
        axios.get(link, function(error, response, html) {
          var $ = cheerio.load(html);

          $(".l-col__main").each(function(i, element) {
            hbsObj.body = $(this)
              .children(".c-entry-content")
              .children("a")
              .text();

            res.render("news", hbsObj);
            return false;
          });
        });
      }
    });
});
router.post("/comment/:id", function(req, res) {
  var user = req.body.name;
  var content = req.body.comment;
  var newsId = req.params.id;

  var commentObj = {
    name: user,
    body: content
  };

  var newComment = new Comment(commentObj);

  newComment.save(function(err, doc) {
    if (err) {
      console.log(err);
    } else {
      console.log(doc._id);
      console.log(newsId);

      News.findOneAndUpdate(
        { _id: req.params.id },
        { $push: { comment: doc._id } },
        { new: true }
      ).exec(function(err, doc) {
        if (err) {
          console.log(err);
        } else {
          res.redirect("/readNews/" + newsId);
        }
      });
    }
  });
});

module.exports = router;