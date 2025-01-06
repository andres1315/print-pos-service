// service.js
const Service = require('node-windows').Service;
const path = require('path');

const svc = new Service({
    name: 'PrinterService',
    description: 'Servidor local de impresión térmica',
    script: path.join(__dirname, 'index.js'),
    nodeOptions: [],
    workingDirectory: __dirname,
    allowServiceLogon: true
});

// Escuchar eventos del servicio
svc.on('install', () => {
    console.log('Servicio instalado correctamente');
    svc.start();
});

svc.on('uninstall', () => {
    console.log('Servicio desinstalado');
});

svc.on('start', () => {
    console.log('Servicio iniciado');
});

svc.on('stop', () => {
    console.log('Servicio detenido');
});

svc.on('error', (error) => {
    console.error('Error en el servicio:', error);
});

// Instalar el servicio
svc.install();