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
  const clickAction = data.redirectUrl || "/";

  event.notification.close();

  // Focus an open client tab or open a new one
  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((windowClients) => {
        // If there's already a tab open to the target URL, focus it
        for (const client of windowClients) {
          if (client.url === clickAction && "focus" in client) {
            return client.focus();
          }
        }
        // Otherwise, open a new tab
        if (clients.openWindow) {
          return clients.openWindow(clickAction);
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