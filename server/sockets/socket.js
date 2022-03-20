const { io } = require('../server');
const { Usuarios } = require('../classes/usuarios');
const {crearMensaje} = require('../utils/utils');

const usuarios = new Usuarios();

io.on('connection', (client) => { 
    client.on('entrarChat', (usuario, callback) => {
        
        if(!usuario.nombre || !usuario.sala){
            return callback({
                error: true,
                msg: 'El nombre/sala es necesario'
            });
        }

        client.join(usuario.sala);

        let personas = usuarios.agregarPersona(client.id, usuario.nombre, usuario.sala);
        client.broadcast.to(usuario.sala).emit('listaPersona', usuarios.getPersonasPorSala(usuario.sala));
        return callback(personas);
    });

    client.on('crearMensaje', (data) => {
        let persona = usuarios.getPersona(client.id);
        let mensaje = crearMensaje(persona.nombre, data.mensaje);
        client.broadcast.to(persona.sala).emit('crearMensaje', mensaje);
    });

    client.on('disconnect', () => {
        let personaBorrada = usuarios.borrarPersona(client.id);

        client.broadcast.to(personaBorrada.sala).emit('crearMensaje', 
            crearMensaje('Adminstrador', `${personaBorrada.nombre} abandonó el chat`));
        client.broadcast.to(personaBorrada.sala).emit('listaPersona', usuarios.getPersonasPorSala(personaBorrada.sala));
    });

    // Mensajes privados
    client.on('mensajePrivado', data => {
        let persona = usuarios.getPersona(client.id);
        client.broadcast.to(data.to).emit('mensajePrivado', crearMensaje(persona.nombre, data.mensaje));
    });
});