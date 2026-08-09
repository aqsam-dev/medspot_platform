const { Server } = require("socket.io");


let io;

// Stores connected pharmacies
// Key = pharmacy_id
// Value = socket.id
const connectedPharmacies = new Map();


// =====================================
// Initialize Socket.IO
// =====================================

function initialize(server) {

    io = new Server(server, {

        cors: {

            origin: "*",

            methods: ["GET", "POST"]

        }

    });

    io.on("connection", (socket) => {

        console.log("Socket Connected:", socket.id);

        // Pharmacy registers itself after login
        socket.on("registerPharmacy", (pharmacyId) => {
            const normalizedPharmacyId =
                String(pharmacyId);

            connectedPharmacies.set(
                normalizedPharmacyId,
                socket.id
            );

            console.log(
                `Pharmacy ${normalizedPharmacyId} registered.`
            );
        });

        socket.on("disconnect", () => {

            console.log(
                "Socket Disconnected:",
                socket.id
            );

            for (const [pharmacyId, id] of connectedPharmacies.entries()) {

                if (id === socket.id) {

                    connectedPharmacies.delete(pharmacyId);

                    break;

                }

            }

        });

    });

}


// =====================================
// Send notification
// =====================================
function sendToPharmacy(pharmacyId, data) {

    console.log("sendToPharmacy called");
    console.log("Pharmacy ID:", pharmacyId);

    console.log(
        "CONNECTED PHARMACIES:",
        connectedPharmacies
    );

    const normalizedPharmacyId =
        String(pharmacyId);

    const socketId =
        connectedPharmacies.get(
            normalizedPharmacyId
        );

    console.log("Socket ID:", socketId);

    if (!socketId) {
        console.log(
            "Pharmacy NOT connected."
        );
        return;
    }

    io.to(socketId).emit(
        "reservationNotification",
        data
    );

    console.log(
        "Notification emitted."
    );
}

// =====================================
// Send prescription notification
// =====================================

function sendPrescriptionToPharmacy(
    pharmacyId,
    data
) {
    if (!io) {
        console.log(
            "Socket.IO is not initialized."
        );

        return;
    }

    const normalizedPharmacyId =
        String(pharmacyId);

    const socketId =
        connectedPharmacies.get(
            normalizedPharmacyId
        );

    console.log(
        "Prescription notification pharmacy:",
        normalizedPharmacyId
    );

    console.log(
        "Prescription notification socket:",
        socketId
    );

    if (!socketId) {
        console.log(
            "Pharmacy is not currently connected."
        );

        return;
    }

    io.to(socketId).emit(
        "prescriptionNotification",
        data
    );

    console.log(
        "Prescription notification emitted."
    );
}

// =====================================
// Send sound only
// =====================================

function playNotificationSound(pharmacyId) {

    if (!io) return;

    const socketId =
        connectedPharmacies.get(
            String(pharmacyId)
        );

    if (!socketId) return;

    io.to(socketId).emit(

        "playSound"

    );

}


// =====================================
// Export
// =====================================

module.exports = {

    initialize,
    sendToPharmacy,
    playNotificationSound,
    sendPrescriptionToPharmacy

};