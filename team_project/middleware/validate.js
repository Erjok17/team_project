const validator = require('../helpers/validate');

const saveUser = (req, res, next) => {
  const validationRule = {
    firstName: 'required|string',
    lastName: 'required|string',
    email: 'required|email',
    role: 'string'
  };

  validator(req.body, validationRule, {}, (err, status) => {
    if (!status) {
      res.status(412).send({
        success: false,
        message: 'Validation failed',
        data: err
      });
    } else {
      next();
    }
  });
};

const saveBook = (req, res, next) => {
  const validationRule = {
    title: 'required|string|min:3',
    author: 'required|string',
    price: 'required|numeric|min:0',
    stock: 'numeric|min:0'
  };

  validator(req.body, validationRule, {}, (err, status) => {
    if (!status) {
      res.status(412).send({
        success: false,
        message: 'Book validation failed',
        data: err
      });
    } else {
      next();
    }
  });
};

const saveOrder = (req, res, next) => {
  const validationRule = {
    userId: 'required|string', // Will be converted to ObjectId in controller
    books: 'required|array|min:1',
    'books.*.bookId': 'required|string', // Each book item needs bookId
    'books.*.quantity': 'required|numeric|min:1',
    totalAmount: 'required|numeric|min:0',
    status: `required|string|in:pending,processing,shipped,delivered,cancelled`
  };

  validator(req.body, validationRule, {}, (err, status) => {
    if (!status) {
      res.status(412).send({
        success: false,
        message: 'Order validation failed',
        data: err
      });
    } else {
      next();
    }
  });
};

const saveReview = (req, res, next) => {
  const validationRule = {
    userId: 'required|string',
    bookId: 'required|string',
    rating: 'required|numeric|min:1|max:5',
    comment: 'string|max:500'
  };

  validator(req.body, validationRule, {}, (err, status) => {
    if (!status) {
      res.status(412).send({
        success: false,
        message: 'Review validation failed',
        data: err
      });
    } else {
      next();
    }
  });
};

module.exports = {
  saveUser,
  saveBook,
  saveOrder,
  saveReview
};