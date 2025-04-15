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

const app = express();
const port = process.env.PORT || 3000;

// =============================================
//               MIDDLEWARE SETUP
// =============================================

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

// ✅ UPDATED SESSION CONFIGURATION
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
      secure: true,           // ✅ Must be true for HTTPS on Render
      sameSite: 'none',       // ✅ Allows cross-origin cookies (GitHub → Render)
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000
    }
  })
);

// Passport initialization
app.use(passport.initialize());
app.use(passport.session());

// CORS setup
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

// Session handling
passport.serializeUser((user, done) => {
  done(null, user);
});
passport.deserializeUser((user, done) => {
  done(null, user);
});

// =============================================
//                 API ROUTES
// =============================================

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

// ✅ FIXED ROOT ROUTE TO CHECK PROPER LOGIN STATUS
app.get('/', (req, res) => {
  if (req.isAuthenticated()) {
    res.send(`Logged in as ${req.user.username || req.user.displayName}`);
  } else {
    res.send('Logged out');
  }
});

// ✅ UPDATED CALLBACK TO USE req.login() AND SESSION
app.get(
  '/auth/github/callback',
  passport.authenticate('github', { failureRedirect: '/api-docs', session: true }),
  (req, res, next) => {
    req.login(req.user, (err) => {
      if (err) {
        console.error('Login error:', err);
        return next(err);
      }
      console.log('User authenticated and stored in session:', req.user);
      res.redirect('/');
    });
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

    app.use('/', routes);
    app.use('/users', require('./routes/users'));
    app.use('/books', require('./routes/books'));
    app.use('/orders', require('./routes/orders'));
    app.use('/reviews', require('./routes/reviews'));

    app.listen(port, '0.0.0.0', () => {
      console.log(`Server is running on port ${port}`);
      console.log(`API Docs: http://localhost:${port}/api-docs`);
    });
  }
});
