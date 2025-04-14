const express = require('express');
const router = express.Router();
const passport = require('passport');
const isAuthenticated = require('../middleware/authenticate');

// Routes (No @swagger annotations needed)
router.use('/', require('./swagger'));
router.use('/users', require('./users'));
router.use('/books', require('./books'));
router.use('/orders', require('./orders'));
router.use('/reviews', require('./reviews'));

router.get('/', (req, res) => {
  res.json({ 
    message: 'Bookstore API is running',
    status: req.session.user ? 'authenticated' : 'unauthenticated',
    endpoints: {
      login: '/auth/github',
      logout: '/logout',
      users: '/users',
      books: '/books',
      orders: '/orders',
      reviews: '/reviews'
    }
  });
});

// Auth routes
router.get('/auth/github', passport.authenticate('github', { scope: ['user:email'] }));
router.get('/auth/github/callback',
  passport.authenticate('github', { failureRedirect: '/' }),
  (req, res) => {
    req.session.user = {
      id: req.user.id,
      username: req.user.username,
      displayName: req.user.displayName,
      profileUrl: req.user.profileUrl
    };
    res.redirect('/');
  }
);

router.get('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Logout error:', err);
      return res.status(500).json({ error: 'Logout failed' });
    }
    res.clearCookie('connect.sid');
    res.json({ message: 'Successfully logged out' });
  });
});

router.get('/login', (req, res) => res.redirect('/auth/github'));

module.exports = router;