self.addEventListener('push', event => {
  // If the push message has JSON data, parse it. Otherwise, fall back to an empty object.
  let payload = {};
  try {
    payload = event.data.json();
  } catch (e) {
    console.warn('Push event had no JSON payload', e);
  }

  const {
    notification = {},
    data = {}
  } = payload;
  
  const {
    title = 'Notification',
    body  = '',
    icon  = '/images/volume.png',
    badge = '/images/volume.png',
    actions,
    tag,
    requireInteraction
  } = notification;

  // If there's no notification block, it's a silent/data‑only push:
  if (!payload.notification) {
    // You can handle background sync or data caching here:
    console.log('Silent push received:', data);
    // Example: skip showing a notification
    return;
  }

  // Show the notification
  const showOptions = {
    body,
    icon: '/images/volume.png',               // e.g. "/icons/notification-icon.png"
    badge: '/images/volume.png',              // e.g. "/icons/notification-badge.png"
    data,               // this will be available in the click handler
    tag,                // for replacing/grouping notifications
    requireInteraction, // keep notification on screen until dismissed
    actions             // e.g. [{ action: 'open', title: 'Open App' }]
  };

  console.log(showOptions);

  event.waitUntil(self.registration.showNotification(title, showOptions));
});

// Handle notification click events
self.addEventListener( 'notificationclick', event => {
  const notification = event.notification;
  const data         = notification.data || {};
  const clickAction  = data.url || '/';

  event.notification.close();

  // Focus an open client tab or open a new one
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(windowClients => {
      // If there's already a tab open to the target URL, focus it
      for (const client of windowClients) {
        if (client.url === clickAction && 'focus' in client) {
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
