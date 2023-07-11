// if we are not in development enviorenment then load the env variables
if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

// Libraries
const express = require("express");
const app = express();
const expressLayouts = require("express-ejs-layouts");
const bodyParser = require("body-parser"); // needed for parsing info from forms

// Routes
const indexRouter = require("./routes/index");
const authorRouter = require("./routes/authors");
const bookRouter = require("./routes/books");

// Set and use
app.set("view engine", "ejs"); // set view engine
app.set("views", __dirname + "/views"); // directs all views to the views folder
app.set("layout", "layouts/layout"); // every single file is put in the layout file so we don't have to duplicate header and footer html files
app.use(expressLayouts); // use expresslayouts
app.use(express.static("public")); // folder for static files
app.use(bodyParser.urlencoded({ limit: "10mb", extended: false })); // we increased limit of what we can parse from body and we allow body parsing

// Database connection
const mongoose = require("mongoose");
mongoose.connect(process.env.DATABASE_URL, { useNewUrlParser: true }); // set to true so we enable newer way of gathering data, might not be necessary but just in case
const db = mongoose.connection;
db.on("error", (error) => console.error(error));
db.once("open", () => console.log("Connected to Mongoose"));

// Use routes
app.use("/", indexRouter);
app.use("/authors", authorRouter);
app.use("/books", bookRouter);

// Use server port or 3000
app.listen(process.env.PORT || 3000);
