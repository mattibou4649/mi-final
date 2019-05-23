const mongoose = require('mongoose');

const min = 2;

const ScoreSchema = new mongoose.Schema({
    userWon: {
        type: String,
        required: true,
        min
    },
    score: {
        type: String,
        required: true,
        min
    },
    userLost: {
        type: String,
        required: true,
        min
    }
});

var Score = mongoose.model('score', ScoreSchema);

module.exports = Score;