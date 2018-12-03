#!/usr/bin/env node
'use strict';

/* 
  Today I Learned command-line app
*/

const FactStore = require('./lib/factStore')

// Connection URL format:
// const url = 'mongodb://$[username]:$[password]@$[hostlist]/$[database]?authSource=$[authSource]';
// see https://devcenter.heroku.com/articles/mongolab
const dbUrl = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const store = new FactStore(dbUrl);

start();

async function start() {
  // the first two args are full paths to the executable files,
  // so ignore them
  let params = process.argv.slice(2);

  // the first real arg is the command
  let command = params.shift();

  if (command === 'help' || !command) {
    help();
  }
  else if (command === 'add') {
    let text = params.join(' ').trim();
    await store.addFact(text);
  }
  else if (command === 'edit') {
    let index = params.slice(0, 1)[0];
    let text = params.slice(1).join(' ').trim();
    await store.editFact(index, text);
  }
  else if (command === 'delete') {
    let index = params.slice(0, 1)[0];
    await store.deleteFact(index);
  }
  else if (command === 'list') {
    await store.printAll();
  }
  else if (command === 'show') {
    let index = params.slice(0, 1)[0];
    await store.printEntry(index);
  }
  else if (command === 'text') {
    let index = params.slice(0, 1)[0];
    await store.printEntryText(index);
  }
  else {
    help();
  }

  // The DB connection is still open, so we must explicitly exit
  process.exit();

}

// display help and exit
function help() {
  console.log(`Today I Learned
  
  Run locally with:
  
    node ./til.js

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
