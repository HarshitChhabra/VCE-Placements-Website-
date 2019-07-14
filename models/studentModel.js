const mongoose = require('mongoose')
require('mongoose-type-email')
module.exports = mongoose.model('studentDetails1',new mongoose.Schema({
    name : {type: String, required:true},
    rollnum: {type: String, required:true}, //Add validator
    phone : { type:Number, required:true, min: 6000000000, max: 9999999999},
    email : {type: mongoose.SchemaTypes.Email, required:true},
    cgpa : {type: Number, min: 1, max:10, required:true},
    backlogs : {type: Number, min: 0, max: 10 ,required:true},
    aboutme : {type: String, default: ''},
    achievements: {tpye: String, default: ''},
    appliedCompanies : [ String ]
}));