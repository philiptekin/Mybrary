const express = require("express");
const author = require("../models/author");
const router = express.Router();
const Author = require("../models/author");
// All authors route
router.get("/", async (req, res) => {
  let searchOptions = {}; // search list created
  if (req.query.name !== null && req.query.name !== "") {
    //if we have a name from database
    searchOptions.name = new RegExp(req.query.name, "i"); // regexp lets us look if the letters are contained in that order for any word in database, 'i' means case insensitive
  }
  try {
    const authors = await Author.find(searchOptions); //empty javascript object means select all from table
    res.render("authors/index", { authors: authors, searchOptions: req.query });
  } catch {
    res.redirect("/");
  }
});

// New author route
router.get("/new", (req, res) => {
  res.render("authors/new", { author: new Author() });
});

router.post("/", async (req, res) => {
  const author = new Author({
    name: req.body.name,
  });
  try {
    const newAuthor = await author.save(); // wait for asyncronous mongoose save
    //res.redirect(`authors/${newAuthor.id}`);
    res.redirect("authors");
  } catch {
    res.render("authors/new", {
      author: author,
      errorMessage: "Error creating Author",
    });
  }
});

module.exports = router;
