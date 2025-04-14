const mongodb = require('../data/database');
const { ObjectId } = require('mongodb');

// Utility function for validating email format
const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

/**
 * @swagger
 * /users:
 *   get:
 *     tags: [Users]
 *     summary: Get all users
 *     responses:
 *       200:
 *         description: List of users
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/User'
 *       500:
 *         description: Server error
 */
const getAll = async (req, res) => {
  try {
    const result = await mongodb.getDb().collection('users').find().toArray();
    res.setHeader('Content-Type', 'application/json');
    res.status(200).json(result);
  } catch (err) {
    console.error('Error in getAllUsers:', err);
    res.status(500).json({ 
      error: 'Failed to fetch users',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

/**
 * @swagger
 * /users/{id}:
 *   get:
 *     tags: [Users]
 *     summary: Get user by ID
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
 *         description: User details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       400:
 *         description: Invalid ID format
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
const getSingle = async (req, res) => {
  try {
    if (!ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid user ID format' });
    }

    const userId = new ObjectId(req.params.id);
    const result = await mongodb.getDb().collection('users').findOne({ _id: userId });

    if (!result) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.status(200).json(result);
  } catch (err) {
    console.error('Error in getSingleUser:', err);
    res.status(500).json({ 
      error: 'Failed to fetch user',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

/**
 * @swagger
 * /users:
 *   post:
 *     tags: [Users]
 *     summary: Create a new user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/User'
 *     responses:
 *       201:
 *         description: User created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       400:
 *         description: Validation error
 *       409:
 *         description: Email already exists
 *       500:
 *         description: Server error
 */
const createUser = async (req, res) => {
  try {
    // Validate request body
    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(400).json({ error: 'Request body is empty' });
    }

    const { firstName, lastName, email, role } = req.body;

    // Validate required fields
    if (!firstName || !lastName || !email) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['firstName', 'lastName', 'email'],
        received: Object.keys(req.body)
      });
    }

    // Validate email format
    if (!validateEmail(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    const db = mongodb.getDb();
    
    // Check for duplicate email
    const existingUser = await db.collection('users').findOne({ email });
    if (existingUser) {
      return res.status(409).json({ error: 'Email already exists' });
    }

    // Create new user
    const user = {
      firstName,
      lastName,
      email,
      role: role || 'user',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const response = await db.collection('users').insertOne(user);
    
    if (response.acknowledged) {
      res.status(201).json({
        _id: response.insertedId,
        ...user
      });
    } else {
      throw new Error('Database operation not acknowledged');
    }
  } catch (err) {
    console.error('Error in createUser:', err);
    res.status(500).json({ 
      error: 'Failed to create user',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

/**
 * @swagger
 * /users/{id}:
 *   put:
 *     tags: [Users]
 *     summary: Update a user
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
 *             $ref: '#/components/schemas/User'
 *     responses:
 *       200:
 *         description: User updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       400:
 *         description: Invalid input
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
const updateUser = async (req, res) => {
  try {
    if (!ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid user ID format' });
    }

    // Validate request body
    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(400).json({ error: 'Request body is empty' });
    }

    const { firstName, lastName, email, role } = req.body;
    const userId = new ObjectId(req.params.id);
    const db = mongodb.getDb();

    // Check if user exists
    const existingUser = await db.collection('users').findOne({ _id: userId });
    if (!existingUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Validate email if being updated
    if (email && email !== existingUser.email) {
      if (!validateEmail(email)) {
        return res.status(400).json({ error: 'Invalid email format' });
      }
      
      const emailExists = await db.collection('users').findOne({ email });
      if (emailExists) {
        return res.status(409).json({ error: 'Email already in use' });
      }
    }

    // Prepare update
    const updateDoc = {
      $set: {
        firstName: firstName || existingUser.firstName,
        lastName: lastName || existingUser.lastName,
        email: email || existingUser.email,
        role: role || existingUser.role,
        updatedAt: new Date()
      }
    };

    const response = await db.collection('users')
      .updateOne({ _id: userId }, updateDoc);

    if (response.modifiedCount === 0) {
      return res.status(400).json({ error: 'No changes detected' });
    }

    res.status(200).json({
      _id: userId,
      ...updateDoc.$set
    });
  } catch (err) {
    console.error('Error in updateUser:', err);
    res.status(500).json({ 
      error: 'Failed to update user',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

/**
 * @swagger
 * /users/{id}:
 *   delete:
 *     tags: [Users]
 *     summary: Delete a user
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: objectid
 *     responses:
 *       204:
 *         description: User deleted
 *       400:
 *         description: Invalid ID format
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
const deleteUser = async (req, res) => {
  try {
    if (!ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid user ID format' });
    }

    const userId = new ObjectId(req.params.id);
    const response = await mongodb.getDb().collection('users')
      .deleteOne({ _id: userId });

    if (response.deletedCount === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.status(204).send();
  } catch (err) {
    console.error('Error in deleteUser:', err);
    res.status(500).json({ 
      error: 'Failed to delete user',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

module.exports = {
  getAll,
  getSingle,
  createUser,
  updateUser,
  deleteUser
};