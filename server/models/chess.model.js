const mongoose = require('mongoose');
module.exports = mongoose.model('CurrentGame', new mongoose.Schema({
    name: { type: String },
    pieces1: {type: Object},
    pieces2: { type: Object },
    user1: {type: Boolean, default: false},
    user2: {type: Boolean, default: false},
    currentTurn: {type: Number, default: 1}
}, { timestamps: true }));
