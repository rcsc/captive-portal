require('dotenv').config(); // Import all the .env variables and load them
const express = require('express'); // JS version of importing express
const app = express(); // Load express up as a app
const session = require('express-session'); //JS version of importing express-sessions which does stuff

app.set('view engine', 'ejs'); // Set express to load webpages using EJS

app.use(session({
  resave: false,
  saveUninitialized: true,
  secret: process.env.SECRET 
})); // Set up the app using sessions

app.use(__dirname + express.static('/views'));

app.get('/', function(req, res) {
  res.render('pages/auth');
}); // Basic routing, passes any people who access the webpage to pages/auth

const port = process.env.PORT || 3000; // Define the port the server will use
app.listen(port , () => console.log('App listening on port ' + port)); // Start the server with the port


var passport = require('passport'); // JS version of importing passport
var userProfile; // Define userProfile for passport use
 
app.use(passport.initialize()); // Tell express to use passport as middleware
app.use(passport.session()); // Not sure what this does but it needs to be there to work
 
app.get('/success', (req, res) => {
  res.render('pages/success', {user: userProfile}); 
}); // When passports logins in it will route to this page
app.get('/error', (req, res) => res.send("error logging in")); // Pretty self explanatory
 
passport.serializeUser(function(user, cb) {
  cb(null, user);
}); 
 
passport.deserializeUser(function(obj, cb) {
  cb(null, obj);
});

const { GraphQLClient, gql } = require('graphql-request')

async function logAttendance(userEmail, userName) {
  const endpoint = process.env.GRAPHQL_ENDPOINT;

  const graphQLClient = new GraphQLClient(endpoint, {
    headers: {
      TOKEN: process.env.GRAPHQL_AUTHORIZATION,
    },
  })

  const mutation = gql`
    mutation($email: String!) {
        logAttendance(email: $email) {
            inTime
        }
    }
  `

  const variables = {
    email: userEmail, 
  }
  try {
  const data = await graphQLClient.request(mutation, variables)
  console.log(JSON.stringify(data, undefined, 2))
  } catch (error) {
      console.error(error, undefined, 2)
      createUser(userName, userEmail)
  }
} // Log attendance function that does the error catching and stuff

async function createUser(userName, userEmail) {
  const endpoint = process.env.GRAPHQL_ENDPOINT;

  const graphQLClient = new GraphQLClient(endpoint, {
    headers: {
      TOKEN: process.env.GRAPHQL_AUTHORIZATION,
    },
  })

  const mutation = gql`
    mutation($fullName: String!, $email: String!) {
      createUser(fullName: $fullName, email: $email) {        
      uuid
      }
    }
  `

  const variables = {
    fullName: userName,
    email: userEmail,
  }
  const data = await graphQLClient.request(mutation, variables)

  console.log(JSON.stringify(data, undefined, 2))
  logAttendance(userEmail, userName)
} // Create user if it doesnt exist and log their attendance

 
var GoogleStrategy = require('passport-google-oauth').OAuth2Strategy; // Google stuff

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: 'https://cap.ridgecompsci.club/auth/google/callback'
  },
  function(accessToken, refreshToken, profile, done) {
      userProfile=profile;
      return done(null, userProfile);
  }
)); // Tell passport to use google auth
 
app.get('/auth/google', 
  passport.authenticate('google', { scope : ['profile', 'email'] })); // What scopes google will access
 
app.get('/auth/google/callback', 
  passport.authenticate('google', { failureRedirect: '/error' }),
  function(req, res) {
      var user = req["user"];
      var userJson = user["_json"];
      var userEmail = userJson["email"];
      var userName = userJson["name"];
      logAttendance(userEmail, userName)
      res.redirect('/success');
  }); // On success, find users details and send them to async logAttendance function
