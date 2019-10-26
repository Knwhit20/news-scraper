//Dependencies
//express
var express = require("express");
//express-handlebars

//mongoose
var mongojs = require("mongojs");
//cheerio
var cheerio = require("cheerio");
//axios
var axios = require("axios");

// Initialize Express
var app = express();

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

