const inicioDebug = require('debug')('app:inicio'); // Habilitar para debug (hay que instalar debug)
const dbDebug = require('debug')('app:db');
const express = require('express');
const config = require('config'); // Para manejar variables de entorno (hay que instalar config)
const logger = require('./logger') // Requiero el modulo con la funcion de middleware que voy a usar
const morgan = require('morgan'); // middleware de terceros para registrar los http requests. (instalar morgan)
const Joi = require('joi') // Paquete npm instalado para hacer validaciones
const app = express();  // Instancia de express para usar en las peticiones

app.use(express.json()); // Middleware de express para usar para parse de los datos en la peticion POST que  vienen por body.
app.use(express.urlencoded({extended: true})); // Middleware para recibir datos por form (urlenconded)
// El middleware de terceros bodyparser reemplaza el uso de json y urlenconded que son propios de express.

app.use(express.static('public')); // Middleware para procesar recursos estaticos como archivos (public es una carpeta)
// Con static puedo ver un archivo de public llamandolo desde el browser. o tambien imagenes

app.use(function (req, res, next) {  // Ejemplo de middleware de usuario
    console.log('Logging.....')
    next()                           // Debe usar next para que pasa al siguiente middleware
})

app.use(logger);  // Uso de middleware usando funcion externa (requerida)

app.use(function (req, res, next) {  // Ejemplo de middleware de usuario
    console.log('Autenticando....')
    next()                           // Debe usar next para que pasa al siguiente middleware
})

// Configuracion de entornos
console.log('Aplicacion: ' + config.get('nombre'));
console.log('BD server: ' + config.get('configDB.host'))

// Uso de middleware de terceros:
if(app.get('env') === 'development') {     // Solo en cvaso de desarfrollo activar morgan
  app.use(morgan('tiny'));
  // console.log('Morgan habilitado');
  // Em la consola aparecen registro de los request a la API y muestra el tiempo que tarda.
  // Sirve para desarrollo
  // Opcion usando la funci'on instancia de debug:
  inicioDebug('Morgan habilitado')  // Nombre que se dio a la funcion al requerir debug.
  // Aparece si esta seteada la variable de entorno DEBUG al valor app:inicio
}

// Trabajos con la base de datos
dbDebug('Conectando con la base de datos...')  // Otro uso de debug con otra variable de funcion.
// Aparece si esta seteada la variable de entorno DEBUG al valor app:db

const usuarios = [
    {id: 1, nombre:'Juan'},
    {id: 2, nombre: 'Pedro'},
    {id: 3, nombre: 'Ana'}
]

app.get('/',(req, res) => {
    res.send('Hola mundo desde express');
});

app.get('/api/usuarios',(req, res) => {
    // res.send(['Henry', 'Alvaro', 'Philip']);
    res.send(usuarios);
})

// app.get('/api/usuarios/:id', (req, res) => {
// res.send(req.params.id);
// })

app.get('/api/usuarios/:id', (req, res) => {
    //usuario = usuarios.find(u => u.id === parseInt(req.params.id))
    usuario = existeUsuario(req.params.id)
    if(!usuario) res.status(404).send('El usuario no existe');
    res.send(usuario);
})


app.get('/api/usuarios/:year/:month', (req, res) => {
    res.send(req.params);
})

app.get('/api/usuarios/:year/:month/:day', (req, res) => {
    res.send(req.query);
})

// Usar POSTMAN para probar post y demas peticiones
app.post('/api/usuarios',(req, res) => {
    // Usamos paquete joi para validar: (ver docs en npm joi)
    //const schema = Joi.object({
    //    nombre: Joi.string().min(3).required()
    //});
    //const {error, value} = schema.validate({nombre: req.body.nombre});

    const {error, value} = validarUsuario(req.body.nombre)

    //console.log(error, value);
    if(!error) {
        const usuario = {
            id: usuarios.length + 1,
            nombre: value.nombre
        };
        usuarios.push(usuario);
        res.send(usuario);   
      } else {
        const mensaje = error.details[0].message
        res.status(400).send(mensaje);
      }

    // Validacion sencilla sin libreria:
    // if(!req.body.nombre  || req.body.nombre.length <= 2)  {
    //     // 400 (Bad request)
    //     res.status(400).send('Debe mandar un campo llamado nombre y con un contenido de al menos 3 letras');
    //     return;
    // }
    // const usuario = {
    //     id: usuarios.length + 1,
    //     nombre: req.body.nombre
    // };
    // usuarios.push(usuario);
    // res.send(usuario);
})

app.put('/api/usuarios/:id', (req, res) => {
    // usuario = usuarios.find(u => u.id === parseInt(req.params.id))
    usuario = existeUsuario(req.params.id)
    if(!usuario) {
        res.status(404).send('El usuario no existe');
        return
    }

    //const schema = Joi.object({
    //    nombre: Joi.string().min(3).required()
    //});
    //const {error, value} = schema.validate({nombre: req.body.nombre});

    const {error, value} = validarUsuario(req.body.nombre)
    if(error) {   
        const mensaje = error.details[0].message
        res.status(400).send(mensaje);
        return
    }
    usuario.nombre = value.nombre;
    res.send(usuario); 
})

app.delete('/api/usuarios/:id', (req, res) => {
    usuario = existeUsuario(req.params.id)
    if(!usuario) {
        res.status(404).send('El usuario no existe');
        return
    }
    index = usuarios.indexOf(usuario);
    usuarios.splice(index,1);
    res.send(usuario);
})

// Para no repetir codigo, lo ponemos en una funcion que luego invocamos:
function existeUsuario(id){
    return (usuarios.find(u => u.id === parseInt(id)))
}

function validarUsuario(nom){
    const schema = Joi.object({
        nombre: Joi.string().min(3).required()
    });
    return (schema.validate({nombre: nom}));
}

    // Duda: como es que el elemento queda modificado en el array usuarios si nunca se reemplaza por el nuveo valor
    // que esta en usuario ? Sera que la constante usuario es una referencia al elemento y no el valor del elemento ?
    // Respuesta de stack overflow: el find (igual que el filter), debido a que se trata d eun array de objectos (no de 
    // primitivos, devuelve la referencia al objeto y no su valor). Al modificar el valor d ela referencia, queda
    // modificado en el array original. Los objectos (arrays, objects, functions) se asignan por referencia.
    // Ver: https://codeburst.io/explaining-value-vs-reference-in-javascript-647a975e12a0


port = process.env.PORT || 3000 ;
app.listen(port, () => {
    console.log(`Escuchando en el puerto ${port}...`);
})

