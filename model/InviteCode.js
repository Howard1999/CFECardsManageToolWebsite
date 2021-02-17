var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var InviteCode = new Schema({
    code: {type: String, required: true, minlength:11, maxlength:11}
});

module.exports = mongoose.model('InviteCode', InviteCode);