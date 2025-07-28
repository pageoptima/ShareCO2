self.addEventListener("push", (event) => {
  const { notification, data } = event.data.json();
  self.registration.showNotification(notification.title, {
    ...notification,
    icon: "/images/shareco2-icon.png",
    data: { url: data?.url || "/dashboard?tab=booked" },
  });
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const urlToOpen = event.notification.data?.url || "/dashboard?tab=booked";
  event.waitUntil(clients.openWindow(urlToOpen));
});
