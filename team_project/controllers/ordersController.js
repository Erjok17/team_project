const mongodb = require('../data/database');
const { ObjectId } = require('mongodb');

/**
 * @swagger
 * /orders:
 *   get:
 *     tags: [Orders]
 *     summary: Get all orders
 *     responses:
 *       200:
 *         description: List of orders
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Order'
 *       500:
 *         description: Server error
 */
const getAll = async (req, res) => {
  try {
    const result = await mongodb.getDb().collection('orders').find().toArray();
    res.setHeader('Content-Type', 'application/json');
    res.status(200).json(result);
  } catch (err) {
    console.error('Error in getAllOrders:', err);
    res.status(500).json({ 
      error: 'Failed to fetch orders',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

/**
 * @swagger
 * /orders/{id}:
 *   get:
 *     tags: [Orders]
 *     summary: Get order by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: objectid
 *     responses:
 *       200:
 *         description: Order details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Order'
 *       400:
 *         description: Invalid ID format
 *       404:
 *         description: Order not found
 *       500:
 *         description: Server error
 */
const getSingle = async (req, res) => {
  try {
    if (!ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid order ID format' });
    }

    const orderId = new ObjectId(req.params.id);
    const result = await mongodb.getDb().collection('orders').findOne({ _id: orderId });

    if (!result) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    res.status(200).json(result);
  } catch (err) {
    console.error('Error in getSingleOrder:', err);
    res.status(500).json({ 
      error: 'Failed to fetch order',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

/**
 * @swagger
 * /orders:
 *   post:
 *     tags: [Orders]
 *     summary: Create a new order
 *     security:
 *       - githubAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Order'
 *     responses:
 *       201:
 *         description: Order created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Order'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
const createOrder = async (req, res) => {
  try {
    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(400).json({ error: 'Request body is empty' });
    }

    const { userId, books, totalAmount, status } = req.body;

    if (!userId || !books || !totalAmount || !status) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['userId', 'books', 'totalAmount', 'status'],
        received: Object.keys(req.body)
      });
    }

    const order = {
      userId: new ObjectId(userId),
      books: books.map(book => ({
        bookId: new ObjectId(book.bookId),
        quantity: book.quantity
      })),
      totalAmount: parseFloat(totalAmount),
      status,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const response = await mongodb.getDb().collection('orders').insertOne(order);
    
    if (response.acknowledged) {
      res.status(201).json({
        _id: response.insertedId,
        ...order
      });
    } else {
      throw new Error('Database operation not acknowledged');
    }
  } catch (err) {
    console.error('Error in createOrder:', err);
    res.status(500).json({ 
      error: 'Failed to create order',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

/**
 * @swagger
 * /orders/{id}:
 *   put:
 *     tags: [Orders]
 *     summary: Update an order
 *     security:
 *       - githubAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: objectid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Order'
 *     responses:
 *       200:
 *         description: Order updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Order'
 *       400:
 *         description: Invalid input
 *       404:
 *         description: Order not found
 *       500:
 *         description: Server error
 */
const updateOrder = async (req, res) => {
  try {
    if (!ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid order ID format' });
    }

    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(400).json({ error: 'Request body is empty' });
    }

    const { status } = req.body;
    const orderId = new ObjectId(req.params.id);
    const db = mongodb.getDb();

    const existingOrder = await db.collection('orders').findOne({ _id: orderId });
    if (!existingOrder) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const updateDoc = {
      $set: {
        status: status || existingOrder.status,
        updatedAt: new Date()
      }
    };

    const response = await db.collection('orders')
      .updateOne({ _id: orderId }, updateDoc);

    if (response.modifiedCount === 0) {
      return res.status(400).json({ error: 'No changes detected' });
    }

    res.status(200).json({
      _id: orderId,
      ...updateDoc.$set
    });
  } catch (err) {
    console.error('Error in updateOrder:', err);
    res.status(500).json({ 
      error: 'Failed to update order',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

/**
 * @swagger
 * /orders/{id}:
 *   delete:
 *     tags: [Orders]
 *     summary: Delete an order
 *     security:
 *       - githubAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: objectid
 *     responses:
 *       204:
 *         description: Order deleted
 *       400:
 *         description: Invalid ID format
 *       404:
 *         description: Order not found
 *       500:
 *         description: Server error
 */
const deleteOrder = async (req, res) => {
  try {
    if (!ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid order ID format' });
    }

    const orderId = new ObjectId(req.params.id);
    const response = await mongodb.getDb().collection('orders')
      .deleteOne({ _id: orderId });

    if (response.deletedCount === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.status(204).send();
  } catch (err) {
    console.error('Error in deleteOrder:', err);
    res.status(500).json({ 
      error: 'Failed to delete order',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

module.exports = {
  getAll,
  getSingle,
  createOrder,
  updateOrder,
  deleteOrder
};