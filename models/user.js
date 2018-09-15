const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const UserSchema = new Schema({
    user: {
        type: String,
        required: true,
    },
    pwd: {
        type: String,
        required: true,
        unique: true
    },
    sendKey: {
        type: String,
        required: true,
    },
}, { collection: 'githubInfo' })

module.exports = mongoose.model('User', UserSchema);
