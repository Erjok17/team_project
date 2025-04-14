const mongodb = require('../data/database');
const { ObjectId } = require('mongodb');

/**
 * @swagger
 * /books:
 *   get:
 *     tags: [Books]
 *     summary: Get all books
 *     responses:
 *       200:
 *         description: List of books
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Book'
 *       500:
 *         description: Server error
 */
const getAll = async (req, res) => {
  try {
    const result = await mongodb.getDb().collection('books').find().toArray();
    res.setHeader('Content-Type', 'application/json');
    res.status(200).json(result);
  } catch (err) {
    console.error('Error in getAllBooks:', err);
    res.status(500).json({ 
      error: 'Failed to fetch books',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

/**
 * @swagger
 * /books/{id}:
 *   get:
 *     tags: [Books]
 *     summary: Get book by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: objectid
 *         example: 507f1f77bcf86cd799439011
 *     responses:
 *       200:
 *         description: Book details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Book'
 *       400:
 *         description: Invalid ID format
 *       404:
 *         description: Book not found
 *       500:
 *         description: Server error
 */
const getSingle = async (req, res) => {
  try {
    if (!ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid book ID format' });
    }

    const bookId = new ObjectId(req.params.id);
    const result = await mongodb.getDb().collection('books').findOne({ _id: bookId });

    if (!result) {
      return res.status(404).json({ error: 'Book not found' });
    }
    
    res.status(200).json(result);
  } catch (err) {
    console.error('Error in getSingleBook:', err);
    res.status(500).json({ 
      error: 'Failed to fetch book',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

/**
 * @swagger
 * /books:
 *   post:
 *     tags: [Books]
 *     summary: Create a new book
 *     security:
 *       - githubAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Book'
 *     responses:
 *       201:
 *         description: Book created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Book'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
const createBook = async (req, res) => {
  try {
    // Validate request body
    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(400).json({ error: 'Request body is empty' });
    }

    const { title, author, price, stock } = req.body;

    // Validate required fields
    if (!title || !author || !price) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['title', 'author', 'price'],
        received: Object.keys(req.body)
      });
    }

    // Validate price is a number
    if (isNaN(price)) {
      return res.status(400).json({ error: 'Price must be a number' });
    }

    // Create new book
    const book = {
      title,
      author,
      price: parseFloat(price),
      stock: stock ? parseInt(stock) : 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const response = await mongodb.getDb().collection('books').insertOne(book);
    
    if (response.acknowledged) {
      res.status(201).json({
        _id: response.insertedId,
        ...book
      });
    } else {
      throw new Error('Database operation not acknowledged');
    }
  } catch (err) {
    console.error('Error in createBook:', err);
    res.status(500).json({ 
      error: 'Failed to create book',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

/**
 * @swagger
 * /books/{id}:
 *   put:
 *     tags: [Books]
 *     summary: Update a book
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
 *             $ref: '#/components/schemas/Book'
 *     responses:
 *       200:
 *         description: Book updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Book'
 *       400:
 *         description: Invalid input
 *       404:
 *         description: Book not found
 *       500:
 *         description: Server error
 */
const updateBook = async (req, res) => {
  try {
    if (!ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid book ID format' });
    }

    // Validate request body
    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(400).json({ error: 'Request body is empty' });
    }

    const { title, author, price, stock } = req.body;
    const bookId = new ObjectId(req.params.id);
    const db = mongodb.getDb();

    // Check if book exists
    const existingBook = await db.collection('books').findOne({ _id: bookId });
    if (!existingBook) {
      return res.status(404).json({ error: 'Book not found' });
    }

    // Validate price if being updated
    if (price && isNaN(price)) {
      return res.status(400).json({ error: 'Price must be a number' });
    }

    // Prepare update
    const updateDoc = {
      $set: {
        title: title || existingBook.title,
        author: author || existingBook.author,
        price: price ? parseFloat(price) : existingBook.price,
        stock: stock ? parseInt(stock) : existingBook.stock,
        updatedAt: new Date()
      }
    };

    const response = await db.collection('books')
      .updateOne({ _id: bookId }, updateDoc);

    if (response.modifiedCount === 0) {
      return res.status(400).json({ error: 'No changes detected' });
    }

    res.status(200).json({
      _id: bookId,
      ...updateDoc.$set
    });
  } catch (err) {
    console.error('Error in updateBook:', err);
    res.status(500).json({ 
      error: 'Failed to update book',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

/**
 * @swagger
 * /books/{id}:
 *   delete:
 *     tags: [Books]
 *     summary: Delete a book
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
 *         description: Book deleted
 *       400:
 *         description: Invalid ID format
 *       404:
 *         description: Book not found
 *       500:
 *         description: Server error
 */
const deleteBook = async (req, res) => {
  try {
    if (!ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid book ID format' });
    }

    const bookId = new ObjectId(req.params.id);
    const response = await mongodb.getDb().collection('books')
      .deleteOne({ _id: bookId });

    if (response.deletedCount === 0) {
      return res.status(404).json({ error: 'Book not found' });
    }

    res.status(204).send();
  } catch (err) {
    console.error('Error in deleteBook:', err);
    res.status(500).json({ 
      error: 'Failed to delete book',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

module.exports = {
  getAll,
  getSingle,
  createBook,
  updateBook,
  deleteBook
};