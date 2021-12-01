const express = require('express')
const app = express()
const cors = require('cors')
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect("mongodb+srv://sat1:sat123@cluster0.mt6xo.mongodb.net/myFirstDatabase?retryWrites=true&w=majority", { useNewUrlParser: true, useUnifiedTopology: true });

app.use(cors())
app.use(express.static('public'))
app.use(bodyParser.urlencoded({extended: false}));
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

const userSchema = new mongoose.Schema({
  username: String,
  count: Number,
  log:[Object]
});

let User = new mongoose.model("User", userSchema);

app.post("/api/users", (req,res)=>{
  User.findOne({'username':req.body.username}, (err,data)=>{
    if (!data){
      User.create({username: req.body.username, count:0, log:[]}, (err,data)=>{
        res.send({username:data.username, _id:data._id});
      })
    }else res.send({username:data.username, _id:data._id});
  });
});

function validateDate(date){
  return /[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]/.test(date);
}

app.get("/api/users", (req,res)=>{
  User.find((err,data)=>{
    res.send(data.map(item=>{
      return {_id:item._id, username:item.username};
    }));
  })
})

console.log(validateDate("1990-01-02"));

app.post("/api/users/:_id/exercises", (req,res)=>{
  let date = req.body.date === '' ? new Date() : new Date(req.body.date);
  User.findOne({_id:req.params._id}, (err,data)=>{
    if (err) console.log(err);
    if (data){
      data.log.push({description: req.body.description, duration: parseInt(req.body.duration), date: date})
      data.count += 1;

      data.markModified('log');
      data.markModified('count');

      data.save((err,data)=>{
        if (err) console.log(err);
        else res.send({_id:data._id, username:data.username, date:date.toDateString(), duration:parseInt(req.body.duration), description: req.body.description});
      });
    }else{
      res.send(`Cast to ObjectId failed for value "${req.params._id}" at path "_id" for model "Users"`);
    }
  })
});
console.log(new Date("1989-12-31").toDateString())

app.get("/api/users/:_id/logs", (req,res)=>{
  console.log(req.originalUrl, req.query.from, req.query.to, req.query.limit);
  console.log("validate", validateDate(req.query.from), validateDate(req.query.to))
  User.findOne({_id:req.params._id}, (err,data)=>{
    if (data){
      var ret = {_id:data._id, username:data.username};
      data.log = data.log.map((item)=>{
        item.date = new Date(item.date).toDateString();
        return item;
      });
      if (req.query.from && validateDate(req.query.from)){
        var fDate = new Date(req.query.from).getTime();
        data.log = data.log.filter(item=>{
          var cDate = new Date(item.date).getTime();
          return cDate >= fDate
        });data.count = data.log.length;
        ret.from = new Date(req.query.from).toDateString();
      }if (req.query.to && validateDate(req.query.to)){
        var tDate = new Date(req.query.to).getTime();
        data.log = data.log.filter(item=>{
          var cDate = new Date(item.date).getTime();
          return cDate <= tDate
        });data.count = data.log.length;
        ret.to = new Date(req.query.to).toDateString();
      }if (req.query.limit && !isNaN(req.query.limit)){
        if (req.query.limit < data.log.length){
          data.log = data.log.slice(0,req.query.limit);
          data.count = req.query.limit;
        }
      }ret.count = data.count;
      ret.log = data.log;
      res.json(ret);
      console.log(ret.log);
    }else{
      res.send(`Cast to ObjectId failed for value "${req.params._id}" at path "_id" for model "Users"`);
    }
  })
});



const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
