const { Pool } = require('pg');

//  create an instance to
const instance = new Pool ({
  host: '35.155.192.125',
  user: 'postgres',
  password: 'yY2fW4nB7bB2hL8fB3kX7jQ2aO7gH2lN',
  database: 'postgres',
  max: 25,
});

//  connect to the instance and
instance.connect((err, res) => {
  if (err) {
    console.log('ERROR CONNECTING TO DATABASE: ', err)
  }
  else {
    console.log('Successfully connected to database')
  };
});

module.exports = instance;
