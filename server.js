//Dependencies

var express = require("express");
var exphbs = require('express-handlebars');
var logger = require("morgan");

var mongoose = require ("mongoose");
// Our scraping tools
// Axios is a promised-based http library, similar to jQuery's Ajax method
// It works on the client and on the server
var cheerio = require("cheerio");
var axios = require("axios");
var bodyParser = require("body-parser")

// Require all models
var db = require("./models");

// Initialize Express
var app = express();

//Configure middleware
// Use morgan logger for logging requests
app.use(logger("dev"));

// Parse request body as JSON
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Serve static content for the app from the "public" directory in the application directory.
app.use(express.static("public"));

//set handlebars
app.engine("handlebars", exphbs({ defaultLayout: "main" }));
app.set("view engine", "handlebars");

// If deployed, use the deployed database. Otherwise use the local mongoHeadlines database
var MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost/mongoHeadlines";

mongoose.connect(MONGODB_URI);

//Routes

// // Database configuration
// var databaseUrl = "scrape";
// var collections = ["scrapeData"];

// // Hook mongojs configuration to the db variable
// var db = mongojs(databaseUrl, collections);
// db.on("error", function (error) {
//     console.log("Database Error:", error);
// });

// // Main route (simple Hello World Message)
// app.get("/", function (req, res) {
//     res.send("Hello world");
// });

// // Retrieve data from the db
// app.get("/all", function (req, res) {
//     // Find all results from the scrapedData collection in the db
//     db.scrapedData.find({}, function (error, found) {
//         // Throw any errors to the console
//         if (error) {
//             console.log(error);
//         }
//         // If there are no errors, send the data to the browser as json
//         else {
//             res.json(found);
//         }
//     });
// });

// Scrape data from one site and place it into the mongodb db
app.get("/scrape", function (req, res) {
    // Make a request via axios for the news section of `ycombinator`
    axios.get("https://www.nytimes.com/").then(function (response) {
        // Load the html body from axios into cheerio
        
        var $ = cheerio.load(response.data);
        // For each element with a "title" class
        $(".assetWrapper").each(function (i, element) {
            var result = {};
            // Save the text and href of each link enclosed in the current element
            title = $(this).find("h2").text().trim();
            // console.log(title);
            link = $(this).find("a").attr("href").trim();
            // console.log(link);
            image = $(this).find("img").attr("src")
            // console.log(image);
            summary = $(this).find("p").text().trim();
            // console.log(summary);

            // If this found element had both a title and a link
            if (title && link && image && summary) {
                // Insert the data in the scrapedData db
                db.Article.create({
                    title: title,
                    link: "www.nytimes.com" + link,
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

// Route for getting all Articles from the db
app.get("/articles", function (req, res) {
    // Grab every document in the Articles collection
    db.Article.find({})
        .then(function (dbArticle) {
            // If we were able to successfully find Articles, send them back to the client
            res.json(dbArticle);
        })
        .catch(function (err) {
            // If an error occurred, send it to the client
            res.json(err);
        });
});

// Route for grabbing a specific Article by id, populate it with it's note
app.get("/articles/:id", function (req, res) {
    // Using the id passed in the id parameter, prepare a query that finds the matching one in our db...
    db.Article.findOne({ _id: req.params.id })
        // ..and populate all of the notes associated with it
        .populate("note")
        .then(function (dbArticle) {
            // If we were able to successfully find an Article with the given id, send it back to the client
            res.json(dbArticle);
        })
        .catch(function (err) {
            // If an error occurred, send it to the client
            res.json(err);
        });
});

// Route for saving/updating an Article's associated Note
app.post("/articles/:id", function (req, res) {
    // Create a new note and pass the req.body to the entry
    db.Note.create(req.body)
        .then(function (dbNote) {
            // If a Note was created successfully, find one Article with an `_id` equal to `req.params.id`. Update the Article to be associated with the new Note
            // { new: true } tells the query that we want it to return the updated User -- it returns the original by default
            // Since our mongoose query returns a promise, we can chain another `.then` which receives the result of the query
            return db.Article.findOneAndUpdate({ _id: req.params.id }, { note: dbNote._id }, { new: true });
        })
        .then(function (dbArticle) {
            // If we were able to successfully update an Article, send it back to the client
            res.json(dbArticle);
        })
        .catch(function (err) {
            // If an error occurred, send it to the client
            res.json(err);
        });
});


// Listen on port 3000
app.listen(3000, function () {
    console.log("App running on port 3000!");
});

