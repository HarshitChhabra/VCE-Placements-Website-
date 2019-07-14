const mongoose = require('mongoose')
require('mongoose-type-email')

module.exports = mongoose.model('users',new mongoose.Schema({
    email : {type: mongoose.SchemaTypes.Email, required:true},
    userType: {type: String, required: true}
}));