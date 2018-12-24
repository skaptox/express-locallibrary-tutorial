/* eslint-disable func-names */
const { body, validationResult } = require('express-validator/check');
const { sanitizeBody } = require('express-validator/filter');
const BookInstance = require('../models/bookinstance');
const Book = require('../models/book');

exports.bookinstance_list = function (req, res, next) {
  BookInstance.find()
    .populate('book')
    .exec((err, list_bookinstances) => {
      if (err) {
        return next(err);
      }
      // Successful, so render
      res.render('bookinstance_list', {
        title: 'Book Instance List',
        bookinstance_list: list_bookinstances
      });
    });
};

// Display detail page for a specific BookInstance.
exports.bookinstance_detail = function (req, res, next) {
  BookInstance.findById(req.params.id)
    .populate('book')
    .exec((err, bookinstance) => {
      if (err) {
        return next(err);
      }
      if (bookinstance == null) {
        // No results.
        var err = new Error('Book copy not found');
        err.status = 404;
        return next(err);
      }
      // Successful, so render.
      res.render('bookinstance_detail', { title: 'Book:', bookinstance });
    });
};

// Display BookInstance create form on GET.
exports.bookinstance_create_get = function (req, res, next) {
  Book.find({}, 'title').exec((err, books) => {
    if (err) {
      return next(err);
    }
    // Successful, so render.
    res.render('bookinstance_form', { title: 'Create BookInstance', book_list: books });
  });
};

// Handle BookInstance create on POST.
exports.bookinstance_create_post = [
  // Validate fields.
  body('book', 'Book must be specified')
    .isLength({ min: 1 })
    .trim(),
  body('imprint', 'Imprint must be specified')
    .isLength({ min: 1 })
    .trim(),
  body('due_back', 'Invalid date')
    .optional({ checkFalsy: true })
    .isISO8601(),

  // Sanitize fields.
  sanitizeBody('book')
    .trim()
    .escape(),
  sanitizeBody('imprint')
    .trim()
    .escape(),
  sanitizeBody('status')
    .trim()
    .escape(),
  sanitizeBody('due_back').toDate(),

  // Process request after validation and sanitization.
  (req, res, next) => {
    // Extract the validation errors from a request.
    const errors = validationResult(req);

    // Create a BookInstance object with escaped and trimmed data.
    const bookinstance = new BookInstance({
      book: req.body.book,
      imprint: req.body.imprint,
      status: req.body.status,
      due_back: req.body.due_back
    });

    if (!errors.isEmpty()) {
      // There are errors. Render form again with sanitized values and error messages.
      Book.find({}, 'title').exec((err, books) => {
        if (err) {
          return next(err);
        }
        // Successful, so render.
        res.render('bookinstance_form', {
          title: 'Create BookInstance',
          book_list: books,
          selected_book: bookinstance.book._id,
          errors: errors.array(),
          bookinstance
        });
      });
      return;
    }
    // Data from form is valid.
    bookinstance.save((err) => {
      if (err) {
        return next(err);
      }
      // Successful - redirect to new record.
      res.redirect(bookinstance.url);
    });
  }
];

// Display Author delete form on GET.
exports.author_delete_get = function (req, res, next) {
  async.parallel(
    {
      author(callback) {
        Author.findById(req.params.id).exec(callback);
      },
      authors_books(callback) {
        Book.find({ author: req.params.id }).exec(callback);
      }
    },
    (err, results) => {
      if (err) {
        return next(err);
      }
      if (results.author == null) {
        // No results.
        res.redirect('/catalog/authors');
      }
      // Successful, so render.
      res.render('author_delete', {
        title: 'Delete Author',
        author: results.author,
        author_books: results.authors_books
      });
    }
  );
};

// Handle Author delete on POST.
exports.author_delete_post = function (req, res, next) {
  async.parallel(
    {
      author(callback) {
        Author.findById(req.body.authorid).exec(callback);
      },
      authors_books(callback) {
        Book.find({ author: req.body.authorid }).exec(callback);
      }
    },
    (err, results) => {
      if (err) {
        return next(err);
      }
      // Success
      if (results.authors_books.length > 0) {
        // Author has books. Render in same way as for GET route.
        res.render('author_delete', {
          title: 'Delete Author',
          author: results.author,
          author_books: results.authors_books
        });
      } else {
        // Author has no books. Delete object and redirect to the list of authors.
        Author.findByIdAndRemove(req.body.authorid, (err) => {
          if (err) {
            return next(err);
          }
          // Success - go to author list
          res.redirect('/catalog/authors');
        });
      }
    }
  );
};

// Display BookInstance update form on GET.
exports.bookinstance_update_get = function (req, res) {
  res.send('NOT IMPLEMENTED: BookInstance update GET');
};

// Handle bookinstance update on POST.
exports.bookinstance_update_post = function (req, res) {
  res.send('NOT IMPLEMENTED: BookInstance update POST');
};
