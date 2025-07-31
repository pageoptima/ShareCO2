"use client";

import { useAbly } from "ably/react";
import { useEffect } from "react";

export function AblyPushRegistrar() {

    const ably = useAbly();

    // useEffect(() => {
    //     if ( !ably ) return;

    //     ably.push.activate(
    //         async (deviceDetails) => {

    //             // Now register this browser on your backend
    //             await fetch("/api/notification/register", {
    //                 method: "POST",
    //                 headers: { "Content-Type": "application/json" },
    //                 body: JSON.stringify({
    //                     deviceId    : deviceDetails.id,
    //                     platform    : deviceDetails.platform,
    //                     formFactor  : deviceDetails.formFactor,
    //                     pushRecipent: deviceDetails.push.recipient,
    //                 }),
    //             });
                
    //         },
    //         (error) => {
    //             console.error( `Push activation failed:`, error );
    //         }
    //     );
    // }, [ ably ]);

    // return null;

    const handleAllow = () => {

        if ( !ably ) return;

        ably.push.activate(
            async (deviceDetails) => {

                // Now register this browser on your backend
                await fetch("/api/notification/register", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        deviceId    : deviceDetails.id,
                        platform    : deviceDetails.platform,
                        formFactor  : deviceDetails.formFactor,
                        pushRecipent: deviceDetails.push.recipient,
                    }),
                });
                
            },
            (error) => {
                console.error( `Push activation failed:`, error );
            }
        );
    }

    return (
        <h1 onClick={handleAllow}>
            Allow Notification
        </h1>
    );
}
