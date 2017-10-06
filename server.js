const express=require('express');
const bodyParser=require('body-parser');
const path=require('path');
const cookieParser=require('cookie-parser');
const session = require('express-session');
const btoa=require('btoa');
const MongoStore = require('connect-mongo')(session);
const sha1=require('sha1');
const Db=require('./pollDb.js');

const app=express();
app.use(cookieParser());
app.use(session({
  store: new MongoStore({
    url: process.env.PROD_DB||'mongodb://localhost:27017/ndlrn',
    ttl: 14 * 24 * 60 * 60 // = 14 days. Default
  }), //https://github.com/jdesboeufs/connect-mongo
  secret: process.env.SESSION_SECRET || 'DREAMSBEDREAMS',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false, maxAge:(60*60*1000) } //1 hour max age -> DOESN'T WORK WITH SECURE:TRUE ON NON-HTTPS LOCALHOST
}));
app.locals.CURRENT_USER='';
app.use(express.static(path.join(__dirname+'/static')));
app.use(['/vote','/add','/login','/register','/d'],bodyParser.urlencoded({extended:true}));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname+'/views'));

//get routes
app.get('/', function(req,res) { res.render('login',{warning:false}); });
app.get('/add', function(req,res){
  let payload={user:req.session.user};
  (req.session.user) ? res.render('addPoll',{data:payload}) : res.render('login',{warning:false})
});
app.get('/login', function(req,res) { res.render('login',{warning:false}); });
app.get('/register', function(req,res) { res.render('register', {warning:false}); });
app.get('/logout', function(req,res){
  req.session.destroy();
  let payload={header:'Goodbye.', message:`Thank you for stopping by. Come again soon!`};
  res.render('message',{data:payload});
});

app.get('/d/:hName', function(req,res) {
  if (req.params.hName) {
    Db.loadPollByName(req.params.hName, function(data) { //make sure it exists in the database
      if (data) {
        let pollOwner=data[0].username || null; //make sure the user trying to delete owns the poll
        if (pollOwner!==req.session.user) {
          let payload={header:'WHOA SILVER.', message:`You aren't authorized to delete this poll. Sneaky, sneaky.`};
          res.render('message',{data:payload});
          return false;
        } else { Db.deletePollByName(req.params.hName, function(){res.redirect('/dash');}); }
      } else { // no data in db even though valhName ID
          let payload={header:'Huh.', message:`There doesn't appear to be a poll by that name in the DB!`};
          res.render('message',{data:payload});
          return false;
        }
    });
  } else { res.status('400'); res.send('Invalid poll ID! Sorry.'); }
});

app.get('/dash', function(req,res) {
  if (req.session.user!==undefined) {
  Db.getUserPolls(req.session.user, function(d) {
    if(d) {
      let payload={data:d,user:req.session.user};
      res.render('userPolls',{data:payload});
    } else {
        let payload={data:null,user:req.session.user};
        res.render('userPolls',{data:payload});
      }
    });
  } else { res.redirect('/login'); }
});

app.get('/list', function(req,res){
  Db.listAllPolls(function(d) {
    if (d) {
      let payload={data:d,user:req.session.user};
      res.render('listPolls', {data:payload});
    } else { res.send('NO POLLS ARE AVAILABLE :( so sad!')}
  });
});

app.get('/p/:pollName', function(req,res) {
  if(req.params.pollID!==null) {
    Db.loadPollByName(req.params.pollName, function(d) {
      if(d) {
        let payload={hName:d[0]['hName'],data:d,user:req.session.user};
        res.render('displayPoll', {data:payload});
      } else { res.send('INVALID POLL NAME'); }
    });
  }
});

//post routes
app.post('/vote', function(req,res) {
  let data={};
  if (!req.body.newOption) {
    data={hName:req.body.hName, vote:req.body.vote};
    Db.voteOnPoll(data, function(){
      res.redirect(`/p/${req.body.hName}`);
    });
  } else { //entered a new option entirely!
    Db.loadPollByName(req.body.hName, function(d) {
      if (d) {
        let vKeys=Object.keys(d[0].votes);
        let lKeys=vKeys.map(k=>k.toLowerCase());
        let index = lKeys.indexOf(req.body.newOption.toLowerCase());
        if(index!==-1){
          data={hName:req.body.hName, vote:vKeys[index]};
          Db.voteOnPoll(data, function(){ res.redirect(`/p/${req.body.hName}`); });
        } else { //we're good, insert new option.
          data={hName:req.body.hName, vote:req.body.newOption};
          Db.voteOnPoll(data, function(){ res.redirect(`/p/${req.body.hName}`); });
          }
        }
      });
    }
  });

app.post('/add', function(req,res) {
  if(req.body!==''){ //add to database TODO checking of validity...
    let expiresOn;
    (req.body.ttv!=='') ? expiresOn=Date.now()+(1000*60*60*req.body.ttv) : expiresOn=''; //60 min/hr, 60 seconds/min, 1000ms/second
    let choices=req.body.choices.split(",");
    let potentialName=req.body.name.trim().replace(/\W/gi,'-');
    let voteObj={}
    choices.forEach(c=>voteObj[c]=0);
    let nameCtr=0;
    Db.loadPollsWithPrefix(potentialName,function(data, cb) {
      if (!data) {
        Db.savePoll({username:req.session.user, pollName:req.body.name, expiresOn:expiresOn, votes:voteObj, hName:potentialName},function(val){
          res.redirect('/p/'+val.ops[0].hName); //redirect to new poll on creation
        });
      }
      else {
        potentialName=`${potentialName}-${data.length}`;
        Db.savePoll({username:req.session.user, pollName:req.body.name, expiresOn:expiresOn, votes:voteObj, hName:potentialName},function(val){
          res.redirect('/p/'+val.ops[0].hName); //redirect to new poll on creation
        });
      }
    });
  }
});

app.post('/login', function(req,res) {
    let inputUser=req.body.username;
    let inputPwd=req.body.password;
    if (inputUser===''||inputPwd==='') { res.render('login',{data:{warning:true}}); return false;}
    else {
      Db.fetchUser({'username':inputUser},function(D){
        if(D) {
          if ((D[0].username===inputUser)&&(D[0].password===sha1(inputPwd)))
          {
            req.session.user=inputUser;
            res.redirect('/dash');
          }
          else {
            req.session.user='';
            res.render('login',{data:{warning:true}});
          }
        }
        else
          {
            req.session.user='';
            res.render('login',{data:{warning:true}});
          }
        });
      }
    });

app.post('/register', function(req,res) {
  let inputUser=req.body.username;
  let inputPwd=req.body.password;
  Db.findUser({'username':inputUser},function(data){
    if (!data[0]) {
      if (inputPwd!=="") {
        Db.saveUser({username:inputUser,password:sha1(inputPwd)},function(){
          req.session.user=inputUser;
          let payload={message:`Welcome to Votive, ${inputUser}!`, uName:inputUser};
          res.render('login',{data:payload});
      });
      }
      else {
        let payload={header:'There is no try.', message:`Password cannot be blank.`, link:null};
        res.render('message',{data:payload});
      }
    }
    else {
      let payload={header:'There is no try.', message:`${inputUser} is taken.`, link:null};
      res.render('message',{data:payload});
    }
  });
});

app.get('*', function(req,res) {
  res.status('400');
  res.send('Invalid path! Sorry.');
})

app.listen(process.env.PORT || 8080);
