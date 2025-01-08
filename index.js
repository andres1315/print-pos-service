// server.js

const getDeviceList = require('usb').getDeviceList;
const express = require('express');
const escpos = require('escpos');
escpos.USB = require('escpos-usb');
const cors = require('cors');
const app = express();
const port = 3010;


// Middleware para parsear JSON
app.use(express.json());
app.use(cors());


// Función para encontrar la impresora USB
function findPrinter() {
    try {
        const printerName = 'POS-80';
        /* const device = new escpos.USB(); */
        //print is digitalpoos  k200-l
        
        const device = new escpos.USB();     

        const options = { encoding: "GB18030" };
        const printer = new escpos.Printer(device, options);
        return { device, printer };
    } catch (error) {
        console.error('Error al encontrar la impresora:', error);
        return null;
    }
}

// Ruta para imprimir
app.post('/print', async (req, res) => {
    try {
        const { text,enterprise,nit, products,report } = req.body;
        
        if (!text) {
            return res.status(400).json({ message: 'No se proporcionó texto para imprimir' });
        }

        const printerSetup = findPrinter();
        if (!printerSetup) {
            return res.status(500).json({ message: 'No se encontró la impresora' });
        }

        const { device, printer } = printerSetup;

        device.open(function(error){
            if(error) {
                console.error('Error al abrir la impresora:', error);
                return res.status(500).json({ message: 'Error al abrir la impresora' });
            }

            if(!report){
                printer
                    .font('a')
                    .align('ct')
                    .style('b')
                    .encode('utf8')
                    .text(text)
                    .feed(3)
                    .cut()
                    .close();
            }else{
                printer
                    .font('a')
                    .align('ct')
                    .style('b')
                    .size(1, 1)
                    .text(enterprise)
                    .text(nit)
                    .text('Reporte de ventas')
                    .text('Fecha: '+new Date().toLocaleDateString())
                    .text('Hora: '+new Date().toLocaleTimeString())
            }
            
            console.log('imprimiendo')
            res.json({ success: true, message: 'Documento enviado a imprimir' });
        });

    } catch (error) {
        console.error('Error al imprimir:', error);
        res.status(500).json({ message: 'Error al imprimir' });
    }
});

// Ruta de healthcheck
app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});

app.listen(port, () => {
    console.log(`Servidor de impresión corriendo en http://localhost:${port}`);
});