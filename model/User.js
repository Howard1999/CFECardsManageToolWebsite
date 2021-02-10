var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var User = new Schema({
    account_type: {type: String, default:'gmail', enum: ['gmail']},
    name: {type: String,
        required: [true, 'User name is required.'],
        min: [1, 'User name at least 1 words.'] ,
        max: [20, 'User name at most 20 words.']},
    email: {type: String,
        required: [true, 'User email is required.']},
    cardSets: {type: [Schema.Types.ObjectId],
        ref: 'CardSet',
        required: [true, 'User cardSets is not define.'],
        maxItems: [10, 'User only allow to have at most 10 cardSets.']}
});

module.exports = mongoose.model('User', User);