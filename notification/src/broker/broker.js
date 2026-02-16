const amqplib = require('amqplib');

let channel, connection;


async function connect() {

    if(connection) return connection;

    try {
        connection = await amqplib.connect(process.env.RABBIT_URL);
        channel = await connection.createChannel();
        console.log("Connected to RabbitMQ");
    } catch (error) {
        console.error("Error connecting to RabbitMQ:", error);
    }
}



module.exports = {
    connect,
    channel,
    connection
}