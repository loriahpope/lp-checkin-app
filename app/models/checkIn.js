var mongoose     = require('mongoose');
var Schema       = mongoose.Schema;

var CheckInSchema   = new Schema({
    title: {
        type: String,
        required: true
    },
    created_at: {
        type: Date,
        default: Date.now
    },
    updated_at: {
        type: Date
    },
    sentimentScore: Number,
    sentimentRating: String
});

module.exports = mongoose.model('CheckIn', CheckInSchema);