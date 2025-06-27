const express = require('express');
const mongoose = require('mongoose');

const app = express();

const jwt = require('jsonwebtoken')
require('dotenv').config();

const JWT_SECRETE = process.env.JWT_SECRETE;

let lastsession = null;

const bodyParser = require('body-parser'); 
app.use(bodyParser.json()); 

mongoose
  .connect(
    'mongodb://mongo:27017/docker-node-mongo',
    { useNewUrlPArser: true }
  )
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.log(err)
); 

const schema_mongoose = require('mongoose');

const SessionSchema = schema_mongoose.Schema(
   {
      sessionID: {type: Number},
      // id: {type: Number},      
      pass: { type: String },    // Optional 

      username: { type: String },    // "admin" 
      userpass: { type: String },    // "admin"
      role: { type: String },    // Optional 
   },
   {
      timestamps: true
   }
);

SessionModel = schema_mongoose.model('Session_Test', SessionSchema);

function uniqueid() {
  return Math.floor(
    Math.floor(Date.now() % 100000)
  )
}

// START SESSION API (Registration)
app.post('/start', (req, res) => {
  console.log("START API EXECUTED")
  const sobj = new SessionModel({
    sessionID: uniqueid(),
    // id: uniqueid(),
    pass: req.body.sessionpass,
    role:"admin",    // defaults to admin for now 
    username: req.body.username,
    userpass: req.body.password,
    // expiresAt: expires()
  });
  
  //INSERT/SAVE THE RECORD/DOCUMENT
  sobj.save()
    .then(inserteddocument => {
      const token = jwt.sign({ sessionID: sobj.sessionID, username: sobj.username, role: sobj.role}, JWT_SECRETE, { expiresIn: '24h' });
      res.setHeader('sessToken', token);
      lastsession = sobj.sessionID;
      res.status(200).send(`New session created at: ${sobj.sessionID}, \n Token saved`);

    })//CLOSE THEN
    .catch(err => {
      res.status(500).send({ message: err.message || 'Error in Employee Save ' })
    });//CLOSE CATCH
}//CLOSE CALLBACK FUNCTION BODY
);//CLOSE POST METHOD

// JOIN SESSION API (Login)
app.post("/join", (req, res) => {
  console.log(req.body.sessionID)
  console.log(req.body.sessionpass)

  SessionModel.find({"sessionID": req.body.sessionID, "pass": req.body.sessionpass})    // look for session
    .then(getsearchdocument => {
      console.log(getsearchdocument)
      if (getsearchdocument.length > 0) {
        SessionModel.find({"sessionID": req.body.sessionID, "username": req.body.username, "userpass": req.body.password})   // look if user already have acc 
          .then(searchdocument => {
            if (searchdocument.length > 0) {    // if user exist in db, then return role 
              const role = searchdocument[0].role;
              const id = searchdocument[0]._id.toString();
              console.log(id)
              const token = jwt.sign({ sessionID: req.body.sessionID, username: req.body.username, userID: id, role: role}, JWT_SECRETE, { expiresIn: '24h' });
              res.setHeader('sessToken', token);

              lastsession = req.body.sessionID;

              // return res.send(token);     // or return res.json({ token });
              return res.send(`User found in session: ${req.body.sessionID}, \n Login Token saved`)
            }
            else {          // if not then create acc 
              const sobj = new SessionModel({
                sessionID: req.body.sessionID,
                // ID: uniqueid(),
                pass: req.body.sessionpass,
                role:"user",    
                username: req.body.username,
                userpass: req.body.password,
                // expiresAt: expires()
              });
              console.log(sobj._id.toString())
              const token = jwt.sign({ sessionID: req.body.sessionID, username: req.body.username, userID: sobj._id.toString(), role: sobj.role}, JWT_SECRETE, { expiresIn: '24h' })     // create a token and use that to redirect
              //INSERT/SAVE THE RECORD/DOCUMENT
              sobj.save()
                .then(inserteddocument => {
                  res.setHeader('sessToken', token);
                  lastsession = req.body.sessionID;
                  // return res.send(token);     // or return res.json({ token });
              return res.send(`New user created in session: ${req.body.sessionID}, \n Login Token saved`)
                })//CLOSE THEN
                .catch(err => {
                  res.status(500).send({ message: err.message || 'Error in saving account details ' })
                });//CLOSE CATCH
              };
          })
      }
      else {
        res.status(400).send("No session is found with SessionID")
      }
    }) //CLOSE THEN
}//CLOSE CALLBACK FUNCTION BODY
)//CLOSE Post METHOD

app.get('/viewall', (req, res) => { 
  SessionModel.find({"sessionID": lastsession}, { userpass: 0, pass: 0 })
    .then(sess => res.send(sess))
    .catch(err => res.status(404).json({msg: "Not logged into any session"}))
}
);


app.listen(5002, () => {
    console.log('Authentication Service Server is running on PORT NO: 5002')
})

