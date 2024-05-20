const app = require('express')();
const PORT = process.env.PORT || 5000;
require('dotenv').config();
require('./config/database').dbConnect();
require('./config/cloudinary')();


app.get('/', (req, res) => {
    res.send('Hello World!');
});

app.listen(PORT, () => {
    console.log(`App listening on port ${PORT}`)
})