const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  room: String,
  date: String,
  startTime: Date,
  endTime: Date
});

const Booking = mongoose.model('Booking', bookingSchema);

module.exports = Booking;
