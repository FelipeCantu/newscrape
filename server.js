const mongoose = require('mongoose');
const express = require('express');
const logger = require('morgan'); //FloorGang !!!!

var app = express();

app.use(logger('dev'));
app.use(express.urlencoded({extended: true}));
app.use(express.json());
app.use(express.static('public'));

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost/scraper_news";
mongoose.connect(MONGODB_URI, {useNewUrlParser: true });

var db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", function () {
    console.log("Connected to Mongoose!");
});


var exphbs = require('express-handlebars');

app.engine('handlebars', exphbs({defaultLayout: 'main'}));
app.set('view engine', 'handlebars');

var routes = require('./controller/controller.js');
app.use(routes);

var port = process.env.PORT || 5000;
app.listen(port, function() {
  console.log('Listening to port' + port);
})