// Modèle mongoose pour Category
const mongoose = require('mongoose');

const CategorySchema = new mongoose.Schema({
  nom: {
    type: String,
    required: true,
    trim: true,
    unique: true
  },
  description: {
    type: String,
    default: ''
  },
  image_url: {
    type: String,
    default: ''
  },
  date_creation: {
    type: Date,
    default: Date.now
  },
  date_modification: {
    type: Date,
    default: Date.now
  }
});

// Middleware pour mettre à jour automatiquement la date de modification
CategorySchema.pre('save', function(next) {
  if (this.isModified() && !this.isNew) {
    this.date_modification = Date.now();
  }
  next();
});

// Méthodes virtuelles
CategorySchema.virtual('id').get(function() {
  return this._id.toHexString();
});

// Configuration pour que les virtuals soient inclus dans les conversions toJSON
CategorySchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: function(doc, ret) {
    delete ret._id;
  }
});

module.exports = mongoose.model('Category', CategorySchema);