import * as Ably from "ably";
import Push from "ably/push";

let realtimeInstance: Ably.Realtime | null = null;

/**
 * Get the ably client
 */
export function getAblyClient() {
    
    if (!realtimeInstance) {
        realtimeInstance = new Ably.Realtime({
            authUrl             : `${location.origin}/api/message/token`,
            pushServiceWorkerUrl: '/service-worker.js?v=4',
            plugins             : { Push },
            closeOnUnload       : true,
            autoConnect         : true,
        });
    }
    
    return realtimeInstance;
}
