// require("dotenv").config();
const express = require("express");
const ejs = require("ejs");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const encrypt = require("mongoose-encryption")
const md5 = require("md5");
// const bcrypt = require('bcrypt');
// const saltRounds = 10;
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require("mongoose-findorcreate");



const app = express();


app.use(express.static("public"));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended:true}));

app.use(session({
    secret: 'Our Little Secret',
    resave: false,
    saveUninitialized: false,
    // cookie: { secure: true }
}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb+srv://taymoorkhalid951:Alyaar_7778@cluster0.v93pe8j.mongodb.net/userDB");

const userSchema = new mongoose.Schema({
    email: String,
    password: String,
    googleId : String,
    secret:String
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

// var secret = "Thisismysecret"
// userSchema.plugin(encrypt, { secret: secret, encryptedFields: ['password'] });

const User = new mongoose.model("User",userSchema);


passport.use(User.createStrategy());
passport.serializeUser(function(user, cb) {
    process.nextTick(function() {
      return cb(null, {
        id: user.id,
        username: user.username,
        picture: user.picture
      });
    });
  });
  
  passport.deserializeUser(function(user, cb) {
    process.nextTick(function() {
      return cb(null, user);
    });
  });

passport.use(new GoogleStrategy({
    clientID: "239393609458-uu6lu6ucosc3csf2i9bi3rl5ld3or5v0.apps.googleusercontent.com",
    clientSecret: "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" ,
    callbackURL: "http://localhost:3000/auth/google/secrets",
  },
  function(accessToken, refreshToken, profile, cb) {
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));

///////////////////    Get Requests     //////////////////


app.get("/",function(req,res){
    res.render("home");
})

app.get("/auth/google",
    passport.authenticate('google', { scope: ["profile"] })
);


app.get("/auth/google/secrets",
    passport.authenticate('google', { failureRedirect: "/login" }),
    function(req, res) {
        res.redirect('/secrets');
    }
);

app.get("/login",function(req,res){
    res.render("login");
})

app.get("/logout",function(req,res){
    req.logout(function(err) {
        if (err) { return next(err); }
        res.redirect('/');
      });
});

app.get("/register",function(req,res){
    res.render("register");
})

app.get("/secrets", function (req, res){
    User.find({"secret":{$ne:null}}).then(foundUser => {
        if(foundUser){
            res.render("secrets",{userWithSecrets : foundUser});
        }
    }).catch(error => {
        console.log(error);
    })
});

app.get("/submit",function(req,res){
    if(req.isAuthenticated()){
        res.render("submit");
    }else{
        res.redirect("/login");
    }
});



///////////////////    Post Requests     //////////////////


app.post("/register",function(req,res){
   User.register({username : req.body.username}, req.body.password , function(err){
        if(err){
            console.log(err);
            res.redirect("/register");
        }else{
            passport.authenticate('local')(req, res, function () {
                res.redirect("/secrets");
            });
        }
   }); 
});

app.post("/login", passport.authenticate("local", {
    successRedirect: "/secrets",
    failureRedirect: "/login"
}));


app.listen(3000,function(){
    console.log("Server started on port 3000");
})


app.post("/submit",function(req,res){
    const submittedSecret = req.body.secret;
    async function addSecret(){
        try{
            const foundUser = await User.findById(req.user.id);
            foundUser.secret = submittedSecret;
            foundUser.save();
            res.redirect("/secrets");
        }catch(error){
            console.log(error);
        }    
    }
    addSecret();
});







///////////App.post(Register)/////////////////
// bcrypt.hash(req.body.password, saltRounds, function(err, hash) {
//     const newUser = new User({
//         email: req.body.username,
//         password: hash
//     });
//     async function saveUser(){
//         try{
//             const see = await newUser.save()
//             console.log(see);
//             res.render("secrets");
//         }catch(err){   
//             console.log(err);
//         }
//     }
//     saveUser();
// });





/////////////App.post(Login)//////////////////
// const userName = req.body.username;
// const password = req.body.password;

// User.findOne({email:userName}).then(foundUser => {
//     if(foundUser){
//         bcrypt.compare(password, foundUser.password , function(err, result) {
//             if(result === true){
//                 res.render("secrets");
//             }
//         })
//     }else{
//         res.send("User not Found");
//     }
// }).catch(error => {
//     res.send(error);
// })