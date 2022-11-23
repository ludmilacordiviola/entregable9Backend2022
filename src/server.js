const express = require('express')
const path = require('path')
const { Server: IOServer } = require('socket.io')
const Contenedor = require('./utils/contenedor.js')
const Chat = require('./utils/chat')

const app = express()
const expressServer = app.listen(8080, () => console.log('Server escuchando en el puerto 8080'))
const io = new IOServer(expressServer)


app.use(express.static(path.join(__dirname, '../public')))

//Objeto de configuracion mysql
const mysqlConfig = {
    client: "mysql",
    connection: {
        host: "127.0.0.1",
        user: "root",
        password: "",
        database: "mibase",
    },
    pool: {min: 0, max: 7}
}

//Objeto de configuracion sqlite3
const sqlite3Config = {
    client: "sqlite3",
    connection: { filename: './src/database/chatdb.sqlite' },
    useNullAsDefault: true
}

const contenedor = new Contenedor(mysqlConfig, 'products')
const chat = new Chat(sqlite3Config, 'chat')
const messageArray = []

//Aca vienen las interacciones de io: servidor<-->cliente
io.on('connection', async socket =>  {
    console.log(`Se conecto el cliente con id: ${socket.id}`)
    socket.emit('server:products', await contenedor.getAll())
    socket.emit('server:mensajes', await chat.getAll())

    //Evento de carga de nuevo producto
    socket.on('client:newProduct', async (newProductInfo) => {
        await contenedor.postProduct(newProductInfo)
        io.emit('server:products', await contenedor.getAll())
    })
    
    //Evento de nuevo mensaje
    socket.on('client:message', async messageInfo => {
        await chat.postMessage(messageInfo)

        io.emit('server:mensajes', await chat.getAll())
    })
})