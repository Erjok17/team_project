const express = require('express');
const router = express.Router();
const booksController = require('../controllers/booksController');
const isAuthenticated = require('../middleware/authenticate');

// Routes (No @swagger annotations needed)
router.get('/', booksController.getAll);
router.get('/:id', booksController.getSingle);
router.post('/', isAuthenticated, booksController.createBook);
router.put('/:id', isAuthenticated, booksController.updateBook);
router.delete('/:id', isAuthenticated, booksController.deleteBook);

module.exports = router;