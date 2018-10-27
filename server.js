"use strict";

const express = require("express");
const mongoose = require("mongoose");

mongoose.Promise = global.Promise;

const {PORT, DATABASE_URL} = require("./config");
const {Blogpost} = require("./models");

const app = express();
app.use(express.json());

app.get("/", (req, res) => {
    res.sendFile(__dirname + '/views/index.html');
  });

app.get("/blogposts", (req, res) => {
    Blogpost.find()
        .then(blogposts => {
            res.json({
                blogposts: blogposts.map(blogpost => blogpost.serialize())
            });
        })
        .catch(err => {
            console.error(err);
            res.status(500).json({ message: "Internal server error" });
          });
});

app.get("/blogposts/:id", (req, res) => {
    Blogpost
        .findById(req.params.id)
        .then(blogpost => res.json(blogpost.serialize()))
        .catch(err => {
            console.error(err);
            res.status(500).json({ message: "Internal server error" });
          });
});

app.post("/blogposts", (req, res) => {
    const requiredFields = ["title", "content", "author"];
    for (let i = 0; i < requiredFields.length; i++) {
        const field = requiredFields[i];
        if (!(field in req.body)) {
          const message = `Missing \`${field}\` in request body`;
          console.error(message);
          return res.status(400).send(message);
        }
      }
    Blogpost.create({
        title: req.body.title,
        content: req.body.content,
        author: {
            firstName: req.body.author.firstName,
            lastName: req.body.author.lastName
        }
    })
    .then(blogpost => res.status(201).json(blogpost.serialize()))
    .catch(err => {
      console.error(err);
      res.status(500).json({ message: "Internal server error" });
    });
});

app.put("/blogposts/:id", (req, res) => {
    // ensure that the id in the request path and the one in request body match
    if (!(req.params.id && req.body.id && req.params.id === req.body.id)) {
      const message =
        `Request path id (${req.params.id}) and request body id ` +
        `(${req.body.id}) must match`;
      console.error(message);
      return res.status(400).json({ message: message });
    }
  
    const toUpdate = {};
    const updateableFields = ["title", "content", "author"];
  
    updateableFields.forEach(field => {
      if (field in req.body) {
        toUpdate[field] = req.body[field];
      }
    });
  
    Blogpost
      .findByIdAndUpdate(req.params.id, { $set: toUpdate }, {new: true})
      .then(blogpost => res.status(200).json(blogpost.serialize()))
      .catch(err => res.status(500).json({ message: "Internal server error" }));
  });
  
  app.delete("/blogposts/:id", (req, res) => {
    Blogpost.findByIdAndRemove(req.params.id)
      .then(blogpost => res.status(204).end())
      .catch(err => res.status(500).json({ message: "Internal server error" }));
  });

let server;

// this function connects to our database, then starts the server
function runServer(databaseUrl, port = PORT) {
  return new Promise((resolve, reject) => {
    mongoose.connect(
      databaseUrl,
      err => {
        if (err) {
          return reject(err);
        }
        server = app
          .listen(port, () => {
            console.log(`Your app is listening on port ${port}`);
            resolve();
          })
          .on("error", err => {
            mongoose.disconnect();
            reject(err);
          });
      }
    );
  });
}

// this function closes the server, and returns a promise. we'll
// use it in our integration tests later.
function closeServer() {
  return mongoose.disconnect().then(() => {
    return new Promise((resolve, reject) => {
      console.log("Closing server");
      server.close(err => {
        if (err) {
          return reject(err);
        }
        resolve();
      });
    });
  });
}

// if server.js is called directly (aka, with `node server.js`), this block
// runs. but we also export the runServer command so other code (for instance, test code) can start the server as needed.
if (require.main === module) {
  runServer(DATABASE_URL).catch(err => console.error(err));
}

module.exports = { app, runServer, closeServer };
