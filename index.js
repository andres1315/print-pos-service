// server.js

const getDeviceList = require("usb").getDeviceList;
const express = require("express");
const escpos = require("escpos");
escpos.USB = require("escpos-usb");
const cors = require("cors");
const app = express();
const port = 3010;

// Middleware para parsear JSON
app.use(express.json());
app.use(cors());

// Función para encontrar la impresora USB
function findPrinter() {
  try {
    const printerName = "POS-80";
    /* const device = new escpos.USB(); */
    //print is digitalpoos  k200-l

    const device = new escpos.USB();

    const options = { encoding: "CP437" };
    const printer = new escpos.Printer(device,options);
    return { device, printer };
  } catch (error) {
    console.error("Error al encontrar la impresora:", error);
    return null;
  }
}

// Ruta para imprimir
app.post("/print", async (req, res) => {
  try {
    const {
      text,
      enterprise,
      thirdPartyName,
      thirdPartyDoc,
      sellerName,
      nit,
      products,
      address,
      city,
      phone,
      numberBill,
      numberOrder,
      regimen,
      numResolution,
      dateResolution,
      dateEndResolution,
      prefixResolution,
      startResolution,
      endResolution,
      ownerName,
      ownerNit,
      ownerPhone,
      report,
    } = req.body;
    
    if (!text) {
      return res
        .status(400)
        .json({ message: "No se proporcionó texto para imprimir" });
    }

    const printerSetup = findPrinter();
    if (!printerSetup) {
      return res.status(500).json({ message: "No se encontró la impresora" });
    }

    const { device, printer } = printerSetup;

    device.open(function (error) {
      if (error) {
        console.error("Error al abrir la impresora:", error);
        return res.status(500).json({ message: "Error al abrir la impresora" });
      }

      if (!report) {
        printer
          .font("a")
          .align("ct")
          .size(1, 1)
          .style("b")
          .encode("utf8")
          .text(text)
          .feed(3)
          .cut()
          .close();
      } else {
        let total = 0;
        let tableCompany = "";
        let tableResolution = "";
        let tableClient = "";
        let tableProduct = "";
        let tableProductTotal = "";
        let tableProductCant = "";
        let lineBreak = "------------------------------------------------";
        // Header
        tableCompany += `${enterprise}\n`;
        tableCompany += `NIT: ${nit}\n`;
        tableCompany += `${address}\n`;
        tableCompany += `Teléfono: ${phone}\n`;
        tableCompany += `Ciudad: ${city}\n`;
        tableCompany += lineBreak;
        tableCompany += `FACTURA DE VENTA: ${numberBill}\n`;
        tableCompany += `PEDIDO: ${numberOrder}\n`;
        tableCompany += `Fecha y Hora: ${new Date().toLocaleString()}\n`;
        tableCompany += `Vendedor: ${sellerName}\n`;
        tableCompany += lineBreak;
        tableClient += `Cliente: ${thirdPartyName}\n`;
        tableClient += `Documento: ${thirdPartyDoc}\n`;
        tableClient += lineBreak;

        // Table Header
        tableProduct += `${"Nro".padStart(3)} ${"Cant".padStart(
          4
        )} ${"Producto".padEnd(27)} ${"Total".padEnd(11)}`;
        tableProduct += lineBreak;

        // Table Rows
        let cantItems = 0;
        let iva = 0;
        let ipoconsumo = 0;
        products.forEach((item, index) => {
          const subtotal = item.Valor;
          cantItems += item.Cantidad;
          total += subtotal;

          const nro = `${index + 1}`.padStart(3, "0");
          const cantidad = `${item.Cantidad}`.padStart(4, "0");
          const nombre = `${item.nameProduct}`.padEnd(27, "0").substring(0, 22);
          const subtotalFormatted = subtotal
            .toFixed(0)
            .replace(/\B(?=(\d{3})+(?!\d))/g, ",")
            .padStart(16);
          if (item.IvaId == "8.0000") {
            ipoconsumo += item.Iva;
          } else {
            iva += item.Iva;
          }
          tableProduct += `${nro} ${cantidad} ${nombre} ${subtotalFormatted}`;
        });

        tableProduct += lineBreak;
        tableProductCant += `Cantidad Productos: ${cantItems}\n`;
        tableProductCant += lineBreak;
        tableProductTotal += `Sub Total:  ${(total - iva - ipoconsumo)
          .toFixed(0)
          .replace(/\B(?=(\d{3})+(?!\d))/g, ",")
          .padStart(11)}\n`;
        tableProductTotal += `IVA:  ${iva
          .toFixed(0)
          .replace(/\B(?=(\d{3})+(?!\d))/g, ",")
          .padStart(11)}\n`;
        tableProductTotal += `Impoconsumo:  ${ipoconsumo
          .toFixed(0)
          .replace(/\B(?=(\d{3})+(?!\d))/g, ",")
          .padStart(11)}\n`;
        tableProductTotal += `Total Factura:  ${total
          .toFixed(0)
          .replace(/\B(?=(\d{3})+(?!\d))/g, ",")
          .padStart(11)}\n`;
        tableProductTotal += lineBreak;
        tableResolution += `Régimen ${regimen =='C'? 'Común' :'Simplificado'}\n`;
        tableResolution += `Resolución : ${numResolution}\n`;
        tableResolution += `Fecha Resolución : ${dateResolution}\n`;
        tableResolution += `Fecha Vencimiento Resolución : ${dateEndResolution}\n`;
        tableResolution += `Autorizado desde ${prefixResolution}-${startResolution} hasta ${prefixResolution}-${endResolution} \n`;
        tableResolution += lineBreak;
        tableResolution += `Fabricante de Software: ${
          ownerName ? ownerName : "Prosof S.A.S"
        }\n`;
        tableResolution += `Nit: ${ownerNit ? ownerNit : "900.320.258-0"}\n`;
        tableResolution += `Tel: ${ownerPhone ? ownerPhone : "311 383 7234"}\n`;

        printer
          .font("a")
          .align("ct")
          .style("b")
          .size(0, 0)
          .text(tableCompany)
          .align("lt")
          .text(tableClient)
          .align("rt")
          .text(tableProduct)
          .align("lt")
          .text(tableProductCant)
          .align("rt")
          .text(tableProductTotal)
          .align("lt")
          .text(tableResolution)
          .feed(3)
          .cut()
          .close();
      }

      console.log("imprimiendo");
      res.json({ success: true, message: "Documento enviado a imprimir" });
    });
  } catch (error) {
    console.error("Error al imprimir:", error);
    res.status(500).json({ message: "Error al imprimir" });
  }
});

// Ruta de healthcheck
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.listen(port, () => {
  console.log(`Servidor de impresión corriendo en http://localhost:${port}`);
});
