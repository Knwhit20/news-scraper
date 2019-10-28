//Dependencies
//express
var express = require("express");
//express-handlebars
var exphbs = require('express-handlebars');
//mongoose
var mongojs = require("mongojs");
var mongoose = require ("mongoose");
//cheerio
var cheerio = require("cheerio");
//axios
var axios = require("axios");
var bodyParser = require("body-parser")

// Require all models
var db = require("./models");

// Initialize Express
var app = express();
// Serve static content for the app from the "public" directory in the application directory.
app.use(express.static("public"));

// Parse request body as JSON
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// // Import routes and give the server access to them.
// var routes = require("./public/app");

// app.use(routes);

//set handlebars
app.engine("handlebars", exphbs({ defaultLayout: "main" }));
app.set("view engine", "handlebars");

// If deployed, use the deployed database. Otherwise use the local mongoHeadlines database
var MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost/mongoHeadlines";

mongoose.connect(MONGODB_URI);

// Database configuration
var databaseUrl = "scrape";
var collections = ["scrapeData"];

// Hook mongojs configuration to the db variable
var db = mongojs(databaseUrl, collections);
db.on("error", function (error) {
    console.log("Database Error:", error);
});

// Main route (simple Hello World Message)
app.get("/", function (req, res) {
    res.send("Hello world");
});

// Retrieve data from the db
app.get("/all", function (req, res) {
    // Find all results from the scrapedData collection in the db
    db.scrapedData.find({}, function (error, found) {
        // Throw any errors to the console
        if (error) {
            console.log(error);
        }
        // If there are no errors, send the data to the browser as json
        else {
            res.json(found);
        }
    });
});

// Scrape data from one site and place it into the mongodb db
app.get("/scrape", function (req, res) {
    // Make a request via axios for the news section of `ycombinator`
    axios.get("https://www.nytimes.com/").then(function (response) {
        // Load the html body from axios into cheerio
        
        var $ = cheerio.load(response.data);
        // For each element with a "title" class
        $("article").each(function (i, element) {
            // Save the text and href of each link enclosed in the current element
            var title = $(element).children("h2").text();
            console.log(title);
            var link = $(element).children("a").attr("href");
            console.log(link);
            var image = $(element).parent("figure").children("img").attr("src")
            console.log(image);
            var summary = $(element).children("p").text();
            console.log(summary);

            // If this found element had both a title and a link
            if (title && link && image && summary) {
                // Insert the data in the scrapedData db
                db.scrapeData.insert({
                    title: title,
                    link: link,
                    image: image,
                    summary: summary
                },
                    function (err, inserted) {
                        if (err) {
                            // Log the error if one is encountered during the query
                            console.log(err);
                        }
                        else {
                            // Otherwise, log the inserted data
                            console.log(inserted);
                        }
                    });
            }
        });
    });

    // Send a "Scrape Complete" message to the browser
    res.send("Scrape Complete");
});


// Listen on port 3000
app.listen(3000, function () {
    console.log("App running on port 3000!");
});

