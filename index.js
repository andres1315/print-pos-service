// server.js
const express = require("express");
const escpos = require("escpos");
escpos.USB = require("escpos-usb");
const cors = require("cors");
const app = express();
const port = 3010;
const commands = escpos.command;

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
      qrCodeImageData,
      methodsPayments,
      typeInvoice
    } = req.body;
    const productsFiltered= products.filter(products=>products.ConsuProdPadre == null)
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

    device.open(async function (error) {
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
        let tableProductTotal = "";
        let tableProductCant = "";
        let tableOwnerSoftware = "";
        let lineBreak = "------------------------------------------------";
        console.log(typeInvoice)
        const isElectronicInvoice = typeInvoice.isElectronicInvoice;
        const isPOS = typeInvoice.isPOS;
        const isElectronicPOS=typeInvoice.isElectronicPOS
        // Header
        tableCompany += `${enterprise}\n`;
        tableCompany += `${commands.TEXT_FORMAT.TXT_BOLD_ON}NIT: ${nit}${commands.TEXT_FORMAT.TXT_BOLD_OFF}\n`;
        if (regimen === "C") {
          tableCompany += `${commands.TEXT_FORMAT.TXT_BOLD_ON}RESPONSABLE IVA/INC${commands.TEXT_FORMAT.TXT_BOLD_OFF}\n`;
          tableCompany += `Agente de retención\n`;
        }
        tableCompany += `${address}\n`;
        tableCompany += `${commands.TEXT_FORMAT.TXT_BOLD_ON}Teléfono:${commands.TEXT_FORMAT.TXT_BOLD_OFF} ${phone}\n`;
        tableCompany += `${commands.TEXT_FORMAT.TXT_BOLD_ON}Ciudad:${commands.TEXT_FORMAT.TXT_BOLD_OFF} ${city !=  null ? city : ''}\n`;
        tableCompany += lineBreak;
        if(qrCodeImageData?.nameReport){
          tableCompany += `${qrCodeImageData?.nameReport}\n`;
        }
        tableCompany += `${commands.TEXT_FORMAT.TXT_BOLD_ON}${numberBill}${commands.TEXT_FORMAT.TXT_BOLD_OFF}\n`;
        tableCompany += `PEDIDO: ${commands.TEXT_FORMAT.TXT_BOLD_ON}${numberOrder}${commands.TEXT_FORMAT.TXT_BOLD_OFF}\n`;
        tableCompany += `${commands.TEXT_FORMAT.TXT_BOLD_ON}Fecha y Hora:${commands.TEXT_FORMAT.TXT_BOLD_OFF}${new Date().toLocaleString()}\n`;
        tableCompany += lineBreak;
        
        
        printer
          .font("a")
          .size(0, 0)
          .style("NORMAL")
          .align("CT")
          .text(tableCompany)
        
        tableClient += `${commands.TEXT_FORMAT.TXT_BOLD_ON} Datos del Cliente${commands.TEXT_FORMAT.TXT_BOLD_OFF}\n`;
        tableClient += `${commands.TEXT_FORMAT.TXT_BOLD_ON} Cédula o nit:${commands.TEXT_FORMAT.TXT_BOLD_OFF} ${thirdPartyDoc}\n`;
        tableClient += `${commands.TEXT_FORMAT.TXT_BOLD_ON} Nombre:${commands.TEXT_FORMAT.TXT_BOLD_OFF} ${thirdPartyName}\n`;
        tableClient += `${commands.TEXT_FORMAT.TXT_BOLD_ON} Vendedor:${commands.TEXT_FORMAT.TXT_BOLD_OFF} ${sellerName}\n`;
        tableClient += lineBreak;
        
          printer
            .font("a")
            .align("LT")
            .text(tableClient)
            .style("b")
            .tableCustom([
              { text: `Código`, width: 0.15, align: "LEFT" },
              { text: `Producto`, width: 0.32, align: "LEFT" },
              { text: `Cant`, width: 0.10, align: "RIGHT" },
              { text: `Val Unit`, width:0.20, align: "RIGHT" },
              { text: `Val Total`, width: 0.23, align: "RIGHT" },
            ])
            .style("NORMAL")
        
        
        
        


        // Table Rows
        let cantItems = 0;
        let iva = 0;
        let ipoconsumo = 0;

        
        productsFiltered.forEach(async(item, index) => {
          const subtotal = item.Valor;
          cantItems += item.Cantidad;
          total += subtotal;

          const cantidad =item.Cantidad;
          const nombre = `${item.nameProduct}`.substring(0, 30);
          const productId = item.ProductoId;
          const subtotalFormatted = subtotal
            .toFixed(0)
            .replace(/\B(?=(\d{3})+(?!\d))/g, ",")
            const valUnitario = Number(subtotal/item.Cantidad).toFixed(0)
            .replace(/\B(?=(\d{3})+(?!\d))/g, ",")
          if (item.IvaId == "8.0000") {
            ipoconsumo += item.Iva;
          } else {
            iva += item.Iva;
          }

          printer
          .tableCustom([
            { text: productId, width: 0.15, align: "LEFT" },
            { text: nombre, width: 0.32, align: "LEFT" },
            { text: cantidad, width: 0.10, align: "RIGHT" },
            { text: valUnitario, width: 0.20, align: "RIGHT" },
            { text: subtotalFormatted, width: 0.23, align: "RIGHT" },
          ])
          
        });
        
        

        
        tableProductCant += `Cantidad Productos: ${productsFiltered.length}\n`;
        tableProductCant += lineBreak;
        tableProductTotal += `Val. Antes Impuestos:  ${(total - iva - ipoconsumo)
          .toFixed(0)
          .replace(/\B(?=(\d{3})+(?!\d))/g, ",")
          .padStart(11)}\n`;
        if(isElectronicPOS || isElectronicInvoice){
          tableProductTotal += `IVA:  ${iva
            .toFixed(0)
            .replace(/\B(?=(\d{3})+(?!\d))/g, ",")
            .padStart(11)}\n`;
        }
        tableProductTotal += `Impoconsumo:  ${ipoconsumo
          .toFixed(0)
          .replace(/\B(?=(\d{3})+(?!\d))/g, ",")
          .padStart(11)}\n`;
        tableProductTotal += `Total Factura:  ${total
          .toFixed(0)
          .replace(/\B(?=(\d{3})+(?!\d))/g, ",")
          .padStart(11)}\n`;
        tableProductTotal += lineBreak;
        tableResolution +=lineBreak
        tableResolution += `Número Resolución : ${numResolution}\n`;
        tableResolution += `Fecha Resolución : ${dateResolution}\n`;
        tableResolution += `Fecha Vencimiento Resolución : ${dateEndResolution}\n`;
        tableResolution += `Autorizado desde ${prefixResolution}-${startResolution} hasta ${prefixResolution}-${endResolution} \n`;
        tableOwnerSoftware += lineBreak;
        tableOwnerSoftware += `Impreso por : ${ownerName ? ownerName : "Prosof S.A.S"}\n`;
        tableOwnerSoftware += `Nit: ${ownerNit ? ownerNit : "900.320.258-0"}\n`;
        tableOwnerSoftware += `Tel: ${ownerPhone ? ownerPhone : "311 383 7234"}\n`;

        
          printer
            .style("b")
            .size(0, 0)
            .align("lt")
            .text(tableProductCant)
            .align("rt")
            .text(tableProductTotal)
            .align("lt")
            .text('Forma de pago:')
            .tableCustom([
              { text: 'Nombre', width: 0.70, align: "LEFT" },
              { text: 'Valor', width: 0.30, align: "LEFT" }
            ])
            .style("NORMAL")
            .tableCustom([
              { text: methodsPayments?.name, width: 0.70, align: "LEFT" },
              { text: total.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ","), width: 0.30, align: "LEFT" }
            ])
            .feed(1)
        
        console.log(qrCodeImageData)
        const imageQr = "data:image/png;base64,"+qrCodeImageData.img
        if(qrCodeImageData?.cufe){
          

          printer.text(qrCodeImageData?.cufe)
          
          setTimeout(async() => {
           await escpos.Image.load(imageQr, async function(image){
             printer
              .image(image,'s8')
           })
          
           
           /* await printer.qrimage(imageQr, { type: "png", size: 3 }, async function (err) {
             if (err) {
               console.error("Error al imprimir QR:", err);
             }
           }); */
         }, 700);
        }
        setTimeout(() => {
          let unionOwnerAndResolution = ''
          if(isElectronicPOS || isElectronicInvoice){
            unionOwnerAndResolution += tableResolution
          }
          unionOwnerAndResolution += tableOwnerSoftware
          printer
            .align("lt")
            .text(unionOwnerAndResolution)
            .feed(3)
            .cut()
            .close();
        }, 800)
        
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
