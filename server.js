"use strict";

const express = require("express");
const mongoose = require("mongoose");

mongoose.Promise = global.Promise;

const {PORT, DATABASE_URL} = require("./config");
const {Blogpost} = require("./models");
const {Author} = require("./models");

const app = express();
app.use(express.json());

app.get("/", (req, res) => {
    res.sendFile(__dirname + '/views/index.html');
  });

app.get("/posts", (req, res) => {
    Blogpost
        .find()
        .then(blogposts => {
              res.json(blogposts.map(blogpost => {
                return {
                  id: blogpost._id,
                  author: blogpost.authorString,
                  content: blogpost.content,
                  title: blogpost.title,
                  created: blogpost.created
                };
              }))
            })
        
        .catch(err => {
            console.error(err);
            res.status(500).json({ message: "Internal server error" });
          });
});

app.get("/posts/:id", (req, res) => {
    Blogpost
        .findById(req.params.id)
        .then(blogpost => res.json({
          id: blogpost._id,
          title: blogpost.title,
          content: blogpost.content,
          author: blogpost.authorString,
          created: blogpost.created,
          comments: blogpost.comments
      }))
        .catch(err => {
            console.error(err);
            res.status(500).json({ message: "Internal server error" });
          });
});

app.post("/posts", (req, res) => {
    const requiredFields = ["title", "content", "author_id"];
    for (let i = 0; i < requiredFields.length; i++) {
        const field = requiredFields[i];
        if (!(field in req.body)) {
          const message = `Missing \`${field}\` in request body`;
          console.error(message);
          return res.status(400).send(message);
        }
      };

      Author
        .findById(req.body.author_id)
        .then(author => {
          if (author) {
            Blogpost
              .create({
                title: req.body.title,
                content: req.body.content,
                author: req.body.author_id
              })
              .then(blogpost => res.status(201).json({
                id: blogpost._id,
                title: blogpost.title,
                content: blogpost.content,
                author: `${author.firstName} ${author.lastName}`,
                created: blogpost.created,
                comments: blogpost.comments
            }))
              .catch(err => {
                console.error(err);
                res.status(500).json({ message: "Internal server error" });
             });
          }
          else {
            const message = `Author not found`;
            console.error(message);
            return res.status(400).send(message);
          }
        })
        .catch(err => {
          console.error(err);
          res.status(500).json({ error: "Internal server error" });
        });
});

app.put("/posts/:id", (req, res) => {
    // ensure that the id in the request path and the one in request body match
    if (!(req.params.id && req.body.id && req.params.id === req.body.id)) {
      const message =
        `Request path id (${req.params.id}) and request body id ` +
        `(${req.body.id}) must match`;
      console.error(message);
      return res.status(400).json({ message: message });
    }
  
    const toUpdate = {};
    const updateableFields = ["title", "content"];
  
    updateableFields.forEach(field => {
      if (field in req.body) {
        toUpdate[field] = req.body[field];
      }
    });
  
    Blogpost
      .findByIdAndUpdate(req.params.id, { $set: toUpdate }, {new: true})
      .populate('author')
      .then(blogpost => res.status(200).json({
        id: blogpost._id,
        title: blogpost.title,
        content: blogpost.content,
        author: blogpost.authorString,
        created: blogpost.created
    }))
      .catch(err => res.status(500).json({ message: "Internal server error" }));
  });
  
app.delete("/posts/:id", (req, res) => {
    Blogpost.findByIdAndRemove(req.params.id)
      .then(blogpost => res.status(204).end())
      .catch(err => res.status(500).json({ message: "Internal server error" }));
  });

  app.post("/authors", (req, res) => {
    const requiredFields = ["firstName", "lastName", "userName"];
    for (let i = 0; i < requiredFields.length; i++) {
        const field = requiredFields[i];
        if (!(field in req.body)) {
          const message = `Missing \`${field}\` in request body`;
          console.error(message);
          return res.status(400).send(message);
        }
      };

    Author
      .findOne({userName: req.body.userName})
      .then(userName => {
        if (userName) {
          const message = `Username already exists`;
          console.error(message);
          return res.status(400).send(message);  
        } else {
          Author
          .create({
            firstName: req.body.firstName,
            lastName: req.body.lastName,
            userName: req.body.userName
          })
          .then(author => res.status(201).json({
            id: author._id,
            name: `${author.firstName} ${author.lastName}`,
            userName: author.userName
        }))
          .catch(err => {
            console.error(err);
            res.status(500).json({ message: "Internal server error" });
         });
      };
    });
  });

  app.put("/authors/:id", (req, res) => {
    // ensure that the id in the request path and the one in request body match
    if (!(req.params.id && req.body.id && req.params.id === req.body.id)) {
      const message =
        `Request path id (${req.params.id}) and request body id ` +
        `(${req.body.id}) must match`;
      console.error(message);
      return res.status(400).json({ message: message });
    }
    
    
    const toUpdate = {};
    const updateableFields = ["firstName", "lastName", "userName"];
  
    updateableFields.forEach(field => {
      if (field in req.body) {
        toUpdate[field] = req.body[field];
      }
    });
  
    Author
      .findOne({userName: req.body.userName})
      .then(userName => {
        if (userName) {
          const message = `Username already exists`;
          console.error(message);
          return res.status(400).send(message);  
        } else {
            Author
              .findByIdAndUpdate(req.params.id, { $set: toUpdate }, {new: true})
              .then(author => res.status(200).json({
                id: author._id,
                name: `${author.firstName} ${author.lastName}`,
                userName: author.userName
    }))
      .catch(err => res.status(500).json({ message: "Internal server error" }));
    }
  });
});

app.delete('/authors/:id', (req, res) => {
  Blogpost
    .remove({ author: req.params.id })
    .then(() => {
      Author
        .findByIdAndRemove(req.params.id)
        .then(() => {
          console.log(`Deleted author with id \`${req.params.id}\` and associated blog posts`);
          res.status(204).json({ message: 'success' });
        });
    })
    .catch(err => {
      console.error(err);
      res.status(500).json({ error: 'Internal Server Error' });
    });
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
