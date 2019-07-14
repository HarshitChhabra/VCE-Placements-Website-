const express = require('express')
const bodyParser = require('body-parser')
const mongoose = require('mongoose')
const faculty = require('./routes/faculty')
const student = require('./routes/student')
const firebase = require('firebase')
const jwt = require('jsonwebtoken')
const Users = require('./models/users')
const Students  = require('./models/studentModel')

const urlEncodedParser = bodyParser.urlencoded({ extended: true })
const port = process.env.PORT || 2564;


app = express();

app.use('/assets',express.static(__dirname + '/public'));
app.set('view engine','ejs');

const config = {

};
firebase.initializeApp(config);

app.post('/login',urlEncodedParser,function(req,res){
  console.log('got post');
 var email=req.body.Email1;
 var pass=req.body.Password1;
 const auth = firebase.auth();

 const promise = auth.signInWithEmailAndPassword(email,pass).then( function(result){
    console.log('Logged in');
    return res.redirect('/');
 },function(error){
    console.log('Login failed');
    console.log(error);
    return res.redirect('/');
 });
});

app.post('/signup',urlEncodedParser,function(req,response){
  var emailID=req.body.Email;
  var pass=req.body.Password;
  const auth = firebase.auth();
  Users.find({email:emailID},function(err,data){
      if(err)
        throw err;
      if(data.length!=0)
        return response.render('login',{error:'Email Id already registered'});
      const promise = auth.createUserWithEmailAndPassword(emailID,pass).then(function(result){
        console.log('SIGNUP SUCCESSFUL');
        var newStudent = new Users ({
            email:emailID,
            userType: 'student'
        });
        newStudent.save(function(err){
          if(err)
            throw err;
            console.log('New Student Added');
            return response.redirect('/');
        });
      },function(error){
        console.log('SIGNUP FAILED');
        return response.redirect('/');
      });
      
  });
});

app.use('/',function(request,response,next){
  var user = firebase.auth().currentUser;
  console.log(request.path);
  if(!user){
      console.log('rendering login as user not signed in');
      if(request.path == '/login')
        return response.render('login');
      else
        return response.redirect('/login');
  }
  //next(); //REMOVE THIS
});

app.get('/login',function(request,response){
  //return response.render('404');
    var user = firebase.auth().currentUser;
    if(!user)
      return response.render('login');
    else{
      var emailId =  user.email;
      Users.find({ email: emailId},'userType -_id',function(err,data){
         if(err)
           throw err;
         if(data.length>0 && data[0].userType == 'faculty')
           return response.redirect('/faculty');
         else
           return response.redirect('/student');
    });
  }
  //return response.redirect('/student'); //REMOVE THIS
});
  
app.get('/logout',function(request,response){
    if(!firebase.auth().currentUser)
      return response.redirect('/');
    firebase.auth().signOut()
      .then(function(){
        console.log('logout successful');
        return response.redirect('/');
      },function(error){
        console.log('logout unsuccessful');
        console.log(error);
        return response.redirect('/');
      });
});

app.get('/signup',function(request,response){
  response.redirect('/');
});

app.use('/faculty',faculty);
app.use('/student',student);

app.get('/',function(request,response){
   var user = firebase.auth().currentUser;
   var emailId =  user.email;
   Users.find({ email: emailId},'userType -_id',function(err,data){
      if(err)
        throw err;
      if(data.length>0 && data[0].userType == 'faculty')
        return response.redirect('/faculty');
      else
        return response.redirect('/student');
  })
  //return response.redirect('/student'); //REMOVE THIS
});

app.use(function(request,response,next){
    return response.render('404');
});

app.listen(port);