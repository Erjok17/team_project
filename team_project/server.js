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
const MongoStore = require('connect-mongo');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

// =============================================
//               MIDDLEWARE SETUP
// =============================================

// Enhanced CORS configuration
const corsOptions = {
  origin: [
    process.env.CLIENT_URL,
    'https://team-project-ahvx.onrender.com',
    'http://localhost:3000'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization'],
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

// Body parser middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Trust proxy for production
if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

// Session configuration with MongoStore
app.use(
  session({
    name: 'bookstore.sid', // Custom session cookie name
    secret: process.env.SESSION_SECRET || 'fallback-secret-for-dev-only',
    resave: false,
    saveUninitialized: true,
    store: MongoStore.create({
      mongoUrl: process.env.MONGODB_URI,
      ttl: 14 * 24 * 60 * 60, // 14 days
      autoRemove: 'native'
    }),
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      domain: process.env.COOKIE_DOMAIN || undefined
    }
  })
);

// Passport initialization
app.use(passport.initialize());
app.use(passport.session());

// Debugging middleware
app.use((req, res, next) => {
  console.log('\n=== New Request ===');
  console.log('Path:', req.path);
  console.log('Session ID:', req.sessionID);
  console.log('Authenticated:', req.isAuthenticated());
  console.log('User:', req.user || 'Not logged in');
  next();
});

// =============================================
//             PASSPORT CONFIGURATION
// =============================================

passport.use(
  new GitHubStrategy(
    {
      clientID: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      callbackURL: process.env.GITHUB_CALLBACK_URL,
      proxy: true,
      scope: ['user:email'],
      userAgent: 'Bookstore-App'
    },
    (accessToken, refreshToken, profile, done) => {
      // Normalize user profile
      const user = {
        id: profile.id,
        username: profile.username,
        displayName: profile.displayName || profile.username,
        email: profile.emails?.[0]?.value,
        profileUrl: profile.profileUrl,
        provider: profile.provider,
        accessToken: accessToken
      };
      
      console.log('GitHub profile received:', profile);
      console.log('Normalized user:', user);
      
      return done(null, user);
    }
  )
);

// Serialize only the user ID
passport.serializeUser((user, done) => {
  console.log('Serializing user ID:', user.id);
  done(null, user.id);
});

// Deserialize user (in a real app, you would fetch from database)
passport.deserializeUser(async (id, done) => {
  console.log('Deserializing user ID:', id);
  // For now, just return the ID - in production you would look up the user
  done(null, { id });
});

// =============================================
//                 API ROUTES
// =============================================

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'healthy',
    session: req.sessionID,
    authenticated: req.isAuthenticated()
  });
});

// Auth status endpoint
app.get('/auth/status', (req, res) => {
  res.json({
    isAuthenticated: req.isAuthenticated(),
    user: req.user || null
  });
});

// GitHub auth routes
app.get('/auth/github', 
  passport.authenticate('github', { scope: ['user:email'] })
);

app.get('/auth/github/callback',
  passport.authenticate('github', { 
    failureRedirect: '/login-failed',
    session: true 
  }),
  (req, res) => {
    // Successful authentication
    console.log('Login successful for user:', req.user);
    
    // Redirect to frontend with success state
    const frontendUrl = process.env.FRONTEND_URL || 'https://team-project-ahvx.onrender.com';
    res.redirect(`${frontendUrl}?login=success&user=${encodeURIComponent(req.user.username)}`);
  }
);

// Logout route
app.get('/logout', (req, res, next) => {
  req.logout((err) => {
    if (err) return next(err);
    
    req.session.destroy((err) => {
      if (err) {
        console.error('Session destruction error:', err);
        return res.status(500).send('Logout failed');
      }
      
      res.clearCookie('bookstore.sid');
      res.clearCookie('connect.sid');
      
      res.json({ success: true, message: 'Logged out successfully' });
    });
  });
});

// Swagger documentation
app.use('/api-docs',
  swaggerUi.serve,
  swaggerUi.setup(swaggerDocument, {
    explorer: true,
    swaggerOptions: {
      oauth: {
        clientId: process.env.GITHUB_CLIENT_ID,
        appName: 'Bookstore API',
        scopeSeparator: ' ',
        additionalQueryStringParams: {}
      }
    }
  })
);
