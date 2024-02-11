const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const MongoClient = require("mongodb").MongoClient;
const helmet = require("helmet");

const apiRoutes = require("./routes/api.js");
const fccTestingRoutes = require("./routes/fcctesting.js");
const runner = require("./test-runner");

const app = express();
const port = process.env.PORT || 3000;

app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"]
    }
  })
);

app.use("/public", express.static(process.cwd() + "/public"));

app.use(cors({ origin: "*" })); //For FCC testing purposes only

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

MongoClient.connect(
  process.env.DATABASE_URI,
  { useUnifiedTopology: true },
  (err, client) => {
    if (err) console.log(`Database error: ${err}`);

    const db = client.db("fcc-stock-price-checker");

    //Index page (static HTML)
    app.route("/").get(function(req, res) {
      res.sendFile(process.cwd() + "/views/index.html");
    });

    //For FCC testing purposes
    fccTestingRoutes(app);

    //Routing for API
    apiRoutes(app, db);

    //404 Not Found Middleware
    app.use(function(req, res, next) {
      res
        .status(404)
        .type("text")
        .send("Not Found");
    });

    //Start our server and tests!
    app.listen(port, function() {
      console.log(`Listening on port ${port}`);
      if (process.env.NODE_ENV === "test") {
        console.log("Running Tests...");
        setTimeout(function() {
          try {
            runner.run();
          } catch (e) {
            const error = e;
            console.log("Tests are not valid:");
            console.log(error);
          }
        }, 3500);
      }
    });
  }
);

module.exports = app; //for testing
