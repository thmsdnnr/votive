var MongoClient = require('mongodb').MongoClient;
var ObjectID=require('mongodb').ObjectID;
let db;
let dbUrl=process.env.PROD_DB||'mongodb://localhost:27017/';

function connect(callback) {
  if (db===undefined) {
    MongoClient.connect(dbUrl, function(err, database){
      if(err) { return callback(err) };
      db=database;
      callback(null, db);
  });
  }
  else { callback(null, db); }
}

connect(function(d){console.log(d);});

/*POLLS*/
//CRUD:

//TODO add flag to display only active, maybe client-side filtering and/or "MORE" polls
//TODO list polls in ascending/decending order of popularity?
exports.listAllPolls = function(cb) {
  db.collection("polls").find({}).toArray(function(err, docs) {
  if(!err) { (docs.length) ? cb(docs) : cb(false); }
  });
}

exports.getUserPolls = function(data,cb) {
  db.collection("polls").find({username:data}).toArray(function(err, docs) {
  if(!err) { (docs.length) ? cb(docs) : cb(false); }
  });
}

exports.savePoll = function(data,cb) {
  db.collection("polls").insert({username:data.username, pollName:data.pollName, expiresOn:data.expiresOn, votes:data.votes, totalVotes:0, hName:data.hName},
  function(err,data){ if(!err) { cb(data); } else { cb(false); }
  });
}

exports.deletePoll = function(data,cb) {
  let objID=new ObjectID(data);
  db.collection("polls").deleteOne({"_id":objID});
  cb();
}

exports.voteOnPoll = function(data,cb) {
  let objID=new ObjectID(data.id);
  let vote=`votes.${data.vote}`;
  db.collection("polls").update({"_id":objID},{'$inc':{[vote]:1,totalVotes:1}});
  cb('success');
  }

exports.loadPoll = function(data,cb) {
  let objID=new ObjectID(data);
  db.collection("polls").update({"_id":objID},{'$inc':{accessCt:1}});
  db.collection("polls").find({'_id':objID}).toArray(function(err, docs) {
    if(!err) { (docs.length) ? cb(docs) : cb(false); } });
  }

exports.loadPollByName = function(data,cb) {
  db.collection("polls").find({'hName':data}).toArray(function(err, docs) {
    if(!err) { (docs.length) ? cb(docs) : cb(false); } });
  }

/*USERS*/
//CRUD:
//RETRIEVAL
exports.fetchUser = function(query,cb) { //find a user in the DB given a username, return row
  if (!query.username) { return false; }
  db.collection("users").find({username:query.username}).toArray(function(err, docs) {
    if (!err) {
      db.collection("users").updateOne({username:query.username}, {$set:{lastIn:new Date()}});
      (docs.length>0) ? cb(docs) : cb(false);
      } });
    }

exports.findUser = function(query,cb) { //find a user in the DB given a username, return row
  db.collection("users").find({username:query.username}).toArray(function(err, docs) {
      if (!err) { (docs.length>0) ? cb(docs) : cb(false); } });
  }

exports.saveUser = function(data,cb) { //save a new user in the DB
  db.collection("users").insert({username:data.username,password:data.password,lastIn:new Date()});
  cb();
  }
