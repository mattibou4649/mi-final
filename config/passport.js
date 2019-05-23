var passport = require('passport');
var GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;

// dotenv.config()

module.exports = (passport) => {
  passport.serializeUser((user, done) => {
    done(null, user);
  });
  
  passport.deserializeUser((user, done) => {
    done(null, user);
  });

  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_ID,
    clientSecret: process.env.GOOGLE_SECRET,
    callbackURL: "/auth/google/callback/"
  },
    function(accessToken, refreshToken, profile, done) {
        return done(null, profile);
    }
  ));
}