import mongoose from 'mongoose';

const educationSchema = new mongoose.Schema({
  school: {
    type: String,
    trim: true
  },
  degree: {
    type: String,
    trim: true
  },
  fieldOfStudy: {
    type: String,
    trim: true
  },
  startYear: {
    type: String,
    trim: true
  },
  endYear: {
    type: String,
    trim: true
  }
});

const experienceSchema = new mongoose.Schema({
  title: {
    type: String,
    trim: true
  },
  company: {
    type: String,
    trim: true
  },
  location: {
    type: String,
    trim: true
  },
  startDate: {
    type: String,
    trim: true
  },
  endDate: {
    type: String,
    trim: true
  },
  description: {
    type: String,
    trim: true
  }
});

const profileSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  bio: {
    type: String,
    trim: true
  },
  profileImage: {
    type: String,
    default: ''
  },
  education: [educationSchema],
  experience: [experienceSchema],
  skills: [{
    type: String,
    trim: true
  }],
  socialLinks: {
    website: String,
    twitter: String,
    linkedin: String,
    github: String
  }
}, { timestamps: true });

export default mongoose.model('Profile', profileSchema);
