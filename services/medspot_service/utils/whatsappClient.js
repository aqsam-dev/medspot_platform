const { Client, LocalAuth } =require("whatsapp-web.js");
const qrcode =require("qrcode-terminal");

const client =
    new Client({
        authStrategy:
            new LocalAuth(),
        puppeteer: {
            headless: true
        }
    });

client.on(
    "qr",
    (qr) => {

        console.log(
            "SCAN THIS QR:"
        );

        qrcode.generate(
            qr,
            {
                small: true
            }
        );

    }
);

client.on(
    "ready",
    () => {

        console.log(
            "WHATSAPP READY!"
        );

    }
);

// client.initialize();
module.exports = client;