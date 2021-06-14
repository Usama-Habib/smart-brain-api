const express = require('express')
const bodyParser = require('body-parser')
const bcrypt = require('bcrypt');
const cors = require('cors')
var mysql = require('mysql')
const Clarifai = require('clarifai');
const saltRounds = 10;
const app = express()
const port = 3000

//You must add your own API key here from Clarifai.
const clarifai_app = new Clarifai.App({
 apiKey: '7ebc9459b3ef4a1da7ee52e6b32c58cb'
});

const knex = require('knex')({
  client: 'pg',
  connection: {
     connectionString: process.env.DATABASE_URL,
      ssl: {
        rejectUnauthorized: false
      }
    // user : 'root',
    // password : 'usama',
    // database : 'smartbrain'
  }
});

// const database = {
//     users : [
//         {
//             id: 1,
//             name: "Usama",
//             email: 'usamaarain056@gmail.com',
//             password: '786123google',
//             count: 0,
//             created: new Date
//         },
//         {
//             id: 2,
//             name: "Shahid",
//             email: 'shahid@gmail.com',
//             password: 'shahidarain',
//             count: 0,
//             created: new Date
//         },
//         {
//             id: 3,
//             name: "Mudassir",
//             email: 'mudassir@gmail.com',
//             password: 'mudassirarain',
//             count: 0,
//             created: new Date
//         }
//     ]
// }

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }))
// parse application/json
app.use(bodyParser.json())
app.use(cors())


app.post('/imageUrl', (req,res) => {
  clarifai_app.models
      .predict(Clarifai.FACE_DETECT_MODEL,req.body.input)
      .then(data => {
        res.json(data)
      })
      .catch(err => res.status(400).json('API has got some issue'))
})

app.get('/',(req,res) =>{
    res.json("It is working...")
})

app.post('/signin',(req,res) => {
    const {email,password} = req.body
     if(!email || !password){
        return res.status(400).json("Incorrect Form Submission")
    }

     knex.select('email', 'hash').from('login')
    .where('email', '=', email)
    .then(data => {
      const isValid = bcrypt.compareSync(password, data[0].hash);
      if (isValid) {
        return db.select('*').from('users')
          .where('email', '=', email)
          .then(user => {
            res.json(user[0])
          })
          .catch(err => res.status(400).json('unable to get user'))
      } else {
        res.status(400).json('wrong credentials')
      }
    })

    //  knex.select('*').from('login').where({email})
    // .then(user => {
    //     const isValid = bcrypt.compareSync(password, user[0].hash);
    //     if(isValid){
    //         return knex.select('*').from('users').where({email})
    //         .then(data => {
    //             res.json(data[0])
    //         })
    //         .catch(err => res.status(400).json('unable to get user'))
    //     }else{
    //         res.status(400).json("Username and Password combination is wrong")
    //     }
    // })
    .catch(err => res.status(400).json('Error getting user'))
})

app.post('/register',(req,res) => {
    const {name,email,password} = req.body
    if(!name || !email || !password){
        return res.status(400).json("Incorrect Form Submission")
    }
    const hash = bcrypt.hashSync(password, saltRounds);
knex.transaction(trx => {
      trx.insert({
        hash: hash,
        email: email
      })
      .into('login')
      .returning('email')
      .then(loginEmail => {
        return trx('users')
          .returning('*')
          .insert({
            email: loginEmail[0],
            name: name,
            joined: new Date()
          })
          .then(user => {
            res.json(user[0]);
          })
      })
      .then(trx.commit)
      .catch(trx.rollback)
    })
// knex.transaction(trx => {
//     trx
//     .insert({
//         email: email, 
//         hash: hash 
//     })
//     .into('login')
//     .then(response_id => {
//         return trx.select('*').from('login').where({id:response_id[0]})
//         .then(user => {
//            return trx('users')
//             .insert({
//                 name: name, 
//                 email:user[0].email,
//                 joined: new Date() 
//             })
//         })
//         .then(results => {
//             trx.select('*').from('users').where({id:results[0]})
//             .then(resp => res.json(resp[0]))
//         })
//     })
//     .then(trx.commit)
//     .catch(trx.rollback)
//     })
})

app.get('/profile/:id',(req,res)=>{
    const {id} = req.params
    knex.select('*').from('users').where({id})
    .then(user => {
        if(user.length){
            res.json(user[0])
        }else{
            res.status(400).json("Not found")
        }
    })
    .catch(err => res.status(400).json('Error getting user'))
})

app.put('/image',(req,res)=>{
    const {id} = req.body
    knex.select('*').from('users').where({id})
    .then(user => {
        if(user.length){
            knex('users').update({entries:user[0].entries+1}).where({id})
            .then(res.json(user[0].entries+1))
        }else{
            res.status(400).json("Not found")
        }
    })
    .catch(err => res.status(400).json('Error getting user'))
})

// app.listen(process.env.PORT || 3000 , ()=>{
//     console.log(`Listning at http://localhost:${process.env.PORT}`)
// })

app.listen(process.env.PORT || 3000, function(){
  console.log(`Express server listening on port ${process.env.PORT}`);
});

// OPERATION METHOD->RETURN
// ROOT GET->USERS
// SIGN-IN POST->SUCCESS/FAIL
// REGISTER POST->USER
// PROFILE GET->USER
// PICTURE PUT->USER