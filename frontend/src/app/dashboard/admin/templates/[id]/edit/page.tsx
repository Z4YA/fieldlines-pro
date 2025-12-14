'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { api } from '@/lib/api'

const SPORTS = [
  { value: 'soccer', label: 'Soccer/Football' },
  { value: 'rugby', label: 'Rugby' },
  { value: 'afl', label: 'AFL' },
  { value: 'cricket', label: 'Cricket' },
  { value: 'hockey', label: 'Hockey' },
  { value: 'tennis', label: 'Tennis' },
  { value: 'basketball', label: 'Basketball' },
  { value: 'netball', label: 'Netball' },
  { value: 'other', label: 'Other' },
]

interface Template {
  id: string
  name: string
  sport: string
  description: string | null
  minLength: number
  maxLength: number
  minWidth: number
  maxWidth: number
  defaultLength: number
  defaultWidth: number
  interiorElements: unknown
  isActive: boolean
}

export default function EditTemplatePage() {
  const router = useRouter()
  const params = useParams()
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    name: '',
    sport: 'soccer',
    description: '',
    minLength: 90,
    maxLength: 120,
    minWidth: 45,
    maxWidth: 90,
    defaultLength: 100,
    defaultWidth: 64,
    isActive: true,
  })

  const [interiorElements, setInteriorElements] = useState('[]')

  useEffect(() => {
    const fetchTemplate = async () => {
      const response = await api.getAdminTemplates()
      if (response.data) {
        const template = response.data.find((t) => t.id === params.id)
        if (template) {
          setForm({
            name: template.name,
            sport: template.sport,
            description: template.description || '',
            minLength: template.minLength,
            maxLength: template.maxLength,
            minWidth: template.minWidth,
            maxWidth: template.maxWidth,
            defaultLength: template.defaultLength,
            defaultWidth: template.defaultWidth,
            isActive: template.isActive,
          })
          setInteriorElements(JSON.stringify(template.interiorElements, null, 2))
        } else {
          setError('Template not found')
        }
      } else {
        setError(response.error || 'Failed to load template')
      }
      setIsLoading(false)
    }
    fetchTemplate()
  }, [params.id])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked :
              type === 'number' ? parseFloat(value) || 0 : value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsSubmitting(true)

    // Validate interior elements JSON
    let parsedElements
    try {
      parsedElements = JSON.parse(interiorElements)
    } catch {
      setError('Invalid JSON format for interior elements')
      setIsSubmitting(false)
      return
    }

    // Validate dimensions
    if (form.defaultLength < form.minLength || form.defaultLength > form.maxLength) {
      setError('Default length must be between min and max length')
      setIsSubmitting(false)
      return
    }
    if (form.defaultWidth < form.minWidth || form.defaultWidth > form.maxWidth) {
      setError('Default width must be between min and max width')
      setIsSubmitting(false)
      return
    }

    const response = await api.updateTemplate(params.id as string, {
      ...form,
      interiorElements: parsedElements,
    })

    if (response.error) {
      setError(response.error)
      setIsSubmitting(false)
      return
    }

    router.push('/dashboard/admin/templates')
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
      </div>
    )
  }

  if (error && !form.name) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
        {error}
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/dashboard/admin/templates"
          className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4"
        >
          <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Templates
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Edit Template</h1>
        <p className="text-gray-600">Update template configuration</p>
      </div>

      <form onSubmit={handleSubmit} className="max-w-4xl">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 mb-6">
            {error}
          </div>
        )}

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Template Name *
              </label>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none"
                placeholder="e.g., FIFA Standard Soccer Field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sport *
              </label>
              <select
                name="sport"
                value={form.sport}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none"
              >
                {SPORTS.map((sport) => (
                  <option key={sport.value} value={sport.value}>
                    {sport.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                rows={3}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none"
                placeholder="Describe the template and its intended use..."
              />
            </div>
            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="isActive"
                  checked={form.isActive}
                  onChange={handleChange}
                  className="w-4 h-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">Active (visible to users)</span>
              </label>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Field Dimensions (meters)</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Min Length
              </label>
              <input
                type="number"
                name="minLength"
                value={form.minLength}
                onChange={handleChange}
                required
                min="1"
                step="0.1"
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Max Length
              </label>
              <input
                type="number"
                name="maxLength"
                value={form.maxLength}
                onChange={handleChange}
                required
                min="1"
                step="0.1"
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Default Length
              </label>
              <input
                type="number"
                name="defaultLength"
                value={form.defaultLength}
                onChange={handleChange}
                required
                min="1"
                step="0.1"
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Min Width
              </label>
              <input
                type="number"
                name="minWidth"
                value={form.minWidth}
                onChange={handleChange}
                required
                min="1"
                step="0.1"
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Max Width
              </label>
              <input
                type="number"
                name="maxWidth"
                value={form.maxWidth}
                onChange={handleChange}
                required
                min="1"
                step="0.1"
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Default Width
              </label>
              <input
                type="number"
                name="defaultWidth"
                value={form.defaultWidth}
                onChange={handleChange}
                required
                min="1"
                step="0.1"
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Interior Elements (Advanced)</h2>
          <p className="text-sm text-gray-500 mb-4">
            Define the field markers and lines as JSON. This is an advanced feature for defining the interior
            structure of the field template.
          </p>
          <textarea
            value={interiorElements}
            onChange={(e) => setInteriorElements(e.target.value)}
            rows={10}
            className="w-full px-4 py-2 font-mono text-sm border rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none"
            placeholder="[]"
          />
        </div>

        <div className="flex items-center gap-4">
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 transition-colors"
          >
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </button>
          <Link
            href="/dashboard/admin/templates"
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  )
}
