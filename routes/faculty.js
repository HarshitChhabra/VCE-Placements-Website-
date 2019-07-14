const express = require('express')
const mongoose = require('mongoose')
const bodyParser = require('body-parser')
const nodemailer = require('nodemailer')
const bcrypt = require('bcryptjs')
const urlEncodedParser = bodyParser.urlencoded({ extended: false })
const Schema = mongoose.Schema
const firebase = require('firebase')
const Users = require('../models/users')
const Drive = require('../models/PlacementDrive');
const Student = require('../models/studentModel')

const app = express.Router();


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
        if(data.length>0 && data[0].userType != 'faculty')
          return response.redirect('/errorPage');
    next();
    })
    //next();//REMOVE THIS
});

app.get('/',function(request,response){

    response.render('facultyView/intro');
});

app.get('/drives',function(request,response){
    Drive.find({},function(err,data){
        if(err)
            throw err;
        response.render('facultyView/faculty',{ companies:data });
    });
});

app.get('/applications',function(request,response){
    Drive.find({},'name -_id',function(err,data){
        if(err)
            throw err;
        //console.log(data);
        response.render('facultyView/applications',{ companies:data });
    });
});

app.get('/delete-drive/delete/:id',function(request,response){
    Drive.find({ name: request.params.id },function(err,data){
        if(err)
            return request.status(404).send("Company doesn't exist");
        //console.log(data);
        response.render('facultyView/confirmDelete',{ company:data });
    });

});

app.post('/delete-drive/delete/:id',function(request,response){
    console.log('got delete req');
    Drive.deleteOne({name:request.params.id},function(err){
        if(err)
            throw err;
        console.log('Successfully deleted');
        return response.redirect('/faculty');
    });
});

app.get('/add-drive',function(request,response){
    //console.log(request);
    console.log('addDrive req');
    response.render('facultyView/addDrive');
});

app.post('/add-drive', urlEncodedParser, function(request,response){
    //console.log(request.body);


    var branches=[];
    if(request.body.cseCheck)
        branches.push('CSE')
    if(request.body.itCheck)
        branches.push('IT')
    if(request.body.civilCheck)
        branches.push('CIVIL')
    if(request.body.mechCheck)
        branches.push('Mechanical')
    if(request.body.eceCheck)
        branches.push('ECE')
    if(request.body.eeeCheck)
        branches.push('EEE')
    if(branches.length==0)
        response.status(400).send('No branches selected');
    var drive = new Drive({
        name: request.body.name,
        gpa: request.body.gpa,
        branches: branches,
        package: request.body.package,
        fromDate: request.body.fromdate,
        endDate: request.body.enddate,
        qualifications: request.body.qualifications,
        jobDescription: request.body.jobdesc
    });

    Drive.find({name: request.body.name},function(err,data){
        if(err)
            throw err;
        console.log(data,data.length);
        if(data.length!=0)
            response.status(400).send('Company already exists');
        else
            saveDrive(drive,response);
    });

   
});

app.get('/notify',function(request,response){

    Student.find({},function(err,students){
        if(err)
            throw err;
        Drive.find({},function(err,companies){
            if(err)
                throw err;
            mailList= [];
            for(var i=0;i<students.length;i++){
                applicableCompanies=[];
                console.log('student '+students[i].email);
                for(var j=0;j<companies.length;j++)
                    if(students[i].cgpa>=companies[j].gpa)
                        applicableCompanies.push(companies[j].name);
                mailList.push({email:students[i].email,applicable : applicableCompanies});
            }
            console.log(mailList);
            sendMails(mailList);
            response.send();
        });
    });
    
});

app.get('/:company',function(request,response){
    var company = request.params.company;
    Drive.find({ name : company },'applications -_id',function(err,data){
        if(err)
            throw err;
        if(data.length==0)
            return response.redirect('/error');
        response.send(JSON.stringify(data));
    });
});

app.get('/student/:rno',function(request,response){
    var rollnumber = request.params.rno;
    Student.find({ rollnum : rollnumber },function(err,data){
        if(err){
            console.log(err);
            return response.redirect('/404');
            //throw err;
        }
        console.log(data);
        if(data.length == 0)
            return response.redirect('/404');
        return response.render('facultyView/studentProfile', { student:data });
    });

});

function saveDrive(drive,response){
    drive.save(function(err){
        if(err)
            throw err;
        console.log("Successfully saved");
        response.redirect('/faculty');
    });
}

function sendMails(data){
    var transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user:'<email>',
            pass: '<password>'
        }
    });
    for(var i=0;i<data.length;i++){
        if(data[i].applicable.length == 0)
            continue;
        const mailOptions = {
            from: '<email>',
            subject: '<NodeJS PROJ> Placement Drives',
        };
        mailOptions.to = data[i].email;
        var message = '<p>Hii </p> <p>This is regarding the placement drive going on in the college<p><br><p>You can apply for the following companies: </p>';
        for(var j=0;j<data[i].applicable.length;j++){
            message+='<p><b>'+data[i].applicable[j]+'</b></p>';
        }
        message+='<p>Apply for those companies before the drive ends.</p><p>Regards,</p><p>VCE Placement Cell</p>';
        mailOptions.html = message;
        transporter.sendMail(mailOptions, function(err,info){
            if(err){
                console.log(err);
                return response.send('mail could not be sent');
            }
            else
                console.log(info);
        });
    }
    //return response.send('mail sent');
}

app.use(function(request,response,next){
    return response.redirect('/error');
});

module.exports = app;