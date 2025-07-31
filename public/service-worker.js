
self.addEventListener("push", (event) => {
  // If the push message has JSON data, parse it. Otherwise, fall back to an empty object.
  let payload = {};
  try {
    payload = event.data.json();
  } catch (e) {
    console.warn("Push event had no JSON payload", e);
  }

  const { notification = {}, data = {} } = payload;

  const eventName = data.eventName;
  const title = notification.title;
  const body = notification.body;
  const icon = "/images/shareCo2.png";
  let sound;

  switch (eventName) {
    case "booking_confirmation":
      sound = "/audios/bookingSound.mp3";
      break;
    case "ride_activated":
      sound = "";
      break;
    case "ride_started":
      sound = "";
      break;
    case "ride_completed":
      sound = "";
      break;
    case "ride_cancelled":
      sound = "";
      break;
    case "booking_cancelled":
      sound = "";
      break;
  }

  // Show the notification
  const showOptions = {
    body,
    icon,
    badge: icon,
    sound,
  };

  console.log(showOptions);

  event.waitUntil(self.registration.showNotification(title, showOptions));
});

// Handle notification click events
self.addEventListener("notificationclick", (event) => {
  const notification = event.notification;
  const data = notification.data || {};
  const redirectUrl = data.redirectUrl || "/";

  event.notification.close();

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((windowClients) => {
      let matchingClient = null;
      const targetUrl = new URL(redirectUrl, self.location.origin).href;

      for (const client of windowClients) {

        const pwaStartUrl = new URL('/', self.location.origin).href;

        if (client.url.startsWith(pwaStartUrl) && "focus" in client) {
          matchingClient = client;
          break; // Found a PWA client, prioritize it
        }
      }

      if (matchingClient) {
        // If an existing PWA window is found
        if (matchingClient.url !== targetUrl) {
          // If the PWA is open but on a different page, navigate it
          return matchingClient.navigate(targetUrl).then(() => matchingClient.focus());
        } else {
          // PWA is open and already on the target page, just focus it
          return matchingClient.focus();
        }
      } else {
        // No PWA window found (or no regular tab matching), open a new one.
        // This will leverage the browser's PWA launch mechanism if installed.
        if (clients.openWindow) {
          return clients.openWindow(redirectUrl);
        }
      }
    })
  );
});

self.addEventListener("install", () => {
  self.skipWaiting(); // activate new SW immediately
});

self.addEventListener("activate", () => {
  clients.claim(); // take control of uncontrolled pages
});
