const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const PushHistorySchema = new Schema({
    type: {
        type: String,
        required: true,
    },
    time: {
        type: String,
        required: true,
    },
    content: {
        type: String,
        required: true,
        unique: true
    },
    articles: {
        type: Array,
        required: true,
    },
}, { collection: 'historyByDay' })

module.exports = mongoose.model('PushHistory', PushHistorySchema);
