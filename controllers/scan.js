const mysql = require ('mysql');
const printer = require('node-printer');

// const printer = require('printer');


const db = mysql.createConnection({
    host:process.env.DATABASE_HOST,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database:process.env.DATABASE
})

// getPrinters
exports.scan = (req , res) => {
    try {
        const printers = printer.list();
        console.log('list:', printers);

        if (printers.length === 0) {
            return res.status(404).json({ message: 'imprimante introuvable.' });
        }

        res.json(printers);
    } catch (error) {
        console.error('Unexpected error:', error);
        res.status(500).json({ error: 'Unexpected error: ' + error.message });
    }
    res.send({message:'Scan loading ....'});
}




