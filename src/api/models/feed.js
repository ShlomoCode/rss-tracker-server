const mongoose = require('mongoose');

const feedSchema = mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    title: { type: String, required: true },
    url: { type: String, match: /^https?:\/\/\w+\.\w{1,6}/ },
    LastCheckedOn: { type: Date, default: Date.now },
    Subscribers: { type: Array }
});

module.exports = mongoose.model('Feed', feedSchema);