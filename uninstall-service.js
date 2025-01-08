const Service = require('node-windows').Service;
const path = require('path');

// Crea un nuevo objeto de servicio
const svc = new Service({
    name: 'PrinterServiceThermal',
    script: path.join(__dirname, 'index.js')
});

// Escuchar eventos del servicio
svc.on('uninstall', () => {
    console.log('Servicio desinstalado');
});

// Desinstalar el servicio
svc.uninstall();