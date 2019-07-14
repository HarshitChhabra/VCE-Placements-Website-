const mongoose = require('mongoose')
const Schema = mongoose.Schema

module.exports = mongoose.model('DriveTest1',new Schema({
        name: {type: String, required:true},
        gpa : { type: Number, required: true},
        branches: [ String ],
        package: { type:Number, required: true},
        fromDate: {type: Date, required: true},
        endDate: {type: Date, required:true},
        qualifications : {type: String, required:true},
        jobDescription: {type: String, required:true},
        applications: [ String ]
}));