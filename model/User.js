var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var User = new Schema({
    _id: {type: String,
        required: true},
    type: {type: String, default: 'normal', enum:['normal', 'admin']},
    name: {type: String, required: true, 
        minlength:2, maxlength:10},
    gmail: {type: String, required: true},
    creat_time: {type: Date, default: Date.now}
});

module.exports = mongoose.model('User', User);