import { useCallback, useEffect, useState } from 'react'
import { Alert, Badge, Button, Card, Label, Spinner, TextInput } from 'flowbite-react'
import { Clock3, Pencil, Plus, RefreshCw, Trash2, Users } from 'lucide-react'
import {
  createMarket,
  declareMarketResult,
  deleteMarket,
  getMarkets,
  updateMarket,
  uploadMarketImage,
} from '../api/markets'

const MAX_IMAGE_BYTES = 1024 * 1024
const IMAGE_PX = 25

const emptyMarket = {
  name: '',
  symbol: '',
  openTime: '09:15',
  closeTime: '15:30',
  maxParticipants: '100',
  minBetAmount: '10',
  maxBetAmount: '1000',
}

const fieldClassName = 'w-full'

function toFormValues(market) {
  return {
    name: market.name,
    symbol: market.symbol,
    openTime: market.openTime,
    closeTime: market.closeTime,
    maxParticipants: String(market.maxParticipants),
    minBetAmount: String(market.minBetAmount),
    maxBetAmount: String(market.maxBetAmount),
  }
}

function toPayload(form) {
  return {
    name: form.name.trim(),
    symbol: form.symbol.trim().toUpperCase(),
    openTime: form.openTime,
    closeTime: form.closeTime,
    maxParticipants: Number(form.maxParticipants),
    minBetAmount: Number(form.minBetAmount),
    maxBetAmount: Number(form.maxBetAmount),
  }
}

export default function Markets() {
  const [markets, setMarkets] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [pageError, setPageError] = useState('')
  const [formError, setFormError] = useState('')
  const [editingMarketId, setEditingMarketId] = useState(null)
  const [form, setForm] = useState(null)
  const [resultMarket, setResultMarket] = useState(null)
  const [resultText, setResultText] = useState('')
  const [isDeclaring, setIsDeclaring] = useState(false)
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState('')
  const [existingImageUrl, setExistingImageUrl] = useState('')

  const loadMarkets = useCallback(async () => {
    setIsLoading(true)
    setPageError('')
    try {
      const result = await getMarkets()
      if (!Array.isArray(result)) throw new Error('The markets API returned an invalid market list.')
      setMarkets(result)
    } catch (error) {
      setPageError(error.message || 'Unable to load markets.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    const timeoutId = window.setTimeout(loadMarkets, 0)
    return () => window.clearTimeout(timeoutId)
  }, [loadMarkets])

  const openEditor = (market = null) => {
    setEditingMarketId(market?.id ?? null)
    setForm(market ? toFormValues(market) : { ...emptyMarket })
    setImageFile(null)
    setImagePreview('')
    setExistingImageUrl(market?.imageUrl || '')
    setFormError('')
  }

  const closeEditor = () => {
    if (isSaving) return
    setForm(null)
    setEditingMarketId(null)
    setImageFile(null)
    setImagePreview('')
    setExistingImageUrl('')
    setFormError('')
  }

  const selectImage = (event) => {
    const file = event.target.files?.[0] ?? null
    setFormError('')
    setImageFile(null)
    setImagePreview('')
    if (!file) return

    if (file.size > MAX_IMAGE_BYTES) {
      setFormError('Market image must be 1MB or smaller.')
      event.target.value = ''
      return
    }

    const objectUrl = URL.createObjectURL(file)
    const image = new Image()
    image.onload = () => {
      URL.revokeObjectURL(objectUrl)
      if (image.naturalWidth !== IMAGE_PX || image.naturalHeight !== IMAGE_PX) {
        setFormError('Market image must be exactly 25 by 25 pixels.')
        event.target.value = ''
        return
      }
      setImageFile(file)
      setImagePreview(URL.createObjectURL(file))
    }
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      setFormError('Could not read that image. Use a PNG or JPG.')
      event.target.value = ''
    }
    image.src = objectUrl
  }

  const updateField = (event) => {
    const { name, value } = event.target
    setForm((currentForm) => ({ ...currentForm, [name]: value }))
    setFormError('')
  }

  const saveMarket = async (event) => {
    event.preventDefault()
    if (!form) return

    const payload = toPayload(form)
    if (!payload.name || !payload.symbol || !payload.openTime || !payload.closeTime) {
      setFormError('Complete all fields before saving.')
      return
    }
    if (payload.openTime === payload.closeTime) {
      setFormError('Close time must differ from open time. An earlier close time is the next day.')
      return
    }
    if (!Number.isInteger(payload.maxParticipants) || payload.maxParticipants < 1) {
      setFormError('Maximum bets must be a whole number greater than zero.')
      return
    }
    if (!Number.isFinite(payload.minBetAmount) || payload.minBetAmount <= 0) {
      setFormError('Minimum bet amount must be greater than zero.')
      return
    }
    if (!Number.isFinite(payload.maxBetAmount) || payload.maxBetAmount < payload.minBetAmount) {
      setFormError('Maximum bet amount must be greater than or equal to the minimum.')
      return
    }

    setIsSaving(true)
    setFormError('')
    try {
      const saved = editingMarketId
        ? await updateMarket(editingMarketId, payload)
        : await createMarket(payload)
      if (imageFile) {
        await uploadMarketImage(saved.id, imageFile)
      }
      setForm(null)
      setEditingMarketId(null)
      await loadMarkets()
    } catch (error) {
      setFormError(error.message || 'Unable to save market.')
    } finally {
      setIsSaving(false)
    }
  }

  const openResult = (market) => {
    setResultMarket(market)
    setResultText('')
    setPageError('')
  }

  const declareResult = async (event) => {
    event.preventDefault()
    if (!resultMarket) return

    const result = resultText.trim()
    if (!result) {
      setPageError('Enter the result before confirming.')
      return
    }

    setIsDeclaring(true)
    setPageError('')
    try {
      await declareMarketResult(resultMarket.id, result)
      setResultMarket(null)
      setResultText('')
      await loadMarkets()
    } catch (error) {
      setPageError(error.message || 'Unable to declare the result.')
    } finally {
      setIsDeclaring(false)
    }
  }

  const removeMarket = async (market) => {
    if (!window.confirm(`Delete ${market.name} (${market.symbol})?`)) return

    setPageError('')
    try {
      await deleteMarket(market.id)
      await loadMarkets()
    } catch (error) {
      setPageError(error.message || 'Unable to delete market.')
    }
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Markets</h1>
          <p className="mt-1 text-sm text-gray-500">
            Create and manage up to five markets. Symbols must be unique.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge color="info" className="w-fit">
            {markets.length} of 5 markets
          </Badge>
          <Button color="light" size="sm" onClick={loadMarkets} disabled={isLoading}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button
            color="blue"
            size="sm"
            onClick={() => openEditor()}
            disabled={markets.length >= 5 || isLoading}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add market
          </Button>
        </div>
      </div>

      {pageError ? (
        <Alert color="failure" onDismiss={() => setPageError('')}>
          {pageError}
        </Alert>
      ) : null}

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Spinner size="xl" />
        </div>
      ) : markets.length > 0 ? (
        <div className="grid gap-4 xl:grid-cols-2">
          {markets.map((market) => (
            <Card key={market.id} className="border border-gray-100 shadow-sm">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    {market.imageUrl ? (
                      <img
                        src={market.imageUrl}
                        alt=""
                        width={25}
                        height={25}
                        className="h-[25px] w-[25px] rounded object-contain"
                      />
                    ) : null}
                    <h2 className="text-lg font-semibold text-gray-900">{market.name}</h2>
                    <Badge color="purple">{market.symbol}</Badge>
                  </div>
                  <div className="mt-4 grid gap-3 text-sm text-gray-600 sm:grid-cols-2">
                    <p className="flex items-center gap-2">
                      <Clock3 className="h-4 w-4 text-gray-400" />
                      {market.openTime} – {market.closeTime}
                    </p>
                    <p className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-gray-400" />
                      Up to {market.maxParticipants} bets
                    </p>
                    <p>
                      Bet range:{' '}
                      <span className="font-medium text-gray-900">
                        ₹{market.minBetAmount} – ₹{market.maxBetAmount}
                      </span>
                    </p>
                    <p>
                      Bets placed:{' '}
                      <span className="font-medium text-gray-900">
                        {market.participants} / {market.maxParticipants}
                      </span>
                    </p>
                    <p>
                      Total bet:{' '}
                      <span className="font-medium text-gray-900">₹{market.totalBetAmount}</span>
                    </p>
                    <p>
                      Last result:{' '}
                      <span className="font-medium text-gray-900">
                        {market.lastResult || 'Not declared'}
                      </span>
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 gap-2">
                  {/* <Button color="blue" size="sm" onClick={() => openResult(market)}>
                    Declare result
                  </Button> */}
                  <Button color="light" size="sm" onClick={() => openEditor(market)}>
                    <Pencil className="mr-2 h-4 w-4" />
                    Edit
                  </Button>
                  <Button
                    color="failure"
                    size="sm"
                    onClick={() => removeMarket(market)}
                    aria-label={`Delete ${market.name}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="border border-gray-100 text-center shadow-sm">
          <p className="text-sm text-gray-600">No markets yet. Add the first market to get started.</p>
        </Card>
      )}

      {resultMarket ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 p-4">
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="declare-result-title"
            className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl"
          >
            <h2 id="declare-result-title" className="text-xl font-semibold text-gray-900">
              Declare result for {resultMarket.name}
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              This settles round {resultMarket.currentRound} and starts a new round with no bets.
            </p>
            <form className="mt-5 space-y-4" onSubmit={declareResult}>
              <div>
                <Label htmlFor="market-result">Result</Label>
                <TextInput
                  id="market-result"
                  value={resultText}
                  onChange={(event) => setResultText(event.target.value)}
                  maxLength={120}
                  required
                />
              </div>
              <div className="flex justify-end gap-3">
                <Button
                  type="button"
                  color="light"
                  onClick={() => setResultMarket(null)}
                  disabled={isDeclaring}
                >
                  Cancel
                </Button>
                <Button type="submit" color="blue" disabled={isDeclaring}>
                  {isDeclaring ? 'Declaring...' : 'Confirm result'}
                </Button>
              </div>
            </form>
          </section>
        </div>
      ) : null}

      {form ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-gray-900/50 p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeEditor()
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="market-editor-title"
            className="w-full max-w-xl rounded-xl bg-white p-6 shadow-xl"
          >
            <div className="mb-6">
              <h2 id="market-editor-title" className="text-xl font-semibold text-gray-900">
                {editingMarketId ? `Edit ${form.name}` : 'Add market'}
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Enter market details. Close time may be after midnight, such as 7:00 PM to 1:30 AM.
              </p>
            </div>

            {formError ? (
              <Alert color="failure" className="mb-5">
                {formError}
              </Alert>
            ) : null}

            <form className="space-y-4" onSubmit={saveMarket}>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="market-name">Market name</Label>
                  <TextInput
                    className={fieldClassName}
                    id="market-name"
                    name="name"
                    value={form.name}
                    onChange={updateField}
                    maxLength={80}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="market-symbol">Symbol (unique)</Label>
                  <TextInput
                    className={fieldClassName}
                    id="market-symbol"
                    name="symbol"
                    value={form.symbol}
                    onChange={updateField}
                    maxLength={20}
                    autoCapitalize="characters"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="market-open-time">Open time</Label>
                  <TextInput
                    className={fieldClassName}
                    id="market-open-time"
                    name="openTime"
                    type="time"
                    value={form.openTime}
                    onChange={updateField}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="market-close-time">Close time</Label>
                  <TextInput
                    className={fieldClassName}
                    id="market-close-time"
                    name="closeTime"
                    type="time"
                    value={form.closeTime}
                    onChange={updateField}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="market-max-participants">Maximum bets per round</Label>
                  <TextInput
                    className={fieldClassName}
                    id="market-max-participants"
                    name="maxParticipants"
                    type="number"
                    min="1"
                    step="1"
                    value={form.maxParticipants}
                    onChange={updateField}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="market-min-bet-amount">Minimum bet amount (₹)</Label>
                  <TextInput
                    className={fieldClassName}
                    id="market-min-bet-amount"
                    name="minBetAmount"
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={form.minBetAmount}
                    onChange={updateField}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="market-max-bet-amount">Maximum bet amount (₹)</Label>
                  <TextInput
                    className={fieldClassName}
                    id="market-max-bet-amount"
                    name="maxBetAmount"
                    type="number"
                    min={form.minBetAmount || '0.01'}
                    step="0.01"
                    value={form.maxBetAmount}
                    onChange={updateField}
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="market-image">Market image</Label>
                <input
                  id="market-image"
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="mt-2 block w-full text-sm text-gray-600"
                  onChange={selectImage}
                />
                <p className="mt-2 text-xs text-gray-500">
                  Exactly 25×25 pixels, PNG or JPG, up to 1MB. Leave empty to keep the current image.
                </p>
                {imagePreview || existingImageUrl ? (
                  <img
                    src={imagePreview || existingImageUrl}
                    alt="Market image preview"
                    width={25}
                    height={25}
                    className="mt-3 h-[25px] w-[25px] rounded border border-gray-200 object-contain"
                  />
                ) : null}
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Button type="button" color="light" onClick={closeEditor} disabled={isSaving}>
                  Cancel
                </Button>
                <Button type="submit" color="blue" disabled={isSaving}>
                  {isSaving ? 'Saving...' : 'Save market'}
                </Button>
              </div>
            </form>
          </section>
        </div>
      ) : null}
    </div>
  )
}
