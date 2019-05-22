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
    clientID: "1048765242182-m6gcevgv8kvppvdifi5s5icse6qmq1of.apps.googleusercontent.com",
    clientSecret: "gTbgSwXdMFL3lM1fcFmOJKos",
    callbackURL: "/auth/google/callback/"
  },
    function(accessToken, refreshToken, profile, done) {
        return done(null, profile);
    }
  ));
}