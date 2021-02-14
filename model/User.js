var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var User = new Schema({
    accountType: {type: String, default:'gmail', enum: ['gmail']},
    name: {type: String,
        required: [true, 'User name is required.'],
        min: [1, 'User name at least 1 words.'] ,
        max: [20, 'User name at most 20 words.']},
    email: {type: String,
        required: [true, 'User email is required.']}
});

module.exports = mongoose.model('User', User);