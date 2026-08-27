const mongoose = require('mongoose');

const availabilitySchema = new mongoose.Schema({
  day: {
    type: String,
    enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
    required: true
  },
  slots: [
    {
      type: String
    }
  ]
});

const doctorSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    specialization: {
      type: String,
      required: [true, 'Specialization is required'],
      trim: true
    },
    qualification: {
      type: String,
      default: 'MBBS, MD'
    },
    experience: {
      type: Number, // Years of experience
      default: 5
    },
    consultationFee: {
      type: Number,
      default: 500
    },
    profileImage: {
      type: String,
      default: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=400&auto=format&fit=crop&q=80'
    },
    bio: {
      type: String,
      default: 'Experienced healthcare professional dedicated to delivering comprehensive medical care.'
    },
    availability: [availabilitySchema]
  },
  {
    timestamps: true
  }
);

doctorSchema.index({ userId: 1 });
doctorSchema.index({ specialization: 1 });

module.exports = mongoose.model('Doctor', doctorSchema);
