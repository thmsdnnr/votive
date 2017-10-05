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
app.use(['/v'],bodyParser.json({extended:true}));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname+'/views'));

app.get('/', function(req,res) {
  res.render('login',{warning:false});
});

app.get('/add', function(req,res){
  let payload={user:req.session.user};
  (req.session.user) ? res.render('addPoll',{data:payload}) : res.render('login',{warning:false});
});

app.get('/logout', function(req,res){
  req.session.destroy();
  let payload={header:'Goodbye.', message:`Thank you for stopping by. Come again soon!`};
  res.render('message',{data:payload});
});

app.get('/list', function(req,res){
  Db.listAllPolls(function(d) {
    if (d!=='') {
      let payload={data:d,user:req.session.user};
      res.render('listPolls', {data:payload});
    }
  });
});

app.get('/v/:pollID', function(req,res) {
  if(req.params.pollID!==null){
    Db.loadPoll(req.params.pollID, function(d){
      if(d!=='') {
        let payload={pollID:req.params.pollID,data:d,user:req.session.user};
        res.render('displayPoll', {data:payload});
      }
      else {
        res.send('INVALID POLL ID');
      }
    });
  }
});

app.get('/p/:pollName', function(req,res) {
  if(req.params.pollID!==null){
    Db.loadPollByName(req.params.pollName, function(d) {
      if(d!=='') {
        let payload={pollID:d[0]['_id'],data:d,user:req.session.user};
        res.render('displayPoll', {data:payload});
      }
      else {
        res.send('INVALID POLL NAME');
      }
    });
  }
});

app.post('/vote', function(req,res) {
  let data={};
  if (!req.body.newOption) {
    data={id:req.body.pollID, vote:req.body.vote};
    Db.voteOnPoll(data, function(){
      res.redirect(`/v/${req.body.pollID}`);
    });
  }
  else { //entered a new option entirely!
    Db.loadPoll(req.body.pollID, function(d) {
      if (d) {
        let vKeys=Object.keys(d[0].votes);
        let lKeys=vKeys.map(k=>k.toLowerCase());
        let index = lKeys.indexOf(req.body.newOption.toLowerCase());
        if(index!==-1){
          data={id:req.body.pollID, vote:vKeys[index]};
          Db.voteOnPoll(data, function(){
            res.redirect(`/v/${req.body.pollID}`);
          });
        }
        else { //we're good, insert new option.
          data={id:req.body.pollID, vote:req.body.newOption};
          Db.voteOnPoll(data, function(){
            res.redirect(`/v/${req.body.pollID}`);
          });
        }
      }
    });
    }
  });

const randWords=['blue','cat','steel','shark','fin','tornado','pink','purple','black','feather','fox','hound','dog','kitten'];

app.post('/add', function(req,res) {
  if(req.body!==''){ //add to database
    let expiresOn;
    (req.body.ttv!=='') ? expiresOn=Date.now()+(1000*60*60*req.body.ttv) : expiresOn=''; //60 min/hr, 60 seconds/min, 1000ms/second
    let choices=req.body.choices.split(",");
    let hyphenName=req.body.name.trim().replace(/\W/gi,'-');
    let randAnimal=randWords[Math.floor(Math.random()*randWords.length-1)+1];
    let randChunk=btoa(randAnimal).slice(0,2);
    hyphenName=`${hyphenName}-${randChunk}${randAnimal}`;
    let voteObj={}
    choices.forEach(c=>voteObj[c]=0);
    Db.savePoll({username:req.session.user, pollName:req.body.name, expiresOn:expiresOn, votes:voteObj, hName:hyphenName},function(val){
      res.redirect('/p/'+val.ops[0].hName); //redirect to new poll on creation
    });
  }
});

app.get('/login', function(req,res) {
  res.render('login',{warning:false});
});

app.get('/register', function(req,res) { res.render('register', {warning:false}); });

app.get('/dash', function(req,res) {
  if (req.session.user!==undefined) {
  Db.getUserPolls(req.session.user, function(d) {
    if(d) {
      let payload={data:d,user:req.session.user};
      res.render('userPolls',{data:payload});
    }
    else {
      let payload={data:null,user:req.session.user};
      res.render('userPolls',{data:payload});
    }
  });
  }
  else {
    res.redirect('/login');
    return;
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
          let payload={message:`Welcome to Votive, ${inputUser}!<br />`, uName:inputUser};
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

app.get('/d/:id', function(req,res) {
  if (req.params.id) {
    let dValue=req.params.id;
    if (dValue.length!==24||dValue.match(/\W/gi)) { //invalid input
      res.status('400');
      res.send('Invalid poll ID! Sorry.');
      return false; }
    Db.loadPoll(req.params.id,function(data) { //make sure it exists in the database
      if (data) {
        let pollOwner=data[0].username || null; //make sure the user trying to delete owns the poll
        if (pollOwner!==req.session.user) {
          let payload={header:'WHOA SILVER.', message:`You aren't authorized to delete this poll. Sneaky, sneaky.`};
          res.render('message',{data:payload});
          return false;
        }
        else { //if valid & is owner then delete!
          Db.deletePoll(req.params.id, function(){res.redirect('/dash');});
        }
      }
      else { // no data in db even though valid ID
        let payload={header:'Huh.', message:`There doesn't appear to be a poll by that ID existing in the DB!`};
        res.render('message',{data:payload});
        return false;
      }
    });
  }
  else {
    res.status('400');
    res.send('Invalid poll ID! Sorry.');
  }
});

app.get('*', function(req,res) {
  res.status('400');
  res.send('Invalid path! Sorry.');
})

app.listen(process.env.PORT || 8080);
