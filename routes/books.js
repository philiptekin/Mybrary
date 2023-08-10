const express = require("express");
const router = express.Router();
const Book = require("../models/book");
const Author = require("../models/author");

const imageMimeTypes = ["image/jpeg", "image/png", "image.gif"]; // Acceptable image types

// All Books route
router.get("/", async (req, res) => {
  let query = Book.find();
  // Filters for our search method for books, if we have filled in a filter then we query for that filter
  if (req.query.title != null && req.query.title != "") {
    query = query.regex("title", new RegExp(req.query.title), "i"); // Define query for database, look for all books containing the conditions in the database
  }
  if (req.query.publishedBefore != null && req.query.publishedBefore != "") {
    query = query.lte("publishDate", req.query.publishedBefore); // lte means less than or equal to
  }
  if (req.query.publishedAfter != null && req.query.publishedAfter != "") {
    query = query.gte("publishDate", req.query.publishedAfter); // gte means greater than or equal to
  }
  try {
    const books = await query.exec(); // Wait to execute query
    if (req.user) {
      res.render("books/index", {
        books: books,
        searchOptions: req.query,
        user: req.user,
      });
    } else {
      res.render("books/index", { books: books, searchOptions: req.query });
    }
  } catch {
    res.redirect("/");
  }
});

// New Book route
router.get("/new", checkIfAuthenticated, async (req, res) => {
  if (req.user) {
    renderNewPage(res, req, new Book(), false, true);
  } else {
    renderNewPage(res, req, new Book(), false, false);
  }
});

// Create Book route
router.post("/", async (req, res) => {
  const book = new Book({
    title: req.body.title,
    author: req.body.author,
    publishDate: new Date(req.body.publishDate),
    pageCount: req.body.pageCount,
    description: req.body.description,
  });
  saveCover(book, req.body.cover);
  try {
    const newBook = await book.save();
    res.redirect(`books/${newBook.id}`);
  } catch {
    if (req.user) {
      renderNewPage(res, req, Book(), true, true);
    } else {
      renderNewPage(res, req, Book(), true, false);
    }
  }
});

// Edit Book Route
router.get("/:id/edit", async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    if (req.user) {
      renderEditPage(res, req, book, false, true);
    } else {
      renderEditPage(res, req, book, false, false);
    }
  } catch {
    res.redirect("/");
  }
});

// Show Book Route
router.get("/:id", async (req, res) => {
  try {
    // Populate looks for author info on the page and sends it here
    const book = await Book.findById(req.params.id).populate("author").exec();
    if (req.user) {
      res.render("books/show", { book: book, user: req.user });
    } else {
      res.render("books/show", { book: book });
    }
  } catch {
    res.redirect("/");
  }
});

// Update Book Route
router.put("/:id", async (req, res) => {
  let book;

  try {
    book = await Book.findById(req.params.id);
    book.title = req.body.title;
    book.author = req.body.author;
    book.publishDate = new Date(req.body.publishDate);

    book.pageCount = req.body.pageCount;
    book.description = req.body.description;
    // Only want to edit cover if user puts in a new cover in edit
    if (req.body.cover != null && req.body.cover !== "") {
      saveCover(book, req.body.cover);
    }
    await book.save();
    res.redirect(`/books/${book.id}`);
  } catch {
    if (book != null) {
      if (req.user) {
        renderEditPage(res, req, book, true, true);
      } else {
        renderEditPage(res, req, book, true, false);
      }
    } else {
      res.redirect("/");
    }
  }
});

// Delete Book Page
router.delete("/:id", async (req, res) => {
  let book;
  try {
    book = await Book.findById(req.params.id);
    await book.deleteOne();
    res.redirect("/books");
  } catch {
    if (book != null) {
      if (req.user) {
        res.render("books/show", {
          book: book,
          errorMessage: "Could not remove book",
          user: req.user,
        });
      } else {
        res.render("books/show", {
          book: book,
          errorMessage: "Could not remove book",
        });
      }
    } else {
      res.redirect("/");
    }
  }
});

// Render New Page For Book
async function renderNewPage(res, req, book, hasError = false, hasUser) {
  renderFormPage(res, req, book, "new", hasError, hasUser);
}

// Render Edit Page For Book
async function renderEditPage(res, req, book, hasError = false, hasUser) {
  renderFormPage(res, req, book, "edit", hasError, hasUser);
}

// Form Used By Previous Functions To Render Pages
async function renderFormPage(res, req, book, form, hasError = false, hasUser) {
  try {
    const authors = await Author.find({}); // wait to find all authors in db
    const params = { authors: authors, book: book };
    if (hasError) {
      if (form === "edit") {
        params.errorMessage = "Error Updating Book";
      } else {
        params.errorMessage = "Error Creating Book";
      }
    }
    // If user is authenticated then send user
    if (hasUser) {
      params.user = req.user;
    }
    res.render(`books/${form}`, params);
  } catch {
    res.redirect("/books");
  }
}

// Saves Cover Of A Book
function saveCover(book, coverEncoded) {
  if (coverEncoded == null || coverEncoded === "") return;
  const cover = JSON.parse(coverEncoded);
  if (cover != null && imageMimeTypes.includes(cover.type)) {
    book.coverImage = new Buffer.from(cover.data, "base64"); // Convert from base64
    book.coverImageType = cover.type;
  }
}

function checkIfAuthenticated(req, res, next) {
  if (!req.isAuthenticated()) {
    return res.redirect("/");
  }
  next();
}

module.exports = router;
