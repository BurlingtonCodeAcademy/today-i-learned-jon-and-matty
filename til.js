#!/usr/bin/env node 
/*
  Today I Learned
  a small example of NodeJS using MongoDB

  To install MondoDB:

  * on MacOS with Homebrew, run:
      brew update
      brew install mongodb 
      brew services start mongodb
    
    to fix the error "Permission denied @ dir_s_mkdir - /usr/local/Frameworks", run:
      sudo mkdir /usr/local/Frameworks
      sudo chown $(whoami):admin /usr/local/Frameworks

    to watch the log, run
      tail -f /usr/local/var/log/mongodb/mongo.log

    see https://docs.mongodb.com/manual/tutorial/install-mongodb-on-os-x/#install-with-homebrew


  * all others: 
    see https://docs.mongodb.com/guides/server/install/


  To install locally:
    npm link
  (with homebrew, you may also need to do
    brew unlink node && brew link node
  )

  NodeJS Mongo Driver docs and tutorial:
    https://mongodb.github.io/node-mongodb-native/
    http://mongodb.github.io/node-mongodb-native/3.1/tutorials/crud/
*/
'use strict';

const MongoClient = require('mongodb').MongoClient;
const assert = require('assert');
const moment = require('moment');


// Connection URL
// const url = 'mongodb://$[username]:$[password]@$[hostlist]/$[database]?authSource=$[authSource]';

// see https://devcenter.heroku.com/articles/mongolab
const url = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const dbName = 'til';

// display help and exit
function help() {
  console.log(`Today I Learned
  
  Usage: 
  
  til add "something cool i learned today"
    adds an entry to your TIL DB
  til list
    shows all entries, day by day
  til help
    shows this message
  `)
  process.exit(0);
}

// do something with the database
function connectAnd(callback) {
  MongoClient.connect(url, { useNewUrlParser: true }, function (err, client) {
    assert.equal(null, err);
    // console.log("Connected successfully to database");

    const db = client.db(dbName);
    const collection = db.collection('entries');

    callback(db, collection, () => {
      // console.log('closing connection')
      client.close();
    });
  });
}

// read command line parameters

// console.log(process.argv)
let params = process.argv.slice(2);
let command = params.shift();

if (command === 'help' || !command) {
  help();
}
else if (command === 'add') {
  let text = params.join(' ').trim();
  
  let entry = {
    when: new Date(),
    text: text
  }
  connectAnd((db, collection, callback) => {
    collection.insertOne(entry, (err, r) => {
      assert.equal(null, err);
      assert.equal(1, r.insertedCount);
      callback(); // return to connectAnd to close the connection
    });
  });
}
else if (command === 'list') {
  connectAnd((db, collection, callback) => {

    let cursor = collection.find({}).sort([['when', 1]]);
    let currentDay;

    cursor.forEach(function(entry) {
      let when = moment(entry.when);
      let startOfDay = when.format('YYYYMMDD')
      if (!currentDay || currentDay != startOfDay) {
        console.log(when.format('MMMM Do, YYYY'));
        currentDay = startOfDay;
      }

      let output = when.format('  hh:mm a - ') + entry.text;
      console.log(output);
    }, function(err) {
      assert.equal(null, err);
      callback(); // return to connectAnd to close the connection
    });
  })
}
else {
  help();
}
