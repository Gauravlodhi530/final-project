const mongoose = require('mongoose')


async function connectToDb() {
    try{
        await mongoose.connect(process.env.MONGO_URI)
        console.log("Database connected successsfully !!");
        
    } catch(error){
        console.log("Error connecting to database",error);
        
    }
    
}

module.exports = connectToDb