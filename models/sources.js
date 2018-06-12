const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const SourceSchema = new Schema({
  title: {
    type: String,
    required: true,
  },
  url: {
    type: String,
    required: true,
    unique: true
  },
  link: {
    type: String,
    required: true,
  },
  weight: {
    type: Number,
    required: true,
  },
}, {collection: 'source'})

module.exports = mongoose.model('Source', SourceSchema);
