require('dotenv').config();
const express = require('express');
const morgan = require('morgan');

const app = express();
const Note = require('./models/note');

/* middleware */
app.use(express.static('build'));
app.use(express.json());

morgan.token('body', (req, res) => `body: ${JSON.stringify(req.body)}`);

app.use(morgan((tokens, req, res) => {
  return [
    tokens.method(req, res),
    tokens.url(req, res),
    tokens.status(req, res),
    tokens.res(req, res, 'content-length'), '-',
    // tokens['response-time'](req, res), 'ms',
    tokens.body(req, res),
  ].join(' ')
}));

/* Routes */
app.get('/', (request, response) => {
  response.send('<h1>Hola World!</h1>')
});

app.get('/api/notes', (request, response) => {
  
  Note.find({}).then(notes => {
    response.json(notes);
  });
});

app.get('/api/notes/:id', (request, response, next) => {
  
  Note.findById(request.params.id).then(note => {
    if (note) {
      response.json(note)
    } else {
      response.status(404).end()
    }
  })
  // .catch(error => {
  //   console.log('error', error);
  //   response.status(400).send({ error: 'malformatted id' });
  // })
  .catch(error => next(error))
});

app.delete('/api/notes/:id', (request, response, next) => {

  Note.findByIdAndRemove(request.params.id)
    .then(result => response.status(204).end())
    .catch(error => next(error))

});

app.post('/api/notes', (request, response) => {
 
  const body = request.body;

  if (body.content === undefined) {
    return response.status(400).json({
      error: 'content missing'
    })
  }

  const note = new Note({
    content: body.content,
    important: body.important || false,
    date: new Date()
  });
  
  note.save().then(savedNote => {
    response.json(note);
  });
});

app.put('/api/notes/:id', (request, response, next) => {
  const body = request.body;

  const note = {
    content: body.content,
    important: body.important,
  }

  Note.findByIdAndUpdate(request.params.id, note, { new: true })
  .then(updatedNote => response.json(updatedNote))
  .catch(error => next(error))
});

/* middleware postroutes */

const unknownEndpoint = (request, response) => {
  response.status(404).send({ 
    error: 'unknown endpoint' 
  });
}
// handler of requests with unknown endpoint
app.use(unknownEndpoint);

const errorHandler =(error, request, response, next) => {
  console.log('errorHandler');
  console.error(error.message);

  if(error.name  === 'CastError') {
    return response.status(400).send({ error: 'malformatted id' })
  }

  next(error)
}

// handler of requests with result to errors
app.use(errorHandler);

/* Server */
const PORT = process.env.PORT || 3001;
app.listen(PORT);
console.log(`Server running on port ${PORT}`);