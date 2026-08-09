import { useEffect, useState } from "react";
import Sidebar from "../../components/layout/Sidebar";
import Header from "../../components/layout/Header";
import socket from "../../services/socketService";

export default function MainLayout({
  children,
  headerProps,
}) {
  const [collapsed, setCollapsed] =
    useState(false);

  const [banner, setBanner] =
    useState(null);

  // ==========================================
  // Unlock browser audio after first click
  // ==========================================

  useEffect(() => {
    const unlockAudio = () => {
      const audio =
        new Audio(
          "/notifications.mp3"
        );

      audio
        .play()
        .then(() => {
          audio.pause();
          audio.currentTime = 0;

          console.log(
            "AUDIO UNLOCKED!"
          );
        })
        .catch(() => {});

      window.removeEventListener(
        "click",
        unlockAudio
      );
    };

    window.addEventListener(
      "click",
      unlockAudio
    );

    return () => {
      window.removeEventListener(
        "click",
        unlockAudio
      );
    };
  }, []);

  // ==========================================
  // Socket registration and listeners
  // ==========================================

  useEffect(() => {
    const registerPharmacy = () => {
      console.log(
        "================================"
      );

      console.log(
        "SOCKET CONNECTED"
      );

      console.log(
        "Socket ID:",
        socket.id
      );

      const token =
        localStorage.getItem(
          "token"
        );

      if (!token) {
        console.log(
          "NO TOKEN FOUND"
        );

        return;
      }

      try {
        const tokenParts =
          token.split(".");

        if (tokenParts.length !== 3) {
          console.log(
            "INVALID TOKEN FORMAT"
          );

          return;
        }

        const payload =
          JSON.parse(
            atob(tokenParts[1])
          );

        const pharmacyId =
          payload?.pharmacy_id;

        if (!pharmacyId) {
          console.log(
            "PHARMACY ID NOT FOUND IN TOKEN"
          );

          return;
        }

        console.log(
          "REGISTERING PHARMACY:",
          pharmacyId
        );

        socket.emit(
          "registerPharmacy",
          pharmacyId
        );
      } catch (error) {
        console.log(
          "TOKEN DECODE ERROR:",
          error
        );
      }
    };

    const handleAnyEvent = (
      event,
      ...args
    ) => {
      console.log(
        "SOCKET EVENT:",
        event
      );

      console.log(
        "SOCKET DATA:",
        args
      );
    };

    const handleReservationNotification =
      (data) => {
        console.log(
          "RESERVATION RECEIVED!"
        );

        console.log(data);

        setBanner({
          type: "reservation",
          title: "New Reservation",
          message:
            data?.message ||
            "A new reservation has been received.",
          referenceId:
            data?.reservation_id ||
            data?.reservationId ||
            null,
        });

        window.dispatchEvent(
          new Event(
            "refreshReservations"
          )
        );
      };

    const handlePrescriptionNotification =
      (data) => {
        console.log(
          "PRESCRIPTION RECEIVED!"
        );

        console.log(data);

        setBanner({
          type: "prescription",
          title: "New Prescription",
          message:
            data?.message ||
            "A new prescription has been received.",
          referenceId:
            data?.prescription_id ||
            data?.prescriptionId ||
            null,
        });

        window.dispatchEvent(
          new Event(
            "refreshPrescriptions"
          )
        );
      };

    const handlePlaySound = () => {
      console.log(
        "PLAY SOUND RECEIVED!"
      );

      const audio =
        new Audio(
          "/notifications.mp3"
        );

      audio
        .play()
        .then(() => {
          console.log(
            "SOUND PLAYED!"
          );
        })
        .catch((error) => {
          console.log(
            "AUDIO ERROR:",
            error
          );
        });
    };

    // Attach listeners before connecting
    socket.on(
      "connect",
      registerPharmacy
    );

    socket.onAny(
      handleAnyEvent
    );

    socket.on(
      "reservationNotification",
      handleReservationNotification
    );

    socket.on(
      "prescriptionNotification",
      handlePrescriptionNotification
    );

    socket.on(
      "playSound",
      handlePlaySound
    );

    // Connect only after listeners exist
    if (!socket.connected) {
      socket.connect();
    } else {
      registerPharmacy();
    }

    return () => {
      socket.off(
        "connect",
        registerPharmacy
      );

      socket.offAny(
        handleAnyEvent
      );

      socket.off(
        "reservationNotification",
        handleReservationNotification
      );

      socket.off(
        "prescriptionNotification",
        handlePrescriptionNotification
      );

      socket.off(
        "playSound",
        handlePlaySound
      );
    };
  }, []);

  const isPrescriptionBanner =
    banner?.type ===
    "prescription";

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar
        collapsed={collapsed}
        setCollapsed={setCollapsed}
      />

      <main
        className={`
          flex-1
          px-10
          py-8
          transition-all
          duration-300
          ${
            collapsed
              ? "ml-20"
              : "ml-64"
          }
        `}
      >
        <Header
          {...headerProps}
        />

        {/* Persistent Notification Banner */}

        {banner && (
          <div
            className={`
              fixed
              top-5
              right-5
              z-50
              w-96
              p-5
              rounded-xl
              border-2
              shadow-2xl
              ${
                isPrescriptionBanner
                  ? "bg-purple-100 border-purple-500"
                  : "bg-green-100 border-green-500"
              }
            `}
          >
            <h2
              className={`
                text-xl
                font-bold
                ${
                  isPrescriptionBanner
                    ? "text-purple-800"
                    : "text-green-800"
                }
              `}
            >
              {banner.title}
            </h2>

            <p
              className={`
                mt-2
                ${
                  isPrescriptionBanner
                    ? "text-purple-700"
                    : "text-green-700"
                }
              `}
            >
              {banner.message}
            </p>

            {banner.referenceId && (
              <p className="mt-2 text-sm text-gray-700 break-all">
                {banner.type ===
                "reservation"
                  ? "Reservation ID:"
                  : "Prescription ID:"}
                {" "}
                {
                  banner.referenceId
                }
              </p>
            )}

            <button
              type="button"
              onClick={() =>
                setBanner(null)
              }
              className={`
                mt-4
                px-4
                py-2
                rounded-lg
                text-white
                ${
                  isPrescriptionBanner
                    ? "bg-purple-600 hover:bg-purple-700"
                    : "bg-green-600 hover:bg-green-700"
                }
              `}
            >
              Dismiss
            </button>
          </div>
        )}

        {children}
      </main>
    </div>
  );
}