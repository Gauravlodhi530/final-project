require('dotenv').config()
const app = require('./src/app')
const connectToDb = require('./src/db/db')
const listener = require('./src/broker/listener')
const { connect } = require('./src/broker/broker')


connectToDb()
connect().then(() =>{
    listener()
})




app.listen(3007, () =>{
    console.log("seller server is running on http://localhost:3007");
})