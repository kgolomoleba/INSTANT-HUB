import React, { useEffect, useId, useState } from 'react'
import { supabase } from '../supabaseClient'
import { useAuth } from '../context/AuthContext'
import { PRODUCT_CATEGORIES, SERVICE_CATEGORIES } from '../utils/categories'
import { errorMessage } from '../utils/errors'
import './CreateListingModal.css'

interface CreateListingModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  type: 'product' | 'service'
}

const MAX_IMAGE_MB = 5
const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

export const CreateListingModal: React.FC<CreateListingModalProps> = ({ isOpen, onClose, onSuccess, type }) => {
  const { user } = useAuth()
  const id = useId()
  const categories = type === 'product' ? PRODUCT_CATEGORIES : SERVICE_CATEGORIES
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('')
  const [category, setCategory] = useState('')
  const [location, setLocation] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Close on Escape.
  useEffect(() => {
    if (!isOpen) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && !isSubmitting && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isOpen, isSubmitting, onClose])

  if (!isOpen) return null

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null
    setError(null)
    if (file && !IMAGE_TYPES.includes(file.type)) {
      setError('Please choose a JPG, PNG, WebP or GIF image.')
      e.target.value = ''
      return setImageFile(null)
    }
    if (file && file.size > MAX_IMAGE_MB * 1024 * 1024) {
      setError(`That image is too large. Please use one under ${MAX_IMAGE_MB} MB.`)
      e.target.value = ''
      return setImageFile(null)
    }
    setImageFile(file)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!user) return setError('You must be logged in to post a listing.')

    setIsSubmitting(true)
    try {
      let imageUrl = ''
      if (imageFile) {
        const ext = (imageFile.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '')
        const filePath = `${user.id}/${crypto.randomUUID()}.${ext}`
        const { error: uploadError } = await supabase.storage.from('listings').upload(filePath, imageFile, { contentType: imageFile.type })
        if (uploadError) throw new Error(`Image upload failed: ${uploadError.message}`)
        imageUrl = supabase.storage.from('listings').getPublicUrl(filePath).data.publicUrl
      }

      const table = type === 'product' ? 'products' : 'services'
      const row: Record<string, unknown> = {
        title: title.trim(),
        description: description.trim(),
        price: Math.round(parseFloat(price) * 100) / 100,
        category,
        user_id: user.id,
        image_url: imageUrl,
      }
      if (location.trim()) row.location = location.trim()

      let { error: insertError } = await supabase.from(table).insert([row])
      // Older databases without a location column: save the listing without it.
      if (insertError && /location/i.test(insertError.message)) {
        delete row.location
        ;({ error: insertError } = await supabase.from(table).insert([row]))
      }
      if (insertError) throw insertError

      setTitle('')
      setDescription('')
      setPrice('')
      setCategory('')
      setLocation('')
      setImageFile(null)
      onSuccess()
      onClose()
    } catch (err) {
      setError(errorMessage(err, 'Could not publish your listing. Please try again.'))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={() => !isSubmitting && onClose()}>
      <div className="modal-content" role="dialog" aria-modal="true" aria-labelledby={`${id}-title`} onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="Close" disabled={isSubmitting}>
          &times;
        </button>
        <h2 id={`${id}-title`}>Create a new {type}</h2>

        {error && (
          <div className="modal-error" role="alert">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label htmlFor={`${id}-t`}>Title</label>
            <input
              id={`${id}-t`}
              type="text"
              required
              maxLength={120}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={type === 'product' ? 'E.g., Handmade soap, 3-pack' : 'E.g., Website design for small shops'}
            />
          </div>

          <div className="form-group">
            <label htmlFor={`${id}-c`}>Category</label>
            <select id={`${id}-c`} required value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="" disabled>
                Choose a category
              </option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor={`${id}-p`}>Price (R)</label>
            <input id={`${id}-p`} type="number" required min="0" step="0.01" inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="0.00" />
          </div>

          <div className="form-group">
            <label htmlFor={`${id}-l`}>Location (town or area)</label>
            <input id={`${id}-l`} type="text" maxLength={80} value={location} onChange={(e) => setLocation(e.target.value)} placeholder="E.g., Paarl" />
          </div>

          <div className="form-group form-group-full">
            <label htmlFor={`${id}-i`}>Photo (optional, up to {MAX_IMAGE_MB} MB)</label>
            <input id={`${id}-i`} type="file" accept={IMAGE_TYPES.join(',')} onChange={handleFileChange} />
          </div>

          <div className="form-group form-group-full">
            <label htmlFor={`${id}-d`}>Description</label>
            <textarea
              id={`${id}-d`}
              required
              rows={4}
              maxLength={2000}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={`Describe your ${type}...`}
            />
          </div>

          <button type="submit" disabled={isSubmitting} className="submit-btn">
            {isSubmitting ? 'Publishing...' : 'Publish Listing'}
          </button>
        </form>
      </div>
    </div>
  )
}
