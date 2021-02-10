var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var CardSet = new Schema({
    owner: {type: Schema.Types.ObjectId, ref: 'User'},
    name: {type: String,
        required: [true, 'CardSet name is required.'],
        min: [3, 'CardSet name at least 3 words.'],
        max: [10, 'CardSet name at most 10 words.']},
    content: {type: [[int]],
        required: [true, 'CardSet has no content.'],
        validation: [cardsetFormatCheck, 'CardSet content format is not correct.']}
    description: {type: String,
        required: false,
        max: [100, 'CardSet description at most 100 words.']}
});
function cardsetFormatCheck(val) {
    var formatCorrect = true;
    if(val.length != 5)formatCorrect = false;
    else{
        for(var i=0; i<5; i++){
            if(val[i].length != 5){
                formatCorrect = false;
                break;
            }
        }
    }
    return formatCorrect;
}

module.exports = mongoose.model('CardSet', CardSet);