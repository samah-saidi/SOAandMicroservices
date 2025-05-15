// Modèle mongoose pour Article
const mongoose = require('mongoose');

const ArticleSchema = new mongoose.Schema({
  nom_art: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  prix: {
    type: Number,
    required: true,
    min: 0
  },
  stock: {
    type: Number,
    required: true,
    default: 0,
    min: 0
  },
  categorie_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true
  },
  image_url: {
    type: String,
    default: ''
  },
  tags: [{
    type: String,
    trim: true
  }],
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
ArticleSchema.pre('save', function(next) {
  if (this.isModified() && !this.isNew) {
    this.date_modification = Date.now();
  }
  next();
});

// Méthodes virtuelles et statiques
ArticleSchema.virtual('id').get(function() {
  return this._id.toHexString();
});

// Configuration pour que les virtuals soient inclus dans les conversions toJSON
ArticleSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: function(doc, ret) {
    delete ret._id;
  }
});

module.exports = mongoose.model('Article', ArticleSchema);