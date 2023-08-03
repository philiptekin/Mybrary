const LocalStrategy = require("passport-local").Strategy;
const bcrypt = require("bcrypt");

function initialize(passport, getUserByName, getUserById) {
  const authenticateUser = async (name, password, done) => {
    var user;
    try {
      user = await getUserByName(name);
    } catch (e) {
      return done(e);
    }

    // If the user doesn't exist then we return no user found
    if (user === null) {
      return done(null, false, { message: "No user with that name" });
    }
    try {
      // if the user is authenticated then we send the user info towards serializeuser function
      if (await bcrypt.compare(password, user.password)) {
        done(null, user);
      }
      // Return that the password is incorrect
      else {
        return done(null, false, { message: "Password incorrect" });
      }
    } catch (e) {
      return done(e);
    }
  };
  passport.use(new LocalStrategy({ usernameField: "name" }, authenticateUser));
  // Creates cookie for user using user id
  passport.serializeUser((user, done) => done(null, user.id));
  // Finds user in database by looking at cookie which is user id
  passport.deserializeUser(async (id, done) => {
    const user = await getUserById(id);
    done(null, user);
  });
}

module.exports = initialize;
