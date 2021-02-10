var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var ServerLog = new Schema({
    time: {type: Date, default: Date.now},
    type: {type: String, default: 'normal',
            enum:['normal','error',

                  'sign in-success',
                  'sign in-user not exsist',
                  'sign in-error',
                  
                  'sign up-success',
                  'sign up-user exsist',
                  'sign up-error',

                  'sign out',

                  'DB error', 'Google OAuth2 error']},
    requestIP: {type: String, default: 'Null'},
    recordBy: {type: String, required: true},
    content: {type: String, required: true}
});

module.exports = mongoose.model('ServerLog', ServerLog);