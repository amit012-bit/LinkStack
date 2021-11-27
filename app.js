const express = require("express");
const morgan = require("morgan");
const axios = require("axios");
var cookieParser = require('cookie-parser')
var _ = require('lodash');
const { JWT_LOGIN_Secret, LOGIN_MAXAGE, dbURI, JWT_VERIFICATION_Secret, VERIFICATION_MAXAGE } = require("./config");
require("dotenv").config();


//Files
const Account = require('./models/account');
const {sendEmailVerificationLink}= require('./utils/emailController');

const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");


const app = express();


app.use(morgan("dev"));
app.use(express.static('public'));
app.use(express.urlencoded({extended:false}));
app.use(express.json());
app.use(cookieParser());
app.set("view engine", "pug");
app.set("json spaces", 2);


mongoose.connect(dbURI, { useNewUrlParser: true, useUnifiedTopology: true})
  .then((result) => {
    console.log('Connected to MongoDB.....');
    app.listen(process.env.PORT || 80, () => {
      console.log(`Listening at.... http://localhost:${process.env.PORT || 80}`);
    });
  })
  .catch((err) => console.log(err));


/*

app.get("/", async (req, res) => {
  // res.send(req.headers);
  let api_url = `${req.headers['x-forwarded-proto']||'http'}://${req.headers.host}/api/info`;
  try {
    let startDate = new Date();
    const response = await axios.get(api_url);
    let endDate = new Date();
  
    let mypage = ``;
    mypage+=`---- START TIME = ${startDate.toISOString()} <br>`;
    mypage+=`---- END TIME= ${endDate.toISOString()} <br>`;
    mypage+=`RESPONSE TIME = ${endDate - startDate} <br><br><br>`;
  
  
    mypage+=`Path /api/info <br><br>`;
    mypage+=`Data <br><br>`;
    mypage+=`${response.data}`;
    res.send(mypage);
  } catch (error) {
    console.log(error);
    res.send(error);
  }

});

*/

app.get("/", (req, res) => {
  res.render('index');
});


const autoLogin = (req,res) => {
  
}

const createLoginToken = (id) => {
  return jwt.sign({ id }, JWT_LOGIN_Secret , {
    expiresIn: LOGIN_MAXAGE,
  });
};

const createVerificationToken = (id) => {
  return jwt.sign({ id }, JWT_VERIFICATION_Secret, {
    expiresIn: VERIFICATION_MAXAGE,
  });
};


app.get("/login",(req,res)=>{

  if(autoLogin(req,res))
  {
    console.log("Logged IN");
  }
  else
  {
    console.log("Not Logged In");
  }
  res.render('login');
});

app.post("/login",async (req,res)=>{
  const {username,password} = req.body;
  if(!username || !password)
  {
    res.send("Enter Username and Password");
    return;
  }
  
  try {
    const user = await Account.login(username,password);
    if(user)
    {
      res.send(user);
    }

  } catch (error) {
    console.log(error.message);
    res.send("Invalid Username or Password");
  }


});



app.get("/signup",(req,res)=>{

  res.render('signup');
});


app.post("/signup",async (req,res)=>{
  const {username,password,email} = req.body;

  if(!username || !password || !email)
  {
    res.status(404);
    res.send("Enter Username , Password, Email");
    return;
  }

  try
  {
    const user = await Account.create({username,password,email});
    if(user)
    {
      console.log("Account Created Successfully ... ");
      // console.log(user_id);
      // res.send(user_id);
      const VToken = createVerificationToken(user._id);

      sendEmailVerificationLink(email,VToken, (response) => {
        console.log("==== app.js ======");
        console.log(response);
        if (response == 200) {
          res.send("Verification Email Successfully Sent!");
        } else {
          // Account Created Successfully But Failed to Send Verification Email
          res.sendStatus(404);
        }
      });

    }
    else
    {
      console.log("Something Went Wrong!");
      res.sendStatus(404);
    }
  }catch(error)
  {
    console.log(error);

    let outmsg = [];

    if (error.code && error.code === 11000) 
    {
      if('username' in error.keyPattern)
      {
        outmsg.push('Username is Already In Use');
      }

      if('email' in error.keyPattern)
      {
        outmsg.push('Email is Already In Use');
      }
    }

    if(error.errors)
    {
      if(error.errors['username'])
      {
        console.log(error.errors['username'].message);
        outmsg.push(error.errors['username'].message);
      }

      if(error.errors['email'])
      {
        console.log(error.errors['email'].message);
        outmsg.push(error.errors['email'].message);
      }

      if(error.errors['password'])
      {
        console.log(error.errors['password'].message);
        outmsg.push(error.errors['password'].message);
      }
    }
    res.status(404);
    res.send({"msg":"Please enter valid information","errors":outmsg});
  }
});


app.get("/forgot-password",(req,res)=>{
  if(_.isEmpty(req.query) == false)
  {
    // With Parameters

    console.log("With Parameters");
    console.log(req.query);
  }
  else
  {
    // Without Parameters

    console.log("No Parameters");
    console.log("EMPTY");
  }
});


app.post("/reset-password",(req,res)=>{


});

app.get("/verify",(req,res)=>{

});



app.get("/dashboard", async (req, res) => {

});