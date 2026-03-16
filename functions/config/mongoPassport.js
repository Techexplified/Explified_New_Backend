const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const User = require("../models/mongoUserModel");

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.MONGO_GOOGLE_CLIENT_ID,
      clientSecret: process.env.MONGO_GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.MONGO_GOOGLE_CALLBACK_URL,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails[0].value;

        let user = await User.findOne({ email });

        /* If user doesn't exist create one */
        if (!user) {
          user = await User.create({
            name: profile.displayName,
            email: email,
            googleId: profile.id,
            avatar: profile.photos?.[0]?.value || "",
            provider: "google",
          });
        }

        /* If user exists but signed up locally earlier */
        if (user && !user.googleId) {
          user.googleId = profile.id;
          user.provider = "google";
          await user.save();
        }

        return done(null, user);
      } catch (error) {
        return done(error, null);
      }
    },
  ),
);

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  const user = await User.findById(id);
  done(null, user);
});
