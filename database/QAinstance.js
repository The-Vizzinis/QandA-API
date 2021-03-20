const { Client } = require('pg');

//  create an instance to
const instance = new Client ({
  host: 'localhost',
  user: 'postgres',
  password: 'password',
  database: 'qa_db',
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
