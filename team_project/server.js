require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const mongodb = require('./data/database');
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./swagger.json');
const passport = require('passport');
const session = require('express-session');
const GitHubStrategy = require('passport-github2').Strategy;
const cors = require('cors');
const routes = require('./routes');
const MongoStore = require('connect-mongo');

// Initialize Express app
const app = express();
const port = process.env.PORT || 3000;

// =============================================
//               MIDDLEWARE SETUP
// =============================================

// Body parser middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

// Session configuration
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'fallback-secret-for-dev-only',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: process.env.MONGODB_URI,
      ttl: 14 * 24 * 60 * 60 // 14 days
    }),
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
  })
);

// Passport initialization
app.use(passport.initialize());
app.use(passport.session());

// CORS configuration
app.use(
  cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Z-Key', 'Authorization']
  })
);

// =============================================
//             PASSPORT CONFIGURATION
// =============================================

// GitHub OAuth Strategy
passport.use(
  new GitHubStrategy(
    {
      clientID: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      callbackURL: process.env.GITHUB_CALLBACK_URL,
      proxy: true
    },
    (accessToken, refreshToken, profile, done) => {
      return done(null, profile);
    }
  )
);

// User serialization
passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((user, done) => {
  done(null, user);
});

// =============================================
//                 API ROUTES
// =============================================

// Swagger Documentation
app.use(
  '/api-docs',
  swaggerUi.serve,
  swaggerUi.setup(swaggerDocument, {
    explorer: true,
    swaggerOptions: {
      tagsSorter: 'alpha',
      operationsSorter: 'method'
    }
  })
);

// Root route
app.get('/', (req, res) => {
  res.send(
    req.session.user !== undefined
      ? `Logged in as ${req.session.user.username || req.session.user.displayName}`
      : 'Logged out'
  );
});

// OAuth Routes
app.get('/auth/github', passport.authenticate('github', { scope: ['user:email'] }));

app.get(
  '/auth/github/callback',
  passport.authenticate('github', { failureRedirect: '/api-docs', session: false }),
  (req, res) => {
    req.session.user = req.user;
    res.redirect('/');
  }
);

// Logout route
app.get('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      res.status(400).send('Unable to log out');
    } else {
      res.send('Logout successful');
    }
  });
});

// =============================================
//            DATABASE & SERVER START
// =============================================

mongodb.initDb(err => {
  if (err) {
    console.error('Database initialization failed:', err);
    process.exit(1);
  } else {
    console.log('Connected to MongoDB successfully');

    // Application routes
    app.use('/', routes);
    app.use('/users', require('./routes/users'));
    app.use('/books', require('./routes/books'));
    app.use('/orders', require('./routes/orders'));
    app.use('/reviews', require('./routes/reviews'));

    // Start server
    app.listen(port, '0.0.0.0', () => {
      console.log(`Server is running on port ${port}`);
      console.log(`API Docs: http://localhost:${port}/api-docs`);
    });
  }
});