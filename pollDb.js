var MongoClient = require('mongodb').MongoClient;
var ObjectID=require('mongodb').ObjectID;
let dbCon;
let dbUrl=process.env.PROD_DB||'mongodb://localhost:27017/';'mongodb://localhost:27017/ndlrn';

/*POLLS*/
//CRUD:

//TODO add flag to display only active, maybe client-side filtering and/or "MORE" polls
//TODO list polls in ascending/decending order of popularity?
exports.listAllPolls = function(cb) {
  MongoClient.connect(dbUrl, function(err, db) {
    if (!err) {
      db.collection("polls").find({}).toArray(function(err, docs) {
        if(!err) {
          (docs.length) ? cb(docs) : cb(null);
        }
      });
    }
    db.close();
  });
}

exports.getUserPolls = function(data,cb) {
  MongoClient.connect(dbUrl, function(err, db) {
    if (!err) {
      db.collection("polls").find({username:data}).toArray(function(err, docs) {
        if(!err) {
          (docs.length) ? cb(docs) : cb(null);
        }
      });
    }
    db.close();
  });
}

exports.savePoll = function(data,cb) {
  MongoClient.connect(dbUrl, function(err, db) {
    if (!err) {
      db.collection("polls").insert({username:data.username, pollName:data.pollName, expiresOn:data.expiresOn, votes:data.votes, totalVotes:0, hName:data.hName},
        function(err,data){
        cb(data);
      });
    }
  db.close();
  });
}

exports.deletePoll = function(data,cb) {
  MongoClient.connect(dbUrl, function(err, db) {
    if (!err) {
      let objID=new ObjectID(data);
      db.collection("polls").deleteOne({"_id":objID});
      db.close();
    }
  });
  cb();
}

exports.voteOnPoll = function(data,cb) {
  MongoClient.connect(dbUrl, function(err, db) {
    if (!err) {
      //let vote='votes[data.vote]';
      console.log(data);
      console.log('^voteonpoll');
      let objID=new ObjectID(data.id);
      let q=`votes[${data.vote}]`;
      let vote=`votes.${data.vote}`;
      db.collection("polls").update({"_id":objID},{'$inc':{[vote]:1,totalVotes:1}});
      cb('success');
      db.close();
    }
  });
}

exports.loadPoll = function(data,cb) {
  MongoClient.connect(dbUrl, function(err, db) {
    if (!err) {
      let objID=new ObjectID(data);
      db.collection("polls").update({"_id":objID},{'$inc':{accessCt:1}});
      db.collection("polls").find({'_id':objID}).toArray(function(err, docs) {
        if(!err) {
          console.log(docs);
          console.log(docs[0].votes);
          console.log('^loadpoll');
          (docs.length) ? cb(docs) : cb(null);
          db.close();
        }
      });
    }
  });
}

exports.loadPollByName = function(data,cb) {
  MongoClient.connect(dbUrl, function(err,db) {
    db.collection("polls").find({'hName':data}).toArray(function(err, docs) {
      if(!err) {
        (docs.length) ? cb(docs) : cb(null);
        db.close();
      }
    });
  });
}

/*USERS*/
//CRUD:
//TODO validate to bottom
//RETRIEVAL
exports.fetchUser = function(query,cb) { //find a user in the DB given a username, return row
  if (!query.username) { return false; }
  MongoClient.connect(dbUrl, function(err, db){
    db.collection("users").find({username:query.username}).toArray(function(err, docs) {
      if (!err) {
        db.collection("users").updateOne({username:query.username}, {$set:{lastIn:new Date()}});
        (docs.length>0) ? cb(docs) : cb(false);
        db.close();
      }
    });
//TODO i get an "unhandled data pool killed hting if i call db.close here!   db.close();
//http://stackoverflow.com/questions/39029893/why-is-the-mongodb-node-driver-generating-instance-pool-destroyed-errors
  });
}

exports.findUser = function(query,cb) { //find a user in the DB given a username, return row
  MongoClient.connect(dbUrl, function(err, db){
    db.collection("users").find({username:query.username}).toArray(function(err, docs) {
      if (!err) {
        (docs.length>0) ? cb(docs) : cb(false);
        db.close();
      }
    });
  });
}

exports.saveUser = function(data,cb) { //save a new user in the DB
  MongoClient.connect(dbUrl, function(err, db){
    if (!err) {
      db.collection("users").insert({username:data.username,password:data.password,lastIn:new Date()});
      cb();
    }
  db.close();
  });
}
