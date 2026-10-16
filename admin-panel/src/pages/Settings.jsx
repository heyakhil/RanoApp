import { useCallback, useEffect, useState } from 'react'
import { Alert, Button, Card, Label, Spinner, TextInput } from 'flowbite-react'
import { getPaymentDestination, savePaymentDestination } from '../api/settings'

export default function Settings() {
  const [upiId, setUpiId] = useState('')
  const [qrImageUrl, setQrImageUrl] = useState('')
  const [qrFile, setQrFile] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState('')

  const loadDestination = useCallback(async () => {
    setIsLoading(true)
    setError('')
    try {
      const destination = await getPaymentDestination()
      setUpiId(destination?.upiId || '')
      setQrImageUrl(destination?.qrImageUrl || '')
    } catch (loadError) {
      setError(loadError.message || 'Unable to load payment settings.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    const timeoutId = window.setTimeout(loadDestination, 0)
    return () => window.clearTimeout(timeoutId)
  }, [loadDestination])

  const save = async (event) => {
    event.preventDefault()
    setSaved('')
    setError('')
    setIsSaving(true)
    try {
      const destination = await savePaymentDestination(upiId.trim(), qrFile)
      setUpiId(destination.upiId)
      setQrImageUrl(destination.qrImageUrl)
      setQrFile(null)
      setSaved('Payment details saved. The app will show them on the next recharge.')
    } catch (saveError) {
      setError(saveError.message || 'Unable to save payment details.')
    } finally {
      setIsSaving(false)
    }
  }

  const [previewUrl, setPreviewUrl] = useState('')

  useEffect(() => {
    if (!qrFile) {
      setPreviewUrl('')
      return undefined
    }

    const objectUrl = URL.createObjectURL(qrFile)
    setPreviewUrl(objectUrl)
    return () => URL.revokeObjectURL(objectUrl)
  }, [qrFile])

  const shownQr = previewUrl || qrImageUrl

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Settings</h1>
        <p className="mt-1 text-sm text-gray-500">
          Set the UPI ID and QR code users see when they send a recharge.
        </p>
      </div>

      {error ? (
        <Alert color="failure" onDismiss={() => setError('')}>
          {error}
        </Alert>
      ) : null}
      {saved ? (
        <Alert color="success" onDismiss={() => setSaved('')}>
          {saved}
        </Alert>
      ) : null}

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Spinner size="xl" />
        </div>
      ) : (
        <Card className="border border-gray-100 shadow-sm">
          <form className="space-y-5" onSubmit={save}>
            <div>
              <Label htmlFor="payment-upi">UPI ID</Label>
              <TextInput
                id="payment-upi"
                value={upiId}
                onChange={(event) => setUpiId(event.target.value)}
                placeholder="name@bank"
                required
              />
            </div>
            <div>
              <Label htmlFor="payment-qr">QR code image</Label>
              <input
                id="payment-qr"
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="mt-2 block w-full text-sm text-gray-600"
                onChange={(event) => setQrFile(event.target.files?.[0] ?? null)}
              />
              <p className="mt-2 text-xs text-gray-500">PNG or JPG, up to 5MB. Leave empty to keep the current QR.</p>
            </div>
            {shownQr ? (
              <img
                src={shownQr}
                alt="Payment QR preview"
                className="h-40 w-40 rounded-lg border border-gray-200 object-contain"
              />
            ) : null}
            <div className="flex justify-end">
              <Button type="submit" color="blue" disabled={isSaving}>
                {isSaving ? 'Saving...' : 'Save payment details'}
              </Button>
            </div>
          </form>
        </Card>
      )}
    </div>
  )
}
