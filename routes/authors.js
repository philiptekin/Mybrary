const express = require("express");
const author = require("../models/author");
const router = express.Router();
const Author = require("../models/author");
const Book = require("../models/book");
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

// Create Author
router.post("/", async (req, res) => {
  const author = new Author({
    name: req.body.name,
  });
  try {
    const newAuthor = await author.save(); // wait for asyncronous mongoose save
    res.redirect(`authors/${newAuthor.id}`);
  } catch {
    res.render("authors/new", {
      author: author,
      errorMessage: "Error creating Author",
    });
  }
});

// View author
router.get("/:id", async (req, res) => {
  try {
    const author = await Author.findById(req.params.id);
    const books = await Book.find({ author: author.id }).limit(6).exec(); // Show max 6 author books
    res.render("authors/show", { author: author, booksByAuthor: books });
  } catch {
    res.redirect("/");
  }
});

// Edit author
router.get("/:id/edit", async (req, res) => {
  const author = await Author.findById(req.params.id);
  try {
    res.render("authors/edit", { author: author });
  } catch {
    res.redirect("/authors");
  }
});

// Update author
router.put("/:id", async (req, res) => {
  let author;
  try {
    author = await Author.findById(req.params.id);
    author.name = req.body.name;
    await author.save();
    res.redirect(`/authors/${author.id}`);
  } catch {
    if (author == null) {
      // if we dont find author in try
      res.redirect("/"); // Redirect to home page
    } else {
      res.render("authors/edit", {
        author: author,
        errorMessage: "Error updating Author",
      });
    }
  }
});

// Delete Author
router.delete("/:id", async (req, res) => {
  let author;
  try {
    author = await Author.findById(req.params.id); // Find author

    await author.deleteOne(); // Remove from database

    res.redirect(`/authors`);
  } catch {
    if (author == null) {
      // if we dont find author in try
      res.redirect("/"); // Redirect to home page
    } else {
      res.redirect(`/authors/${author.id}`);
    }
  }
});

module.exports = router;
