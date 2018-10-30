"use strict";

const mongoose = require("mongoose");

//author schema
const authorSchema = mongoose.Schema({
    firstName: 'string',
    lastName: 'string',
    userName: {
      type: 'string',
      unique: true
    }
  });
  
  //comment schema
  const commentSchema = mongoose.Schema({ content: 'string' });
  
  //blogpost schema
  const blogpostSchema = mongoose.Schema({
    title: 'string',
    content: 'string',
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'Author' },
    comments: [commentSchema],
    created: {type: Date, default: Date.now}
  });

  blogpostSchema.pre('find', function(next) {
    this.populate('author');
    next();
  });
  
  blogpostSchema.pre('findOne', function(next) {
    this.populate('author');
    next();
  });

//virtual to return author's name as one string
blogpostSchema.virtual("authorString").get(function() {
    return `${this.author.firstName} ${this.author.lastName}`.trim();
});

const Author = mongoose.model('Author', authorSchema);
const Blogpost = mongoose.model('Blogpost', blogpostSchema);

module.exports = {Author, Blogpost};