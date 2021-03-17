const express = require('express');
const morgan = require('morgan');
const axios = require('axios');
const path = require('path');
const app = express();
const PORT = 3000;

app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

//  get all questions for a specific id
app.get('/qa/questions', ( req, res ) => {
  res.status(200);
  res.send('Successfully received GET request for all questions');
});

//  get all answers for a specific question id
app.get('/qa/questions/:question_id/answers', ( req, res ) => {
  res.status(200);
  res.send('Successfully received GET request for all answers');
});

//  post a question to a product
app.post('/qa/questions', ( req, res ) => {
  res.status(201);
  res.send('Successfully received POST request for question');
});

//  post an answer to a question
app.post('/qa/questions/:question_id/answers', ( req, res ) => {
  res.status(201);
  res.send('Successfully received POST request for answer');
});

app.put('/qa/questions/:question_id/helpful', ( req, res ) => {
  res.status(204);
  res.send('Successfully received PUT request for question helpfulness');
});

app.put('/qa/questions/:question_id/report', ( req, res ) => {
  res.status(204);
  res.send('Successfully received PUT request for question report');
});

app.put('/qa/answer/:answer_id/helpful', ( req, res ) => {
  res.status(204);
  res.send('Successfully received PUT request for answer helpfulness');
});

app.put('/qa/answer/:answer_id/report', ( req, res ) => {
  res.status(204);
  res.send('Successfully received PUT request for answer report');
});

app.listen(PORT, () => {
  console.log(`Listening on port: ${PORT}`);
});