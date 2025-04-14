const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true
  },
  author: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    min: [0, 'Price cannot be negative']
  },
  stock: {
    type: Number,
    default: 0
  }
}, { timestamps: true });

module.exports = mongoose.model('Book', bookSchema);