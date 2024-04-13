const express = require('express')
const cors = require('cors')
const handleApis = require('./apis/apis')
const dotenv = require('dotenv')
const app = express();

dotenv.config();
app.use(cors())

handleApis(app);

app.listen(process.env.PORT, function(req, res){
    console.log(`Server running on port ${process.env.PORT}`)
})
