const express = require('express');
const router = express.Router();
const reviewsController = require('../controllers/reviewsController');
const isAuthenticated = require('../middleware/authenticate');

router.get('/', reviewsController.getAll);
router.get('/:id', reviewsController.getSingle);
router.post('/', isAuthenticated, reviewsController.createReview);
router.put('/:id', isAuthenticated, reviewsController.updateReview);
router.delete('/:id', isAuthenticated, reviewsController.deleteReview);

module.exports = router;