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
          message: 'Book validation failed', // Updated
          data: err
        });
      } else {
        next();
      }
    });
  };
  
  module.exports = {
    saveUser,
    saveBook 
  };