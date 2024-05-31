const mysql = require ('mysql');
const bcrypt = require ('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const {google} = require('googleapis')
// const {v4: uuidv4} = require ('uuid')
require('dotenv').config();

const OAuth2 = google.auth.OAuth2;

const oauth2Client = new OAuth2(
    process.env.CLIENT_ID,
    process.env.CLIENT_SECRET,
    "https://developers.google.com/oauthplayground",
  );

oauth2Client.setCredentials({
    refresh_token: process.env.REFRESH_TOKEN
});


const db = mysql.createConnection({
    host:process.env.DATABASE_HOST,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database:process.env.DATABASE
})



// Route pour traiter l'inscription
exports.register = (req , res) => {
  const { nom, prenom, email, password, telephone, address } = req.body;
      const hashedPassword = bcrypt.hashSync(password, 8);  // Hachage du mot de passe
  const sql = 'INSERT INTO users SET ?';
  const newUser = { nom:nom, prenom:prenom, email:email, password:hashedPassword, tel:telephone, adresse:address};
  db.query(sql, newUser, (err, result) => {
      if (err) {
            console.error('Error inserting user:', err);
            res.status(500).json({ error: 'Database error' });
        } else {
            console.log('User added:', newUser);
            res.status(200).json({
                message: 'User added successfully',
                user: newUser,
                result: result
            });
          }

});

}


//  Route pour traiter la connexion
exports.login = (req, res) => {
    const { email, password } = req.body;
        // console.log(`Login attempt for email: ${email}`);

    const sql = 'SELECT * FROM users WHERE email = ?';

    db.query(sql, [email], (err, results) => {
        if (err) {
            console.error('Error fetching user:', err);
            res.status(500).json({ error: 'Database error' });
            return;
        }
        else if (results.length == 0) {
          console.log('No user found with this email');
          // res.status(401).json({
          //   error: 'Invalid email or password',
          //   });
            res.json({
                  status: false,
                  // error: 'Invalid email or password',
                  message: 'email ou password incorect',
                });
                return;
        }
        else {
            const user = results[0];
            // console.log('User found:', user);

            // Log détaillé sur la longueur du mot de passe haché
        // console.log('Hashed password length:', user.password.length);
            const passwordIsValid = bcrypt.compareSync(password, user.password);

            if (!passwordIsValid) {
                // console.log('Invalid password');

              // res.status(401).json({ status: false, message: 'Email ou mot de passe incorrect' });
             res.json({
                  status: false,
                  // error: 'Invalid email or password',
                  message: 'email ou password incorect',
                 },
                );
            }
             else {
            //   console.log('Password is valid');
            //   console.log('Input password:', password);
            // console.log('Stored hashed password:', user.password);
                // Optionnel : Générer un token JWT pour la session de l'utilisateur
                const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
                    expiresIn: 86400 // 24 heures
                });

                res.json({
                    status: true,
                    message: 'Login successful',
                    user: {
                        id: user.id,
                        nom: user.nom,
                        prenom: user.prenom,
                        email: user.email,
                        telephone: user.tel,
                        address: user.adresse
                    },
                    token: token
                },
                );
            }
        }
    });
};


// Route pour envoie un email pour réinitialer le mot de passe
async function sendResetEmail(email, resetToken) {
  // async function sendEmail({ to, subject, text }) {

    try {
        const accessToken = await oauth2Client.getAccessToken();

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                type: 'OAuth2',
                user: process.env.EMAIL_USER,
                clientId: process.env.CLIENT_ID,
                clientSecret: process.env.CLIENT_SECRET,
                refreshToken: process.env.REFRESH_TOKEN,
                accessToken: accessToken.token,
            },
        });

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Réinitialisation de Mot De Passe',
            text: `Pour réinitialiser votre mot de passe, veuillez cliquer sur ce lien : ${process.env.CLIENT_URL}/reset-password?token=${resetToken}`,
            // text: `Verifiez votre adresse email pour continuer votre inscription/connexion.
            // Ce lien expire dans 1h.
            // Cliquez ${currentUrl + resetToken + _id + "/" +  uniqueString} ?ici pour pouvoir y accéder`,
        };

        const result = await transporter.sendMail(mailOptions);
        console.log('Email sent:', result.response);
    } catch (error) {
        console.error('Error sending email:', error);
    }
}

exports.forgotPassword = (req, res) => {
    const { email } = req.body;
    const sql = 'SELECT * FROM users WHERE email = ?';

    db.query(sql, [email], (err, results) => {

        if (err) {
            console.error('Error fetching user:', err);
            res.status(500).json({ error: 'Database error' });
        } else if (results.length === 0) {
            console.log('No user found with this email');
            res.status(404).json({ error: 'User not found' });
        } else {

            const user = results[0];

            console.log('User found:', user);
            console.log('User ID:', user.Id);


            // Générer un token unique pour réinitialiser le mot de passe
            const resetToken = jwt.sign({ Id: user.Id }, process.env.JWT_SECRET, {
                expiresIn: '1h' // Le token expirera dans 1 heure
            });

            console.log('Generated reset token with user ID:', user.Id);



            // Enregistrer le token dans la base de données (vous devez avoir une colonne pour stocker les tokens de réinitialisation)
            // const updateTokenSql = 'UPDATE users SET reset_token = ? WHERE id = ?';
            // db.query(updateTokenSql, [resetToken, user.id], (err, result) => {
            //     if (err) {
            //         console.error('Error updating reset token:', err);
            //         res.status(500).json({ error: 'Database error' });
            //     }

            // else {
                    sendResetEmail(email, resetToken)
                        .then(() => {
                            res.status(200).json({ message: 'Password reset email sent' });
                        })
                        .catch(error => {
                            console.error('Error sending email:', error);
                            res.status(500).json({ error: 'Failed to send email' });
                        });
        //         }

        // });
        }
    });
};

// Route pour réinitialiser le nouveau mot de passe
exports.resetPassword = (req, res) => {
   const { token, password } = req.body;

  // Vérifier et décoder le token
  if (!token) {
    console.log('token is missing')
  return res.status(400).json({ error: 'Token est manquant' });
}

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {

    if (err) {
      console.error('Token verification error:', err);
      return res.status(400).json({ error: 'Token invalide ou expiré' });
    }

       if (!decoded.Id) {
            console.error('Token decoded but user ID is undefined');
            return res.status(400).json({ error: 'Token invalide: ID utilisateur manquant' });
        }
            console.log('Token verified, user ID:', decoded.Id);


    const hashedPassword = bcrypt.hashSync(password, 8);
    const sql = 'UPDATE users SET password = ?, reset_token = NULL WHERE id = ?';

    // db.query(sql, [hashedPassword, decoded.id], (err) => {
    //   if (err) {
    //     console.error('Erreur de mise à jour du mot de passe:', err);
    //     return res.status(500).json({ error: 'Erreur de base de données' });
    //   }
    //      res.status(200).json({ message: 'Mot de passe réinitialisé avec succès' });
    // })
           db.query(sql, [hashedPassword, decoded.Id], (err, results) => {
            if (err) {
                console.error('Erreur de mise à jour du mot de passe:', err);
                return res.status(500).json({ error: 'Erreur de base de données' });
            }

            if (results.affectedRows === 0) {
                console.log('No user found with the provided ID');
                return res.status(404).json({ error: 'User not found' });
            }

            console.log('Mot de passe réinitialisé avec succès pour l\'utilisateur ID:', decoded.Id);
            res.status(200).json({ message: 'Mot de passe réinitialisé avec succès' });
        });

    });

}
