import { Card } from 'flowbite-react'

export default function PlaceholderPage({ title, description }) {
  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">{title}</h1>
        <p className="mt-1 text-sm text-gray-500">{description}</p>
      </div>

      <Card className="border border-gray-100 shadow-sm">
        <p className="text-sm text-gray-600">
          This section is ready for your next feature. The layout, routing, and authentication shell are already in place.
        </p>
      </Card>
    </div>
  )
}
