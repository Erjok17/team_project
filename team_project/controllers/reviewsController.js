const mongodb = require('../data/database');
const { ObjectId } = require('mongodb');

/**
 * @swagger
 * /reviews:
 *   get:
 *     tags: [Reviews]
 *     summary: Get all reviews
 *     responses:
 *       200:
 *         description: List of reviews
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Review'
 *       500:
 *         description: Server error
 */
const getAll = async (req, res) => {
  try {
    const result = await mongodb.getDb().collection('reviews').find().toArray();
    res.setHeader('Content-Type', 'application/json');
    res.status(200).json(result);
  } catch (err) {
    console.error('Error in getAllReviews:', err);
    res.status(500).json({ 
      error: 'Failed to fetch reviews',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

/**
 * @swagger
 * /reviews/{id}:
 *   get:
 *     tags: [Reviews]
 *     summary: Get review by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: objectid
 *     responses:
 *       200:
 *         description: Review details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Review'
 *       400:
 *         description: Invalid ID format
 *       404:
 *         description: Review not found
 *       500:
 *         description: Server error
 */
const getSingle = async (req, res) => {
  try {
    if (!ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid review ID format' });
    }

    const reviewId = new ObjectId(req.params.id);
    const result = await mongodb.getDb().collection('reviews').findOne({ _id: reviewId });

    if (!result) {
      return res.status(404).json({ error: 'Review not found' });
    }
    
    res.status(200).json(result);
  } catch (err) {
    console.error('Error in getSingleReview:', err);
    res.status(500).json({ 
      error: 'Failed to fetch review',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

/**
 * @swagger
 * /reviews:
 *   post:
 *     tags: [Reviews]
 *     summary: Create a new review
 *     security:
 *       - githubAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Review'
 *     responses:
 *       201:
 *         description: Review created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Review'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
const createReview = async (req, res) => {
  try {
    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(400).json({ error: 'Request body is empty' });
    }

    const { userId, bookId, rating, comment } = req.body;

    if (!userId || !bookId || !rating) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['userId', 'bookId', 'rating'],
        received: Object.keys(req.body)
      });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }

    const review = {
      userId: new ObjectId(userId),
      bookId: new ObjectId(bookId),
      rating: parseInt(rating),
      comment: comment || '',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const response = await mongodb.getDb().collection('reviews').insertOne(review);
    
    if (response.acknowledged) {
      res.status(201).json({
        _id: response.insertedId,
        ...review
      });
    } else {
      throw new Error('Database operation not acknowledged');
    }
  } catch (err) {
    console.error('Error in createReview:', err);
    res.status(500).json({ 
      error: 'Failed to create review',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

/**
 * @swagger
 * /reviews/{id}:
 *   put:
 *     tags: [Reviews]
 *     summary: Update a review
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
 *             $ref: '#/components/schemas/Review'
 *     responses:
 *       200:
 *         description: Review updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Review'
 *       400:
 *         description: Invalid input
 *       404:
 *         description: Review not found
 *       500:
 *         description: Server error
 */
const updateReview = async (req, res) => {
  try {
    if (!ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid review ID format' });
    }

    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(400).json({ error: 'Request body is empty' });
    }

    const { rating, comment } = req.body;
    const reviewId = new ObjectId(req.params.id);
    const db = mongodb.getDb();

    const existingReview = await db.collection('reviews').findOne({ _id: reviewId });
    if (!existingReview) {
      return res.status(404).json({ error: 'Review not found' });
    }

    if (rating && (rating < 1 || rating > 5)) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }

    const updateDoc = {
      $set: {
        rating: rating ? parseInt(rating) : existingReview.rating,
        comment: comment || existingReview.comment,
        updatedAt: new Date()
      }
    };

    const response = await db.collection('reviews')
      .updateOne({ _id: reviewId }, updateDoc);

    if (response.modifiedCount === 0) {
      return res.status(400).json({ error: 'No changes detected' });
    }

    res.status(200).json({
      _id: reviewId,
      ...updateDoc.$set
    });
  } catch (err) {
    console.error('Error in updateReview:', err);
    res.status(500).json({ 
      error: 'Failed to update review',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

/**
 * @swagger
 * /reviews/{id}:
 *   delete:
 *     tags: [Reviews]
 *     summary: Delete a review
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
 *         description: Review deleted
 *       400:
 *         description: Invalid ID format
 *       404:
 *         description: Review not found
 *       500:
 *         description: Server error
 */
const deleteReview = async (req, res) => {
  try {
    if (!ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid review ID format' });
    }

    const reviewId = new ObjectId(req.params.id);
    const response = await mongodb.getDb().collection('reviews')
      .deleteOne({ _id: reviewId });

    if (response.deletedCount === 0) {
      return res.status(404).json({ error: 'Review not found' });
    }

    res.status(204).send();
  } catch (err) {
    console.error('Error in deleteReview:', err);
    res.status(500).json({ 
      error: 'Failed to delete review',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

module.exports = {
  getAll,
  getSingle,
  createReview,
  updateReview,
  deleteReview
};