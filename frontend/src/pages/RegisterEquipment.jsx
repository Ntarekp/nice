import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { api } from '../lib/api'
import toast from 'react-hot-toast'
import MaterialIcon from '../components/MaterialIcon'
import { EXTINGUISHER_PREVIEW_IMAGE } from '../lib/designAssets'

const STEPS = ['Identification', 'Location', 'Technical', 'Inspection', 'Review']

const EQUIPMENT_CATEGORIES = [
  { value: 'extinguisher', label: 'Fire Extinguisher' },
  { value: 'hose', label: 'Fire Hose Reel' },
  { value: 'blanket', label: 'Fire Blanket' },
  { value: 'alarm', label: 'Smoke Alarm' },
]

const AGENT_TYPES = [
  { value: 'co2', label: 'CO₂' },
  { value: 'water', label: 'Water' },
  { value: 'foam', label: 'Foam' },
  { value: 'dry_chemical', label: 'Dry Chemical' },
  { value: 'wet_chemical', label: 'Wet Chemical' },
  { value: 'halon', label: 'Halon' },
]

const SIZES = ['2.5lbs', '5lbs', '9lbs', '12lbs', '20lbs']

const emptyForm = () => ({
  category: '',
  type: '',
  serialNumber: '',
  manufacturer: '',
  mfgYear: '',
  location: '',
  building: '',
  floor: '',
  room: '',
  size: '5lbs',
  installationDate: '',
  expiryDate: '',
  pressure: '',
  notes: '',
})

export default function RegisterEquipmentPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [form, setForm] = useState(emptyForm)

  const assetId = useMemo(() => {
    if (form.serialNumber) {
      return `TWZ-${form.serialNumber.replace(/\W/g, '').slice(0, 8).toUpperCase()}`
    }
    return `AUTOGEN-${String(Date.now()).slice(-4)}`
  }, [form.serialNumber])

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }))

  const typeLabel = AGENT_TYPES.find((t) => t.value === form.type)?.label || '--'
  const progressWidth = `${12 + (step / (STEPS.length - 1)) * 88}%`

  const createMutation = useMutation({
    mutationFn: (body) => api.post('/api/extinguishers', body),
    onSuccess: () => {
      toast.success('Equipment registered successfully')
      navigate('/extinguishers')
    },
    onError: (e) => toast.error(e.response?.data?.error || 'Registration failed'),
  })

  const validateStep = () => {
    if (step === 0) {
      if (form.category !== 'extinguisher') {
        toast.error('Only fire extinguishers can be registered at this time')
        return false
      }
      if (!form.type || !form.serialNumber) {
        toast.error('Agent type and serial number are required')
        return false
      }
    }
    if (step === 1 && !form.location) {
      toast.error('Location is required')
      return false
    }
    if (step === 2) {
      if (!form.installationDate || !form.expiryDate) {
        toast.error('Installation and expiry dates are required')
        return false
      }
    }
    return true
  }

  const next = () => {
    if (!validateStep()) return
    setStep((s) => Math.min(s + 1, STEPS.length - 1))
  }

  const back = () => setStep((s) => Math.max(s - 1, 0))

  const submit = () => {
    createMutation.mutate({
      serialNumber: form.serialNumber.trim(),
      location: form.location.trim(),
      building: form.building || undefined,
      floor: form.floor || undefined,
      room: form.room || undefined,
      type: form.type,
      size: form.size,
      manufacturer: form.manufacturer || undefined,
      model: form.mfgYear ? `Mfg ${form.mfgYear}` : undefined,
      installationDate: form.installationDate,
      expiryDate: form.expiryDate,
      pressure: form.pressure || undefined,
      notes: form.notes || undefined,
    })
  }

  return (
    <div>
      <div className="mb-8">
        <div className="mb-2 flex items-center gap-1 text-label-small text-text-secondary">
          <span>Registrations</span>
          <MaterialIcon name="chevron_right" size={14} />
          <span className="font-bold text-primary">New Equipment</span>
        </div>
        <h2 className="text-headline-lg text-text-primary">Register Equipment</h2>
      </div>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-12">
        <div className="flex flex-col gap-6 md:col-span-8">
          <div className="rounded-xl border border-border-ice bg-surface-white p-4 shadow-sm">
            <div className="relative flex items-center justify-between px-2">
              <div className="absolute left-0 top-1/2 -z-10 h-[2px] w-full -translate-y-1/2 bg-surface-container-high" />
              <div
                className="absolute left-0 top-1/2 -z-10 h-[2px] -translate-y-1/2 bg-primary transition-all duration-500"
                style={{ width: progressWidth }}
              />
              {STEPS.map((label, i) => (
                <div
                  key={label}
                  className={`z-10 flex flex-col items-center gap-1 bg-surface-white px-1 ${
                    i > step ? 'opacity-50' : ''
                  }`}
                >
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-full shadow-sm ${
                      i === step
                        ? 'bg-primary text-on-primary'
                        : i < step
                          ? 'bg-primary text-on-primary'
                          : 'border border-border-ice bg-surface-container-high text-text-secondary'
                    }`}
                  >
                    <span className="text-label-small">{i + 1}</span>
                  </div>
                  <span
                    className={`text-label-caps ${
                      i <= step ? 'text-primary' : 'text-text-secondary'
                    }`}
                  >
                    {label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col overflow-hidden rounded-xl border border-border-ice bg-surface-white shadow-sm">
            <div className="border-b border-border-ice bg-surface-bright px-6 py-3">
              <h3 className="text-headline-sm text-text-primary">
                {step === 0 && 'Step 1: Core Identification'}
                {step === 1 && 'Step 2: Location'}
                {step === 2 && 'Step 3: Technical Specifications'}
                {step === 3 && 'Step 4: Inspection Planning'}
                {step === 4 && 'Step 5: Review & Submit'}
              </h3>
              <p className="mt-1 text-sm text-text-secondary">
                {step === 0 && 'Provide the basic identifier details for the new asset.'}
                {step === 1 && 'Where is this extinguisher installed at your facility?'}
                {step === 2 && 'Capacity, dates, and pressure readings.'}
                {step === 3 && 'Optional notes. Request an inspection after registration from the Inspections page.'}
                {step === 4 && 'Confirm details before registering this asset under your facility.'}
              </p>
            </div>

            <div className="flex-1 p-6">
              {step === 0 && (
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div className="col-span-2">
                    <label className="mb-2 block text-label-small text-text-primary">
                      Equipment Type
                    </label>
                    <div className="relative">
                      <select
                        className="form-field-input w-full appearance-none py-3"
                        value={form.category}
                        onChange={(e) => {
                          set('category', e.target.value)
                          if (e.target.value !== 'extinguisher') set('type', '')
                        }}
                      >
                        <option disabled value="">
                          Select an equipment type...
                        </option>
                        {EQUIPMENT_CATEGORIES.map((c) => (
                          <option key={c.value} value={c.value}>
                            {c.label}
                          </option>
                        ))}
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-text-secondary">
                        <MaterialIcon name="expand_more" size={22} />
                      </div>
                    </div>
                  </div>

                  {form.category === 'extinguisher' && (
                    <div className="col-span-2">
                      <label className="mb-2 block text-label-small text-text-primary">
                        Agent Type *
                      </label>
                      <div className="relative">
                        <select
                          className="form-field-input w-full appearance-none py-3"
                          value={form.type}
                          onChange={(e) => set('type', e.target.value)}
                        >
                          <option disabled value="">
                            Select agent type...
                          </option>
                          {AGENT_TYPES.map((t) => (
                            <option key={t.value} value={t.value}>
                              {t.label}
                            </option>
                          ))}
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-text-secondary">
                          <MaterialIcon name="expand_more" size={22} />
                        </div>
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="mb-2 block text-label-small text-text-primary">
                      Serial Number / Barcode *
                    </label>
                    <div className="relative">
                      <input
                        className="form-field-input py-3 pl-10"
                        placeholder="e.g. SN-9823749"
                        type="text"
                        value={form.serialNumber}
                        onChange={(e) => set('serialNumber', e.target.value)}
                      />
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-text-secondary">
                        <MaterialIcon name="barcode_scanner" size={18} />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-label-small text-text-primary">
                      Asset ID (Internal)
                    </label>
                    <input className="form-field-input-readonly" readOnly type="text" value={assetId} />
                  </div>

                  <div>
                    <label className="mb-2 block text-label-small text-text-primary">
                      Manufacturer
                    </label>
                    <input
                      className="form-field-input py-3"
                      placeholder="e.g. Amerex, Kidde"
                      type="text"
                      value={form.manufacturer}
                      onChange={(e) => set('manufacturer', e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-label-small text-text-primary">
                      Year of Manufacture
                    </label>
                    <input
                      className="form-field-input py-3"
                      max={new Date().getFullYear()}
                      min={1990}
                      placeholder="YYYY"
                      type="number"
                      value={form.mfgYear}
                      onChange={(e) => set('mfgYear', e.target.value)}
                    />
                  </div>
                </div>
              )}

              {step === 1 && (
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div className="col-span-2">
                    <label className="mb-2 block text-label-small text-text-primary">
                      Primary Location *
                    </label>
                    <input
                      className="form-field-input py-3"
                      placeholder="e.g. Main lobby, Floor 2 east wing"
                      value={form.location}
                      onChange={(e) => set('location', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-label-small text-text-primary">Building</label>
                    <input className="form-field-input py-3" value={form.building} onChange={(e) => set('building', e.target.value)} />
                  </div>
                  <div>
                    <label className="mb-2 block text-label-small text-text-primary">Floor</label>
                    <input className="form-field-input py-3" value={form.floor} onChange={(e) => set('floor', e.target.value)} />
                  </div>
                  <div className="col-span-2">
                    <label className="mb-2 block text-label-small text-text-primary">Room / Zone</label>
                    <input className="form-field-input py-3" value={form.room} onChange={(e) => set('room', e.target.value)} />
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-label-small text-text-primary">Size *</label>
                    <select className="form-field-input py-3" value={form.size} onChange={(e) => set('size', e.target.value)}>
                      {SIZES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-2 block text-label-small text-text-primary">Pressure Reading</label>
                    <input
                      className="form-field-input py-3"
                      placeholder="e.g. 195 PSI"
                      value={form.pressure}
                      onChange={(e) => set('pressure', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-label-small text-text-primary">Installation Date *</label>
                    <input
                      className="form-field-input py-3"
                      type="date"
                      value={form.installationDate}
                      onChange={(e) => set('installationDate', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-label-small text-text-primary">Expiry Date *</label>
                    <input
                      className="form-field-input py-3"
                      type="date"
                      value={form.expiryDate}
                      onChange={(e) => set('expiryDate', e.target.value)}
                    />
                  </div>
                </div>
              )}

              {step === 3 && (
                <div>
                  <label className="mb-2 block text-label-small text-text-primary">Notes</label>
                  <textarea
                    className="form-field-input min-h-[120px] py-3"
                    rows={4}
                    placeholder="Access instructions, mounting type, etc."
                    value={form.notes}
                    onChange={(e) => set('notes', e.target.value)}
                  />
                </div>
              )}

              {step === 4 && (
                <dl className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <dt className="text-label-small text-text-secondary">Asset ID</dt>
                    <dd className="text-sm font-semibold text-primary">{assetId}</dd>
                  </div>
                  <div>
                    <dt className="text-label-small text-text-secondary">Serial</dt>
                    <dd className="text-text-primary">{form.serialNumber}</dd>
                  </div>
                  <div>
                    <dt className="text-label-small text-text-secondary">Type</dt>
                    <dd className="text-text-primary">{typeLabel}</dd>
                  </div>
                  <div>
                    <dt className="text-label-small text-text-secondary">Location</dt>
                    <dd className="text-text-primary">{form.location || '—'}</dd>
                  </div>
                  <div>
                    <dt className="text-label-small text-text-secondary">Size</dt>
                    <dd className="text-text-primary">{form.size}</dd>
                  </div>
                  <div>
                    <dt className="text-label-small text-text-secondary">Expiry</dt>
                    <dd className="text-text-primary">{form.expiryDate || '—'}</dd>
                  </div>
                </dl>
              )}
            </div>

            <div className="mt-auto flex items-center justify-between border-t border-border-ice bg-surface-bright px-6 py-3">
              <button
                type="button"
                className="px-4 py-2 text-sm font-semibold text-text-secondary transition-colors hover:text-primary"
                onClick={() => navigate('/extinguishers')}
              >
                Cancel
              </button>
              <div className="flex items-center gap-2">
                {step > 0 && (
                  <button
                    type="button"
                    className="px-4 py-2 text-sm font-semibold text-text-secondary transition-colors hover:text-primary"
                    onClick={back}
                  >
                    Back
                  </button>
                )}
                {step < STEPS.length - 1 ? (
                  <button
                    type="button"
                    className="flex items-center gap-2 rounded-xl bg-primary px-6 py-2 text-sm font-semibold text-on-primary shadow-sm transition-colors hover:bg-primary/90"
                    onClick={next}
                  >
                    Next: {STEPS[step + 1]}
                    <MaterialIcon name="arrow_forward" size={18} />
                  </button>
                ) : (
                  <button
                    type="button"
                    className="flex items-center gap-2 rounded-xl bg-primary px-6 py-2 text-sm font-semibold text-on-primary shadow-sm transition-colors hover:bg-primary/90 disabled:opacity-60"
                    onClick={submit}
                    disabled={createMutation.isPending}
                  >
                    {createMutation.isPending ? 'Submitting…' : 'Register Equipment'}
                    <MaterialIcon name="arrow_forward" size={18} />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="md:col-span-4">
          <div className="sticky top-24 overflow-hidden rounded-xl border border-border-ice bg-surface-white shadow-[0_8px_16px_-4px_rgba(11,31,51,0.05)]">
            <div className="h-1 w-full bg-secondary" />
            <div className="p-6">
              <h4 className="mb-4 text-label-caps text-text-secondary">Live Preview</h4>
              <div className="relative mb-6 flex h-48 w-full items-center justify-center overflow-hidden rounded-lg border border-border-ice bg-surface-container-low">
                <img
                  src={EXTINGUISHER_PREVIEW_IMAGE}
                  alt="Fire extinguisher preview"
                  className="h-full w-full object-cover opacity-80 mix-blend-multiply"
                />
                <div className="absolute right-2 top-2 rounded-full border border-border-ice bg-surface-white/80 p-1 shadow-sm backdrop-blur-sm">
                  <MaterialIcon name="visibility" size={16} className="text-primary" />
                </div>
              </div>
              <div className="flex flex-col gap-4">
                <div>
                  <p className="mb-1 text-label-small text-text-secondary">Asset ID</p>
                  <p className="text-sm font-semibold text-primary">{assetId}</p>
                </div>
                <div className="h-[1px] w-full bg-border-ice" />
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <p className="mb-1 text-label-small text-text-secondary">Type</p>
                    <p className="flex items-center gap-1 text-sm text-text-primary">
                      <MaterialIcon name="fire_extinguisher" size={16} className="text-text-secondary" />
                      {form.type ? typeLabel : '--'}
                    </p>
                  </div>
                  <div>
                    <p className="mb-1 text-label-small text-text-secondary">Serial No.</p>
                    <p className="text-sm text-text-primary">{form.serialNumber || '--'}</p>
                  </div>
                  <div>
                    <p className="mb-1 text-label-small text-text-secondary">Manufacturer</p>
                    <p className="text-sm text-text-primary">{form.manufacturer || '--'}</p>
                  </div>
                  <div>
                    <p className="mb-1 text-label-small text-text-secondary">Mfg Year</p>
                    <p className="text-sm text-text-primary">{form.mfgYear || '--'}</p>
                  </div>
                </div>
                <div className="mt-2 flex items-start gap-2 rounded-lg border border-border-ice bg-surface-bright p-2">
                  <MaterialIcon name="info" size={18} className="text-secondary" />
                  <p className="text-[12px] leading-relaxed text-text-secondary">
                    This card updates in real-time as you complete the registration steps. It will act as the
                    final asset summary upon submission.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
