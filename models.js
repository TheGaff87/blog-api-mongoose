"use strict";

const mongoose = require("mongoose");

//schema for blog posts
const blogpostSchema = mongoose.Schema({
    title: {type: String, required: true},
    content: {type: String, required: true},
    author: {
        firstName: {type: String, required: true},
        lastName: {type: String, required: true}
    },
    created: {type: Date, default: Date.now}
});

//virtual to return author's name as one string
blogpostSchema.virtual("authorString").get(function() {
    return `${this.author.firstName} ${this.author.lastName}`.trim();
});

blogpostSchema.methods.serialize = function() {
    return {
        title: this.title,
        content: this.content,
        author: this.authorString,
        created: this.created    
    };
};

const Blogpost = mongoose.model("Blogpost", blogpostSchema);

module.exports = {Blogpost};