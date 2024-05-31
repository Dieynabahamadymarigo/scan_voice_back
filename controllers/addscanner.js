const express = require('express');
const mysql = require ('mysql');
// const printer = require('printer');
const ThermalPrinter = require('node-thermal-printer').printer;
const PrinterTypes = require('node-thermal-printer').types;
const bodyParser = require('body-parser');
const path = require('path');


const app = express();
app.use(express.json());

// app.use(bodyParser.urlencoded({ extended: false }));
// app.use(bodyParser.json());

const db = mysql.createConnection({
    host:process.env.DATABASE_HOST,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database:process.env.DATABASE
})

let printer = new ThermalPrinter({
  type: PrinterTypes.EPSON,
  interface: 'usb://path-to-usb-port'
});

// console.log('imprimante', printer)
exports.scanner = async (req , res) => {

   const { type, interface } = req.body;

  let printer = new ThermalPrinter({
    type: PrinterTypes[type],
    interface: interface,
  });


  printer.alignCenter();
  printer.println('Bonjour le monde');
  printer.cut();

  try {
    let execute = await printer.execute();
    console.log('Impression terminée');
    res.send('Imprimante ajoutée et test d\'impression réussi');
  } catch (error) {
    console.log('Échec de l\'impression :', error);
    res.status(500).send('Échec de l\'ajout de l\'imprimante');
  }

//   let printer = new ThermalPrinter({
//   type: PrinterTypes.EPSON,  // Changez ceci en fonction du type de votre imprimante
//   interface: 'usb',          // Changez ceci en fonction de votre type de connexion
// });

// printer.alignCenter();
// printer.println('Bonjour le monde');
// printer.cut();

// try {
//   let execute = await printer.execute();
//   console.error('Impression terminée');
// } catch (error) {
//     console.log('Échec de l\'impression :', error);
// }


      // res.send({message:'Scan read ....'});
}


