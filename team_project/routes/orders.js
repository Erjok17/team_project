const express = require('express');
const router = express.Router();
const ordersController = require('../controllers/ordersController');
const isAuthenticated = require('../middleware/authenticate');

router.get('/', ordersController.getAll);
router.get('/:id', ordersController.getSingle);
router.post('/', isAuthenticated, ordersController.createOrder);
router.put('/:id', isAuthenticated, ordersController.updateOrder);
router.delete('/:id', isAuthenticated, ordersController.deleteOrder);

module.exports = router;