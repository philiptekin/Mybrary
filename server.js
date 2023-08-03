// if we are in development enviorenment then load the env variables
if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

// Libraries
const express = require("express");
const app = express();
const expressLayouts = require("express-ejs-layouts");
const bodyParser = require("body-parser"); // needed for parsing info from forms
const methodOverride = require("method-override"); // needed for delete and put for author with form
const User = require("./models/user");
const bcrypt = require("bcrypt");

// Passport libraries
const flash = require("express-flash");
const session = require("express-session");
const passport = require("passport");

// Routes
const indexRouter = require("./routes/index");
const authorRouter = require("./routes/authors");
const bookRouter = require("./routes/books");

// Database connection
const mongoose = require("mongoose");
mongoose.connect(process.env.DATABASE_URL, { useNewUrlParser: true }); // set to true so we enable newer way of gathering data, might not be necessary but just in case
const db = mongoose.connection;
db.on("error", (error) => console.error(error));
db.once("open", () => console.log("Connected to Mongoose"));

// Passport initialize
const initializePassport = require("./passport-config");
initializePassport(
  passport,
  async (name) => {
    return await User.findOne({ name: name });
  },
  async (id) => {
    const user = await User.findById(id);
    return user;
  }
);

// Set and use
app.set("view engine", "ejs"); // set view engine
app.set("views", __dirname + "/views"); // directs all views to the views folder
app.set("layout", "layouts/layout"); // every single file is put in the layout file so we don't have to duplicate header and footer html files
app.use(expressLayouts); // use expresslayouts
app.use(express.static("public")); // folder for static files
app.use(bodyParser.urlencoded({ limit: "10mb", extended: false })); // we increased limit of what we can parse from body and we allow body parsing
app.use(methodOverride("_method")); // use _ and the method so either delete or put
app.use(flash());
// Resave : should we resave our session variables if nothing is changed?
// Saveuninitialised: do we save empty values?
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
  })
);
app.use(passport.initialize());
app.use(passport.session());

// Use routes
app.use("/", indexRouter);
app.use("/authors", authorRouter);
app.use("/books", bookRouter);

// Login routes
app.get("/login", checkNotAuthenticated, (req, res) => {
  res.render("login/index");
});

// Login routes
app.get("/login/profile", (req, res) => {
  res.render("login/profile", { user: req.user });
});

app.get("/logout", (req, res) => {
  if (req.user) {
    req.logout(function (err) {
      if (err) {
        return next(err);
      }
      res.redirect("/");
    });
  } else {
    res.redirect("/");
  }
});

app.post(
  "/login",
  passport.authenticate("local", {
    successRedirect: "/login/profile",
    failureRedirect: "/login",
    failureFlash: true,
  })
);

// Register routes
app.get("/register", checkNotAuthenticated, (req, res) => {
  res.render("register/index");
});

app.post("/register", checkNotAuthenticated, async (req, res) => {
  const user = new User({
    name: req.body.name,
    password: req.body.password,
    admin: false,
  });
  if (user.password.length < 6) {
    res.render("register/index", {
      errorMessage: "Password need to be atleast 6 characters",
    });
    return;
  }
  if (user.name.length > 10) {
    res.render("register/index", {
      errorMessage: "Name cannot be longer than 10 characters",
    });
    return;
  }
  try {
    const tempUser = await User.findOne({ name: user.name }).exec();
    if (tempUser != null) {
      res.render("register/index", { errorMessage: "Name already used" });
    } else {
      // Create hashed password and save the user, redirect to login page
      user.password = await bcrypt.hash(user.password, 10);
      await user.save();
      res.redirect("/login");
    }
  } catch {
    res.render("register/index", { errorMessage: "Failed to create user" });
  }
});

function checkNotAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return res.redirect("/");
  }
  next();
}

// Use server port or 3000
app.listen(process.env.PORT || 3000);
