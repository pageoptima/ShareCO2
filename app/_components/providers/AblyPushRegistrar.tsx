"use client";

import { useAbly } from "ably/react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

function AblyPushRegistrar() {

    const getNotificationStatus = () => {
        const notificationStatus = localStorage.getItem("notificationAllowed");

        switch (notificationStatus) {
            case 'granted': return 'granted';
            case 'notnow': return 'notnow';
            case 'denied': return 'denied';
            default: return 'denied';
        }
    };

    const setNotificationStatus = (status: string) => {
        localStorage.setItem("notificationAllowed", status);
    };

    const shouldShowPopup = () => {
        const notificationStatus = localStorage.getItem("notificationAllowed");

        if (notificationStatus === "notnow") {
            return false;
        }
        if (Notification?.permission === "default") {
            return true;
        }
        if (notificationStatus === "denied") {
            return false;
        }
        if (notificationStatus === "granted") {
            return false;
        }

        return true;
    };

    const ably = useAbly();
    const [isOpen, setIsOpen] = useState(shouldShowPopup());

    const handleAllow = useCallback(async () => {
        // Close the popup
        setIsOpen(false);

        if (!ably) return;

        // Ask browser for notification permission explicitly
        const permission = await Notification.requestPermission();

        if (permission !== "granted") {
            setNotificationStatus("denied");
            toast.info("Notification permission not granted");
            return;
        }

        // Unregister the device before activation
        localStorage.removeItem('ably.push.deviceId');

        try {

            // 1. Browser & platform info
            window.alert( `User Agent: ${navigator.userAgent}` );
            window.alert( `Platform: ${navigator.platform}` );

            // 2. Check basic API support
            const pushSupported = "PushManager" in window;
            const notifSupported = "Notification" in window;
            const swSupported = "serviceWorker" in navigator;

            window.alert(`PushManager supported: ${pushSupported}`);
            window.alert(`Notification API supported: ${notifSupported}`);
            window.alert(`Service Worker supported: ${swSupported}`);

            if (!pushSupported || !notifSupported || !swSupported) {
                window.alert("Push is not supported on this browser/device.");
                return;
            }

            // 3. Check current notification permission
            window.alert(`Current Notification.permission: ${Notification.permission}`);

            // 4. Check service worker registration
            try {
                const reg = await navigator.serviceWorker.getRegistration();
                if (!reg) {
                    window.alert("No service worker registered! Push won't work.");
                } else {
                    window.alert("Service worker registered:" + reg );
                }
            } catch (err) {
                window.alert("Error checking service worker registration:" + err );
            }

            ably.push.activate(
                async (deviceDetails) => {

                    // window.alert(JSON.stringify({
                    //     deviceId: deviceDetails.id,
                    //     platform: deviceDetails.platform,
                    //     formFactor: deviceDetails.formFactor,
                    //     pushRecipient: deviceDetails.push.recipient,
                    // }))


                    // Register this browser on your backend
                    await fetch("/api/notification/register", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            deviceId: deviceDetails.id,
                            platform: deviceDetails.platform,
                            formFactor: deviceDetails.formFactor,
                            pushRecipient: deviceDetails.push.recipient,
                        }),
                    });

                    // window.alert("After notification register");

                    setNotificationStatus("granted");
                },
                (error) => {
                    console.error(`Push activation failed:`, error);
                    toast.error("Something went wrong while allowing notification!");
                }
            );
        } catch (error) {
            window.alert((error as Error).stack);
        }

    }, [ably, setIsOpen]); // Dependencies for useCallback

    const handleNotNow = () => {
        setIsOpen(false);
        setNotificationStatus("notnow");
    };

    // Startup check: if already granted, just activate
    useEffect(() => {
        // Update notification status to denied for manual denied from browsers
        if (Notification.permission === "denied") {
            setNotificationStatus("denied");
        }

        // Update notification status to granted for manual update from browser
        if (
            Notification.permission === "granted" &&
            getNotificationStatus() !== "granted"
        ) {
            handleAllow();
        }
    }, [ably, handleAllow]);

    return (
        <>
            {isOpen && (
                <div className="fixed bottom-4 right-4 w-[90%] max-w-sm bg-white border border-gray-200 rounded-2xl shadow-xl p-4 z-50 animate-slide-up md:right-6 md:bottom-6">
                    <p className="text-gray-800 text-base font-medium mb-4">
                        Enable notifications to stay updated!
                    </p>
                    <div className="flex justify-end gap-3">
                        <button
                            onClick={handleNotNow}
                            className="px-4 py-2 text-sm rounded-full bg-gray-100 text-gray-700 hover:bg-gray-200 transition cursor-pointer"
                        >
                            Not now
                        </button>
                        <button
                            onClick={handleAllow}
                            className="px-4 py-2 text-sm rounded-full bg-blue-600 text-white hover:bg-blue-700 transition cursor-pointer"
                        >
                            Allow
                        </button>
                    </div>
                </div>
            )}
        </>
    );
}

export default AblyPushRegistrar;