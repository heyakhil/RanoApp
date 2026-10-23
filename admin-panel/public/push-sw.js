self.addEventListener('push', (event) => {
  const payload = {
    title: 'New recharge request',
    body: 'A recharge request is waiting for review.',
    tag: 'recharge',
    url: '/dashboard/recharge',
  }

  try {
    if (event.data) Object.assign(payload, event.data.json())
  } catch (error) {
    console.error('Unable to read a recharge push.', error)
  }

  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      tag: payload.tag,
      data: { url: payload.url },
    }),
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const path = event.notification.data?.url || '/dashboard/recharge'
  const target = new URL(path, self.location.origin).href

  event.waitUntil(
    (async () => {
      const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true })
      const existing = windows.find((client) => client.url.startsWith(self.location.origin))
      if (existing) {
        await existing.focus()
        existing.postMessage({ type: 'open-recharge-requests' })
        return
      }

      await self.clients.openWindow(target)
    })(),
  )
})
