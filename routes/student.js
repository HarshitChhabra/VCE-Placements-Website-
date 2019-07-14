const express = require('express')
const app = express.Router()
const bodyParser = require('body-parser')
const urlEncodedParser = bodyParser.urlencoded({ extended:true })
const mongoose = require('mongoose')
const Schema = mongoose.Schema
const firebase = require('firebase')
const Users = require('../models/users')
const Student = require('../models/studentModel')

const Drive = require('../models/PlacementDrive');

mongoose.connect('mongodb://localhost/webProjTest1' , { useNewUrlParser: true });
    mongoose.connection
    .once('open',() => console.log('Connected'))
    .on('error',() => console.log('Warning',error)); 

app.use('/',function(request,response,next){
    var user = firebase.auth().currentUser;
    if(!user)
        return response.redirect('/');
    var emailId = user.email;
    Users.find({ email: emailId},'userType -_id',function(err,data){
        if(err)
          throw err;
        console.log('YOLO '+data);
        if(data.length>0 && data[0].userType != 'student')
          return response.redirect('/error');
    next();
    })
    //next();//REMOVE THIS
});

app.get("/createProfile",function(req,res){
    var emailId = firebase.auth().currentUser.email;
    //emailId = "harshit.chhabra09@gmail.com"; //REMOVE THIS
    res.render("studentView/createProfile",{email:emailId});
});


app.post('/profile',urlEncodedParser,function(request,response){
    var emailId = firebase.auth().currentUser.email;
    
    var user = firebase.auth().currentUser;
 
    user.updateEmail(request.body.email).then(function() {
    // Update successful.
        Student.findOneAndUpdate({ email : emailId},{
            $set:{
                name: request.body.name,
                email : request.body.email,
                phone : request.body.phone,
                cgpa: request.body.gpa,
                backlogs: request.body.backlogs,
                aboutme : request.body.aboutme,
                achievements: request.body.achievements
            }
        },function(error,data){
            if(error)
                throw error;
            Users.findOneAndUpdate({ email: emailId},{
                $set:{
                    email:request.body.email
                }
            },function(err,data){
                if(err)
                    throw err;
                return response.redirect('/student/profile');
            });
        });
    }).catch(function(error) {
    // An error happened.
        throw error;
    });
    
    //return response.redirect('/404');
});

app.post("/createProfile", urlEncodedParser,function(request,response){
    var student = new Student({
        name: request.body.name,
        rollnum:request.body.rno,
        phone:request.body.phoneno,
        email:request.body.email,
        cgpa: request.body.cgpa,
        backlogs:request.body.backlogs,
        aboutme:request.body.aboutme,
        achievements:request.body.achievements,
    });

    Student.find({rollnum: request.body.rno},function(err,data){
        if(err)
            throw err;
        if(data.length!=0)
            return response.status(400).send('<b style="color:red">Error </b><br>Rno already exists');
        else{
            student.save(function(err){
                if(err)
                    throw err;
                console.log("Successfully saved");
                return response.redirect('/student');
            });
        }
            
    });

});

app.use('/',function(request,response,next){

    var emailId = firebase.auth().currentUser.email; 
    //emailId = "harshit.chhabra09@gmail.com"; //REMOVE THIS
    Student.find( {email:emailId},function(err,data){
        if(err)
            throw err;
        if(data.length==0)
            return response.redirect('/student/createProfile');
        next();
    });
    
});

app.get('/',function(request,response){
    
    response.render('studentView/intro');
    
});

app.get('/companies',function(request,response){

    var emailId = firebase.auth().currentUser.email;
    //emailId="harshit.chhabra09@gmail.com" //REMOVE THIS
    Drive.find({},function(err,compData){
        if(err)
            throw err;
        var alreadyApplied = [];
        var notApplied = [];
        Student.find({ email: emailId},'rollnum -_id',function(err,data){
            if(err)
                throw err;
            var rollnum = data[0]['rollnum'];
            for(var i=0;i<compData.length;i++){
                if(compData[i].applications.includes(rollnum))
                    alreadyApplied.push(compData[i]);
                else
                    notApplied.push(compData[i]);
            }
            return response.render('studentView/student', { companies:notApplied, applied:alreadyApplied });
        });
        
    });
});

app.get('/profile',function(request,response){
    var emailId = firebase.auth().currentUser.email;
    //emailId = "harshit.chhabra09@gmail.com" //REMOVE THIS
    Student.find({ email:emailId },function(err,data){
        if(err)
            throw err;
        console.log(data);
        return response.render('studentView/viewEditProfile', { student:data });
    });

});

app.get('/applied',function(request,response){
    var emailId = firebase.auth().currentUser.email;
    //emailId = "harshit.chhabra09@gmail.com" //REMOVE THIS
    Student.find({ email: emailId},'rollnum -_id',function(err,data){
        if(err)
            throw err;
        var rollnum = data[0]['rollnum'];
        console.log('DATA is '+data);
        console.log(rollnum);
        Drive.find({},'name applications -_id',function(err,compData){
            if(err)
                throw err;
            var toBeSent = [{appliedCompanies : []}];
            for(var i=0;i<compData.length;i++){
                if(compData[i]['applications'].includes(rollnum))
                    toBeSent[0]['appliedCompanies'].push(compData[i]['name']);
            }
            
            return response.render('studentView/appliedCompanies',{companies:toBeSent});
        });
    });
    

});

app.get('/applyCompany/:company',function(request,response){
    var company = request.params.company;
    var emailId = firebase.auth().currentUser.email;
    //emailId = "harshit.chhabra09@gmail.com"; //REMOVE THIS
    Student.find({ email: emailId},'rollnum -_id',function(err,data){
        if(err)
            throw err;
        var rollnum = data[0]['rollnum'];
        Drive.findOneAndUpdate({name : company},{
            $push:{
                applications : rollnum
            }
        },function(err,data){
            if(err)
                throw err;
            return response.redirect('/student/applied');
        });
    });
});

app.use(function(request,response,next){
    return response.redirect('/error');
});

module.exports = app;