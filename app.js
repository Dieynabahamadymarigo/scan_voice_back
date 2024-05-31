const express = require ('express');
const cors = require ('cors');
const  path = require ('path');
const mysql = require ('mysql');
const dotenv = require ('dotenv');
const jwt = require ('jsonwebtoken');
const bodyParser = require('body-parser');

dotenv.config({path: './.env'});

const app = express ();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use('/public', express.static('public'));


app.use(cors({
  origin : "*",
})
);

const db = mysql.createConnection({
    host:process.env.DATABASE_HOST,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database:process.env.DATABASE
})

app.use(function (req, res, next) {
  res.header('Access-Control-Allow-Origin', '*');
  res.header(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept, Authorization'
  );
  next();
});

const publicDirectory = path.join(__dirname,'./public');
// console.log(__dirname)
app.use(express.static(publicDirectory));


app.use(express.urlencoded({extended:false}));

app.set('view engine', 'hbs');
// app.set('view engine', 'html');


db.connect( (error) => {
    if(error) {
        console.log(error)
    }
    else {
        console.log('Mysql est connecté .....');
    }
})

app.use('/', require('./routes/pages'));
app.use('/auth', require('./routes/auth'));

app.use('/scan', require('./routes/scan'));

app.use('/addscanner', require('./routes/addscanner'));




app.get('/jwt', (req, res) => {
   const createTokenFromJson = (JsonData,options = {}) => {
    try{
      const secretKey = 'test'
      const token = jwt.sign(JsonData,secretKey,options)
      return token
    } catch(error){
      console.log('error !',error.message)
      return null
    }
   }

   const JsonData = {email:"",password:""}
   const token = createTokenFromJson(JsonData)

   if (token) {
     res.json({ status:true, token: token})
    } else {
     res.json({ status:true})
   }
} )

  app.listen(3000, () => {
    console.log(`Server is running `);
  });
