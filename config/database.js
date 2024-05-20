const mongoose = require('mongoose');

exports.dbConnect = () => {
    mongoose.connect(process.env.DB_URI)
        .then((data) => {
            console.log(`Mongodb connected with server`);
        })
        .catch((err) => {
            console.log(err);
        })
}

