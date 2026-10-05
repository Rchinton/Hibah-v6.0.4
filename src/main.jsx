import { StrictMode, useEffect, useMemo, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { createPortal } from 'react-dom'
import agencyLogo from '../assets/logo-peternakan.png'
import {
  Activity,
  ArrowDownToLine,
  ArrowUpDown,
  Banknote,
  Bell,
  BookOpen,
  Check,
  ChevronDown,
  ChevronUp,
  ClipboardCheck,
  Copy,
  Coins,
  Database,
  Eye,
  EyeOff,
  ExternalLink,
  FileCog,
  Filter,
  Gauge,
  Grid2X2,
  LogIn,
  LogOut,
  Megaphone,
  Menu,
  MoreHorizontal,
  Palette,
  PanelLeftClose,
  PanelLeftOpen,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  SlidersHorizontal,
  Trash2,
  UserRound,
  UsersRound,
  Upload,
  X,
  ZoomIn,
  ZoomOut,
} from 'lucide-react'
import './styles.css'

const initialFields = [
  { id: 'f1', label: 'Nama kelompok penerima', key: 'nama_kelompok', type: 'text', required: true, active: true, options: '' },
  { id: 'f2', label: 'Komoditas ternak', key: 'komoditas_ternak', type: 'checklist', required: true, active: true, options: 'Sapi;Kambing;Domba;Ayam' },
  { id: 'f3', label: 'Wilayah', key: 'wilayah', type: 'list', required: true, active: true, options: 'Kab. Bandung;Kab. Garut;Kab. Sumedang;Kab. Tasikmalaya' },
  { id: 'f4', label: 'Tanggal pengajuan', key: 'tanggal_pengajuan', type: 'date', required: true, active: true, options: '' },
  { id: 'f5', label: 'Nilai bantuan (Rp)', key: 'nilai_bantuan', type: 'number', required: true, active: true, options: '' },
  { id: 'f6', label: 'Catatan verifikasi', key: 'catatan_verifikasi', type: 'paragraph', required: false, active: true, options: '' },
]

const initialRecords = [
  { id: 1, noId: 'ID-0000000001', status: 'Disetujui', createdAt: '12 Sep 2026', values: { nama_kelompok: 'Koperasi Ternak Makmur', komoditas_ternak: ['Sapi'], wilayah: 'Kab. Bandung', tanggal_pengajuan: '2026-09-12', nilai_bantuan: '125000000', catatan_verifikasi: 'Dokumen lengkap dan telah diverifikasi.' } },
  { id: 2, noId: 'ID-0000000002', status: 'Menunggu', createdAt: '10 Sep 2026', values: { nama_kelompok: 'Kelompok Domba Sejahtera', komoditas_ternak: ['Domba', 'Kambing'], wilayah: 'Kab. Garut', tanggal_pengajuan: '2026-09-10', nilai_bantuan: '85000000', catatan_verifikasi: 'Menunggu kunjungan lapangan.' } },
  { id: 3, noId: 'ID-0000000003', status: 'Disetujui', createdAt: '08 Sep 2026', values: { nama_kelompok: 'Sentra Ayam Mandiri', komoditas_ternak: ['Ayam'], wilayah: 'Kab. Sumedang', tanggal_pengajuan: '2026-09-08', nilai_bantuan: '67500000', catatan_verifikasi: 'Rekomendasi teknis tersedia.' } },
  { id: 4, noId: 'ID-0000000004', status: 'Review', createdAt: '05 Sep 2026', values: { nama_kelompok: 'Peternak Muda Lestari', komoditas_ternak: ['Sapi', 'Kambing'], wilayah: 'Kab. Tasikmalaya', tanggal_pengajuan: '2026-09-05', nilai_bantuan: '145000000', catatan_verifikasi: 'Perlu penyesuaian rencana anggaran.' } },
]

const initialUsers = [
  { id: 'u1', name: 'Admin Sistem', username: 'admin', email: 'admin@dinas.go.id', password: 'admin123', role: 'superadmin', status: 'Aktif' },
  { id: 'u2', name: 'Rina Kurnia', username: 'rina', email: 'rina@dinas.go.id', password: 'rina123', role: 'user', status: 'Aktif' },
  { id: 'u3', name: 'Bagus Pratama', username: 'bagus', email: 'bagus@dinas.go.id', password: 'bagus123', role: 'user', status: 'Nonaktif' },
]

const DEFAULT_ANNOUNCEMENT = 'Pengumuman-pengumuman.... mohon perhatian...!'
const DEFAULT_ANNOUNCEMENT_STYLE = { textColor: '#000000', backgroundColor: '#f4f4a4', fontSize: 12, speed: 24, transparency: 0 }

const databaseStateProperties = {
  'hibah-fields': 'fields',
  'hibah-records': 'records',
  'hibah-verification-fields': 'verificationFields',
  'hibah-verifications': 'verifications',
}

const typeLabels = { text: 'Teks singkat', paragraph: 'Paragraf', number: 'Angka', currency: 'Anggaran', header: 'Header', separator: 'Separator', date: 'Tanggal', time: 'Waktu', checklist: 'Checklist', list: 'Pilihan list' }
const defaultPokjaColors = { 'Pokja Produksi': '#59a96d', 'Pokja Bibit': '#c38a3d', 'Pokja Pakan': '#5e7dc7' }
const pokjaQuickColors = ['#39a778', '#59a96d', '#c38a3d', '#5e7dc7', '#c45c4a', '#2f8c89', '#875a9e', '#8a8f3a', '#596f83']
const navItems = [
  { id: 'overview', label: 'Ringkasan', icon: Gauge },
  { id: 'database', label: 'Database hibah', icon: Database },
  { id: 'fields', label: 'Config field', icon: FileCog, admin: true },
  { id: 'verification-database', label: 'Database Verifikasi Hibah', icon: ClipboardCheck },
  { id: 'library', label: 'Pustaka', icon: BookOpen },
  { id: 'verification-config', label: 'Config Form Verifikasi', icon: FileCog, admin: true },
]

function usePersistedState(key, fallback) {
  const [value, setValue] = useState(() => {
    const saved = localStorage.getItem(key)
    return saved ? JSON.parse(saved) : fallback
  })
  useEffect(() => localStorage.setItem(key, JSON.stringify(value)), [key, value])
  return [value, setValue]
}

function applySyncEvents(current, events, collection) {
  let next = current
  for (const event of events) {
    if (event.collection !== collection) continue
    const identity = collection === 'verifications' ? 'hibahId' : 'id'
    const entityId = String(event.entityId)
    if (event.operation === 'delete') {
      next = next.filter((item) => String(item[identity]) !== entityId)
      continue
    }
    if (!event.payload) continue
    const incoming = event.payload
    const index = next.findIndex((item) => String(item[identity]) === String(incoming[identity]))
    if (index < 0) {
      next = collection === 'records' || collection === 'verifications'
        ? [incoming, ...next]
        : [...next, incoming]
    } else {
      next = next.map((item, itemIndex) => itemIndex === index ? { ...item, ...incoming } : item)
    }
  }

  if (collection === 'fields' || collection === 'verification-fields') {
    next = [...next].sort((left, right) => Number(left.order || 0) - Number(right.order || 0))
  } else if (collection === 'users') {
    next = [...next].sort((left, right) => left.name.localeCompare(right.name))
  }
  return next
}

function useDatabaseState(key, fallback, endpoint) {
  const [value, setValue] = useState(fallback)
  const [ready, setReady] = useState(false)
  const lastDatabaseValue = useRef(null)
  const syncCursor = useRef(0)
  const valueRef = useRef(value)
  const saveQueue = useRef(Promise.resolve())
  valueRef.current = value
  const collection = endpoint
  const saveValue = (nextValue) => {
    const serialized = JSON.stringify(nextValue)
    if (serialized === lastDatabaseValue.current) return Promise.resolve(true)
    const save = saveQueue.current.catch(() => {}).then(async () => {
      const response = await fetch(`/api/index.php?action=${endpoint}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [endpoint]: nextValue }),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || `HTTP ${response.status}`)
      lastDatabaseValue.current = serialized
      window.dispatchEvent(new CustomEvent('hibah:sync-saved', { detail: { key, savedAt: Date.now() } }))
      return true
    })
    saveQueue.current = save
    return save
  }

  useEffect(() => {
    let cancelled = false
    const saved = localStorage.getItem(key)
    const legacyValue = saved ? JSON.parse(saved) : fallback

    fetch('/api/index.php?action=state')
      .then(async (response) => {
        const state = await response.json()
        if (!response.ok) throw new Error(state.error || 'Database tidak dapat dibaca.')
        syncCursor.current = Number(state.syncCursor || 0)
        if (key === 'hibah-users') {
          if (state.usersInitialized) {
            lastDatabaseValue.current = JSON.stringify(state.users)
            if (!cancelled) setValue(state.users)
            return
          }

          const initializeResponse = await fetch('/api/index.php?action=users-initialize', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ users: legacyValue }),
          })
          const initializedUsers = await initializeResponse.json()
          if (!initializeResponse.ok) throw new Error(initializedUsers.error || 'Migrasi pengguna gagal.')
          lastDatabaseValue.current = JSON.stringify(initializedUsers.users)
          if (!cancelled) setValue(initializedUsers.users)
          return
        }
        if (state.initialized) {
          const databaseValue = state[databaseStateProperties[key]]
          lastDatabaseValue.current = JSON.stringify(databaseValue)
          if (!cancelled) setValue(databaseValue)
          return
        }

        const initialState = { fields: key === 'hibah-fields' ? legacyValue : initialFields, records: key === 'hibah-records' ? legacyValue : initialRecords }
        const initializeResponse = await fetch('/api/index.php?action=initialize', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(initialState),
        })
        const initializedState = await initializeResponse.json()
        if (!initializeResponse.ok) throw new Error(initializedState.error || 'Migrasi data gagal.')
        const databaseValue = initializedState[databaseStateProperties[key]]
        lastDatabaseValue.current = JSON.stringify(databaseValue)
        if (!cancelled) setValue(databaseValue)
      })
      .catch((error) => {
        console.error(`Database ${key} tidak tersedia:`, error)
        if (!cancelled) setValue(legacyValue)
      })
      .finally(() => {
        if (!cancelled) setReady(true)
      })

    return () => { cancelled = true }
  }, [key])

  useEffect(() => {
    if (!ready) return
    let cancelled = false
    let pullPromise = null
    const pullChanges = (force = false) => {
      if (cancelled) return Promise.resolve(true)
      if (pullPromise) return pullPromise
      pullPromise = (async () => {
        try {
        if (!force && JSON.stringify(valueRef.current) !== lastDatabaseValue.current) return true
        let hasMore = true
        while (hasMore && !cancelled) {
          const response = await fetch(`/api/index.php?action=sync&since=${syncCursor.current}&limit=200`)
          const batch = await response.json()
          if (!response.ok) throw new Error(batch.error || `HTTP ${response.status}`)
          if (cancelled) return true

          if (batch.events?.length) {
            const updated = applySyncEvents(valueRef.current, batch.events, collection)
            const serialized = JSON.stringify(updated)
            lastDatabaseValue.current = serialized
            valueRef.current = updated
            setValue(updated)
          }
          syncCursor.current = Number(batch.cursor ?? syncCursor.current)
          hasMore = Boolean(batch.hasMore)
        }
        window.dispatchEvent(new CustomEvent('hibah:sync-pulled', { detail: { key, pulledAt: Date.now() } }))
        return true
      } catch (error) {
        console.error(`Gagal menarik perubahan ${key} dari database:`, error)
        if (!cancelled) window.dispatchEvent(new CustomEvent('hibah:sync-error', { detail: error.message }))
        return false
        }
      })().finally(() => { pullPromise = null })
      return pullPromise
    }

    const handleManualSync = (event) => {
      const task = (async () => {
        try {
          await saveValue(valueRef.current)
          return await pullChanges(true)
        } catch (error) {
          console.error(`Gagal menyimpan atau menarik perubahan ${key}:`, error)
          window.dispatchEvent(new CustomEvent('hibah:sync-error', { detail: error.message }))
          return false
        }
      })()
      event.detail?.tasks?.push(task)
    }
    const interval = window.setInterval(pullChanges, 3000)
    window.addEventListener('hibah:sync-now', handleManualSync)
    return () => { cancelled = true; window.clearInterval(interval); window.removeEventListener('hibah:sync-now', handleManualSync) }
  }, [collection, endpoint, key, ready])

  useEffect(() => {
    if (!ready) return
    localStorage.setItem(key, JSON.stringify(value))
    saveValue(value).catch((error) => {
      console.error(`Gagal menyimpan ${key} ke database:`, error)
      window.dispatchEvent(new CustomEvent('hibah:sync-error', { detail: error.message }))
    })
  }, [endpoint, key, ready, value])

  return [value, setValue]
}

function formatCurrency(value) {
  return new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 }).format(Number(value || 0))
}

function formatCompactBudget(value) {
  return new Intl.NumberFormat('id-ID', { notation: 'compact', maximumFractionDigits: 1 }).format(Number(value || 0))
}

function formatPercentage(value, total) {
  if (!total) return '0%'
  return `${new Intl.NumberFormat('id-ID', { maximumFractionDigits: 2 }).format((value / total) * 100)}%`
}

function formatBudgetShare(value, total) {
  return formatPercentage(value, total)
}

function formatBudget(value) {
  const digits = String(value ?? '').replace(/\D/g, '')
  return digits ? `Rp ${formatCurrency(digits)}` : ''
}

function parseBudget(value) {
  return String(value).replace(/\D/g, '')
}

function isDataField(field) {
  return !['nama_kelompok', 'catatan_verifikasi'].includes(field.key) && !['header', 'separator'].includes(field.type)
}

function formatGrantId(number) {
  return `ID-${String(number).padStart(10, '0')}`
}

function getUserInitials(user) {
  return user?.name?.split(/\s+/).filter(Boolean).map((part) => part[0]).join('').slice(0, 2).toUpperCase() || 'AS'
}

function getNextGrantId(records) {
  const highest = records.reduce((max, record) => {
    const number = Number(String(record.noId || '').replace(/^ID-/, ''))
    return Number.isFinite(number) ? Math.max(max, number) : max
  }, 0)
  return formatGrantId(highest + 1)
}

function normalizeColumnName(value) {
  return String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '')
}

function getGrantExportData(records, fields) {
  const dataFields = fields.filter((field) => isDataField(field) && field.key !== 'nama_kelompok')
  const columns = [
    { label: 'No ID', value: (record) => record.noId || '' },
    { label: 'Nama kelompok', value: (record) => record.values?.nama_kelompok || '' },
    ...dataFields.map((field) => ({ label: field.label, value: (record) => record.values?.[field.key] })),
    { label: 'Status', value: (record) => record.status || '' },
    { label: 'Dibuat', value: (record) => record.createdAt || '' },
  ]
  const rows = records.map((record) => columns.map(({ value }) => {
    const cell = value(record)
    return Array.isArray(cell) ? cell.join(', ') : cell && typeof cell === 'object' ? JSON.stringify(cell) : String(cell ?? '')
  }))
  return { headers: columns.map(({ label }) => label), rows }
}

function downloadFile(blob, filename) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.hidden = true
  document.body.append(link)
  link.click()
  window.setTimeout(() => {
    link.remove()
    URL.revokeObjectURL(url)
  }, 1000)
}

async function exportGrantData(format, records, fields) {
  const { headers, rows } = getGrantExportData(records, fields)
  const fileDate = new Date().toISOString().slice(0, 10)
  const filename = `e-hibah-${fileDate}`
  if (format === 'csv') {
    const csvCell = (value) => {
      const safeValue = /^[\s]*[=+@\-\t\r]/.test(value) ? `'${value}` : value
      return `"${safeValue.replace(/"/g, '""')}"`
    }
    const csv = [headers, ...rows].map((row) => row.map(csvCell).join(',')).join('\r\n')
    downloadFile(new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' }), `${filename}.csv`)
    return
  }
  if (format === 'xls') {
    const XLSX = await import('@e965/xlsx')
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet([headers, ...rows]), 'Database Hibah')
    XLSX.writeFile(workbook, `${filename}.xls`, { bookType: 'xls' })
    return
  }
  const [{ jsPDF }, autoTableModule] = await Promise.all([import('jspdf'), import('jspdf-autotable')])
  const document = new jsPDF({ orientation: 'landscape' })
  autoTableModule.default(document, { head: [headers], body: rows, styles: { fontSize: 7, cellPadding: 2 }, headStyles: { fillColor: [35, 107, 72] } })
  document.save(`${filename}.pdf`)
}

async function readGrantImport(file, fields) {
  const XLSX = await import('@e965/xlsx')
  const workbook = XLSX.read(await file.arrayBuffer(), { type: 'array', cellDates: false })
  const firstSheet = workbook.Sheets[workbook.SheetNames[0]]
  if (!firstSheet) throw new Error('File Excel tidak memiliki sheet yang dapat dibaca.')
  const [headerRow = [], ...dataRows] = XLSX.utils.sheet_to_json(firstSheet, { header: 1, defval: '', raw: false })
  const columnIndexes = new Map(headerRow.map((header, index) => [normalizeColumnName(header), index]))
  const findColumn = (...names) => names.map(normalizeColumnName).map((name) => columnIndexes.get(name)).find((index) => index !== undefined)
  const nameIndex = findColumn('nama_kelompok', 'Nama kelompok', 'Nama kelompok penerima')
  if (nameIndex === undefined) throw new Error('Kolom Nama kelompok tidak ditemukan. Gunakan key field atau label field sebagai header.')
  const idIndex = findColumn('noId', 'No ID', 'ID')
  const statusIndex = findColumn('status', 'Status')
  const createdAtIndex = findColumn('createdAt', 'Dibuat')
  const fieldColumns = fields.filter((field) => isDataField(field)).map((field) => ({
    field,
    index: findColumn(field.key, field.label),
  })).filter(({ index }) => index !== undefined)
  return dataRows.map((row) => {
    const values = {}
    fieldColumns.forEach(({ field, index }) => {
      const value = row[index]
      values[field.key] = field.type === 'checklist' && value ? String(value).split(/[;,]/).map((item) => item.trim()).filter(Boolean) : String(value ?? '').trim()
    })
    values.nama_kelompok = String(row[nameIndex] ?? '').trim()
    return {
      noId: idIndex === undefined ? '' : String(row[idIndex] ?? '').trim(),
      status: statusIndex === undefined ? '' : String(row[statusIndex] ?? '').trim(),
      createdAt: createdAtIndex === undefined ? '' : String(row[createdAtIndex] ?? '').trim(),
      values,
    }
  }).filter((row) => row.values.nama_kelompok)
}

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(() => localStorage.getItem('hibah-auth') === 'true')
  const [role, setRole] = usePersistedState('hibah-role', 'superadmin')
  const [theme, setTheme] = usePersistedState('hibah-theme', 'green')
  const [language, setLanguage] = usePersistedState('hibah-language', 'id')
  const [records, setRecords] = useDatabaseState('hibah-records', initialRecords, 'records')
  const [fields, setFields] = useDatabaseState('hibah-fields', initialFields, 'fields')
  const [verificationFields, setVerificationFields] = useDatabaseState('hibah-verification-fields', [], 'verification-fields')
  const [verifications, setVerifications] = useDatabaseState('hibah-verifications', [], 'verifications')
  const [users, setUsers] = useDatabaseState('hibah-users', initialUsers, 'users')
  const [activeUserId, setActiveUserId] = useState(() => localStorage.getItem('hibah-user-id'))
  const [sidebarCollapsed, setSidebarCollapsed] = usePersistedState('hibah-sidebar-collapsed', false)
  const [activePage, setActivePage] = useState('overview')
  const [loginError, setLoginError] = useState('')
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const [loginSuccessName, setLoginSuccessName] = useState('')
  const [isLoggingIn, setIsLoggingIn] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [profileMenuOpen, setProfileMenuOpen] = useState(false)
  const [accountModalOpen, setAccountModalOpen] = useState(false)
  const [syncStatus, setSyncStatus] = useState('idle')
  const [lastSyncAt, setLastSyncAt] = useState(null)
  const [announcement, setAnnouncement] = useState(DEFAULT_ANNOUNCEMENT)
  const [announcementStyle, setAnnouncementStyle] = useState(DEFAULT_ANNOUNCEMENT_STYLE)
  const [libraryItems, setLibraryItems] = useState([])
  useEffect(() => {
    const handleSyncError = () => setSyncStatus('error')
    const handleSyncSuccess = () => {
      setSyncStatus((current) => current === 'syncing' ? current : 'synced')
      setLastSyncAt(new Date())
    }
    window.addEventListener('hibah:sync-error', handleSyncError)
    window.addEventListener('hibah:sync-pulled', handleSyncSuccess)
    window.addEventListener('hibah:sync-saved', handleSyncSuccess)
    return () => {
      window.removeEventListener('hibah:sync-error', handleSyncError)
      window.removeEventListener('hibah:sync-pulled', handleSyncSuccess)
      window.removeEventListener('hibah:sync-saved', handleSyncSuccess)
    }
  }, [])
  const syncNow = () => {
    const tasks = []
    setSyncStatus('syncing')
    window.dispatchEvent(new CustomEvent('hibah:sync-now', { detail: { tasks } }))
    if (!tasks.length) {
      setSyncStatus('synced')
      setLastSyncAt(new Date())
      return
    }
    Promise.all(tasks).then((results) => {
      setSyncStatus(results.every(Boolean) ? 'synced' : 'error')
      if (results.every(Boolean)) setLastSyncAt(new Date())
    })
  }
  useEffect(() => {
    const handleProfileEdit = (event) => {
      if (event.target.closest('button')?.textContent.trim() === 'Edit profil') setAccountModalOpen(true)
    }
    document.addEventListener('click', handleProfileEdit)
    return () => document.removeEventListener('click', handleProfileEdit)
  }, [])
  useEffect(() => {
    if (!isLoggedIn) return
    let cancelled = false
    fetch('/api/index.php?action=app-settings')
      .then(async (response) => {
        const result = await response.json()
        if (!response.ok) throw new Error(result.error || 'Pengumuman tidak dapat dimuat.')
        if (!cancelled) {
          setAnnouncement(result.announcement || DEFAULT_ANNOUNCEMENT)
          setAnnouncementStyle({ ...DEFAULT_ANNOUNCEMENT_STYLE, ...result.style })
        }
      })
      .catch((error) => console.error('Gagal memuat pengumuman aplikasi:', error))
    return () => { cancelled = true }
  }, [isLoggedIn])
  useEffect(() => {
    if (!isLoggedIn) return
    let cancelled = false
    fetch('/api/index.php?action=library')
      .then(async (response) => {
        const result = await response.json()
        if (!response.ok) throw new Error(result.error || 'Pustaka tidak dapat dimuat.')
        if (!cancelled) setLibraryItems(Array.isArray(result.items) ? result.items : [])
      })
      .catch((error) => console.error('Gagal memuat Pustaka:', error))
    return () => { cancelled = true }
  }, [isLoggedIn])
  useEffect(() => {
    const migratedRecords = records.map((record, index) => ({ ...record, noId: record.noId || formatGrantId(index + 1) }))
    if (migratedRecords.some((record, index) => record.noId !== records[index].noId)) setRecords(migratedRecords)
  }, [records, setRecords])

  const login = async (event) => {
    event.preventDefault()
    if (isLoggingIn) return
    const data = new FormData(event.currentTarget)
    const identifier = String(data.get('email') || '').trim().toLowerCase()
    const password = String(data.get('password') || '')
    if (!identifier || !password) return setLoginError(language === 'id' ? 'Isi username/email dan kata sandi terlebih dahulu.' : 'Enter your username/email and password first.')
    setLoginError('')
    setIsLoggingIn(true)
    try {
      const response = await fetch('/api/index.php?action=login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password }),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Username/email atau password tidak sesuai.')
      const user = result.user
      setLoginSuccessName(user.name)
      window.setTimeout(() => {
        localStorage.setItem('hibah-auth', 'true')
        localStorage.setItem('hibah-user-id', user.id)
        setActiveUserId(user.id)
        setRole(user.role)
        setActivePage('overview')
        setShowLogoutConfirm(false)
        setIsLoggedIn(true)
        setIsLoggingIn(false)
        setLoginSuccessName('')
      }, 1100)
    } catch (error) {
      setLoginError(error.message || 'Username/email atau password tidak sesuai.')
      setIsLoggingIn(false)
    }
  }

  const saveAnnouncement = async (value, style) => {
    const response = await fetch('/api/index.php?action=app-settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ announcement: value, style }),
    })
    const result = await response.json()
    if (!response.ok) throw new Error(result.error || 'Pengumuman tidak dapat disimpan.')
    setAnnouncement(result.announcement)
    setAnnouncementStyle({ ...DEFAULT_ANNOUNCEMENT_STYLE, ...result.style })
    return result
  }

  const saveLibraryItems = async (items) => {
    const response = await fetch('/api/index.php?action=library', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items }),
    })
    const result = await response.json()
    if (!response.ok) throw new Error(result.error || 'Pustaka tidak dapat disimpan.')
    setLibraryItems(result.items)
    return result.items
  }

  const logout = () => { fetch('/api/index.php?action=logout', { method: 'POST' }).catch((error) => console.error('Gagal mengakhiri sesi server:', error)); localStorage.removeItem('hibah-auth'); localStorage.removeItem('hibah-user-id'); setActiveUserId(null); setIsLoggedIn(false) }
  const activeUser = users.find((user) => user.id === activeUserId) || users.filter((user) => user.role === role && user.status === 'Aktif').at(-1) || users[0]
  const visibleFields = fields.filter((field) => field.active)
  const translations = language === 'id' ? { dashboard: 'Dashboard', database: 'Database hibah', fields: 'Config field', settings: 'Pengaturan', welcome: 'Selamat datang kembali', records: 'Total Kelompok', approved: 'Disetujui', pending: 'Dalam proses', value: 'Pagu Anggaran', recent: 'Pengajuan terbaru' } : { dashboard: 'Overview', database: 'Grant database', fields: 'Field config', settings: 'Settings', welcome: 'Welcome back', records: 'Total groups', approved: 'Approved', pending: 'In progress', value: 'Budget allocation', recent: 'Recent applications' }

  if (!isLoggedIn) return <LoginScreen onSubmit={login} error={loginError} isLoggingIn={isLoggingIn} loginSuccessName={loginSuccessName} role={role} setRole={setRole} />

  return (
    <div className={`app-shell theme-${theme}`} style={{ '--user-initials': `'${getUserInitials(activeUser)}'`, '--user-avatar-content': activeUser?.photo ? 'none' : `'${getUserInitials(activeUser)}'`, '--user-photo': activeUser?.photo ? `url("${activeUser.photo}")` : 'none', '--user-name': `'${activeUser?.name || 'Pengguna'}'`, '--user-role': `'${activeUser?.role === 'superadmin' ? 'Superadmin' : 'Operator data'}'` }}>
      <Sidebar activePage={activePage} setActivePage={(page) => { setActivePage(page); setMobileMenuOpen(false) }} role={role} user={activeUser} t={translations} onLogout={() => setShowLogoutConfirm(true)} collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed((current) => !current)} mobileOpen={mobileMenuOpen} />
      <main className="main-content">
        <Topbar onMenu={() => setMobileMenuOpen((current) => !current)} user={activeUser} theme={theme} setTheme={setTheme} language={language} setLanguage={setLanguage} t={translations} profileMenuOpen={profileMenuOpen} onProfileMenu={() => setProfileMenuOpen((current) => !current)} onManageAccount={() => { setProfileMenuOpen(false); setAccountModalOpen(true) }} onLogout={() => { setProfileMenuOpen(false); setShowLogoutConfirm(true) }} onSync={syncNow} syncStatus={syncStatus} lastSyncAt={lastSyncAt} />
        {activePage === 'overview' && <AnnouncementTicker message={announcement} style={announcementStyle} />}
        <div className="content-wrap" data-page={activePage}>
          {activePage === 'overview' && <Overview records={records} fields={visibleFields} verifications={verifications} user={activeUser} t={translations} onNavigate={setActivePage} />}
          {activePage === 'database' && <DatabasePage key={activeUser.id} records={records} setRecords={setRecords} fields={visibleFields} allFields={fields} verificationFields={verificationFields} verifications={verifications} setVerifications={setVerifications} user={activeUser} role={role} t={translations} />}
          {activePage === 'fields' && role === 'superadmin' && <FieldsPageBackup fields={fields} setFields={setFields} />}
          {activePage === 'fields' && role !== 'superadmin' && <AccessDenied onBack={() => setActivePage('overview')} />}
          {activePage === 'verification-config' && role === 'superadmin' && <VerificationFieldsPage fields={verificationFields} setFields={setVerificationFields} />}
          {activePage === 'verification-config' && role !== 'superadmin' && <AccessDenied onBack={() => setActivePage('overview')} />}
          {activePage === 'verification-database' && <VerificationDatabasePage records={records} verifications={verifications} setVerifications={setVerifications} verificationFields={verificationFields} hibahFields={visibleFields} user={activeUser} />}
          {activePage === 'library' && <LibraryPage items={libraryItems} />}
          {activePage === 'settings' && <SettingsPage user={activeUser} onEditAccount={() => setAccountModalOpen(true)} theme={theme} setTheme={setTheme} language={language} setLanguage={setLanguage} announcement={announcement} announcementStyle={announcementStyle} onSaveAnnouncement={saveAnnouncement} libraryItems={libraryItems} onSaveLibrary={saveLibraryItems} />}
          {activePage === 'users' && role === 'superadmin' && <UsersPage users={users} setUsers={setUsers} currentUser={activeUser} />}
          {activePage === 'users' && role !== 'superadmin' && <AccessDenied onBack={() => setActivePage('overview')} />}
        </div>
        <footer className="app-footer">© Dinas Pertanian dan Peternakan Provinsi Jawa Tengah - Bidang Peternakan - 2026</footer>
      </main>
      {showLogoutConfirm && <LogoutConfirm onCancel={() => setShowLogoutConfirm(false)} onConfirm={logout} />}
      {accountModalOpen && <AccountModal user={activeUser} onClose={() => setAccountModalOpen(false)} onSave={(updatedUser) => { setUsers((current) => current.map((user) => user.id === updatedUser.id ? updatedUser : user)); setAccountModalOpen(false) }} />}
    </div>
  )
}

function LoginScreen({ onSubmit, error, isLoggingIn, loginSuccessName, role, setRole }) {
  const [showPassword, setShowPassword] = useState(false)
  return <div className="login-page">
    <div className="login-art"><div className="art-top"><span className="logo-shell"><img className="agency-logo" src={agencyLogo} alt="Logo Dinas Pertanian dan Peternakan Provinsi Jawa Tengah" onError={(event) => { event.currentTarget.style.display = 'none'; event.currentTarget.parentElement.querySelector('svg').style.display = 'block' }} /><LogIn size={31} /></span></div><div className="art-copy"><p className="eyebrow">SISTEM INFORMASI HIBAH</p><h1>HIBAH UANG<br /><em>BIDANG PETERNAKAN</em></h1><span className="art-rule" /><p className="art-quote">&quot;Ya TUHAN, berikan kami kejernihan dan ketenangan hati dalam menjalankan tugas pengelolaan hibah Bidang Peternakan.&quot;</p></div><div className="agency-name">DINAS PERTANIAN DAN PETERNAKAN<br /><strong>PROVINSI JAWA TENGAH</strong></div></div>
    <div className="login-panel"><div className="login-box"><div className="mobile-brand"><span className="brand-mark"><LogIn size={18} /></span><span>Hibah Peternakan</span></div><p className="eyebrow">SILAKAN LOGIN KE AKUN ANDA</p><h2>SELAMAT DATANG</h2><form onSubmit={onSubmit}><label>USERNAME<div className="aero-input"><UserRound size={16} /><input name="email" type="text" placeholder="Masukkan username" autoComplete="username" /></div></label><label>PASSWORD<div className="aero-input password-wrap"><KeyIcon /><input name="password" type={showPassword ? 'text' : 'password'} placeholder="Masukkan password" autoComplete="current-password" /><button type="button" className="password-toggle" onClick={() => setShowPassword((current) => !current)} aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'} title={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}>{showPassword ? <EyeOff size={16} /> : <Eye size={16} />}</button></div></label>{error && <div className="form-error">{error}</div>}<button className={`primary-btn login-btn ${isLoggingIn ? 'is-loading' : ''}`} type="submit" disabled={isLoggingIn}>{isLoggingIn ? <><span className="login-spinner" /> MEMERIKSA AKUN...</> : <><span>MASUK APLIKASI</span> <LogIn size={18} /></>}</button></form><p className="login-foot">© 2026 HIBAH BIDANG PETERNAKAN ·<br /> DINAS PERTANIAN DAN PETERNAKAN</p></div></div>{loginSuccessName && <div className="login-success-toast" role="status"><span className="success-check"><Check size={17} /></span><span><strong>Selamat datang, {loginSuccessName}</strong><small>Login berhasil, menyiapkan dashboard...</small></span></div>}
  </div>
}

function KeyIcon() { return <span className="key-icon"><ShieldCheck size={15} /></span> }

function LogoutConfirm({ onCancel, onConfirm }) {
  return <div className="logout-backdrop" role="presentation" onClick={onCancel}><section className="logout-modal" role="dialog" aria-modal="true" aria-labelledby="logout-title" onClick={(event) => event.stopPropagation()}><div className="logout-icon"><LogOut size={21} /></div><h2 id="logout-title">Apakah anda yakin untuk keluar aplikasi?</h2><p>Sesi Anda akan diakhiri dan Anda perlu login kembali untuk masuk.</p><div className="logout-actions"><button className="cancel-logout" onClick={onCancel}>Batal</button><button className="confirm-logout" onClick={onConfirm}>Ya Keluar</button></div></section></div>
}

function Sidebar({ activePage, setActivePage, role, user, t, onLogout, collapsed, onToggle, mobileOpen }) {
  return <aside className={`sidebar ${collapsed ? 'sidebar-collapsed' : ''}`}><div className="sidebar-brand"><button type="button" className="brand-mark logo-brand" onClick={() => setActivePage('overview')} aria-label="Kembali ke dashboard" title="Kembali ke dashboard"><img src={agencyLogo} alt="" /></button><div><strong>E-HIBAH</strong><small>Hibah Bidang Peternakan</small></div></div><button className="sidebar-toggle" onClick={onToggle} aria-label={collapsed ? 'Tampilkan menu' : 'Sembunyikan menu'} title={collapsed ? 'Tampilkan menu' : 'Sembunyikan menu'}>{collapsed ? <PanelLeftOpen size={17} /> : <PanelLeftClose size={17} />}</button><div className="workspace-switch"><span className="workspace-icon"><Grid2X2 size={16} /></span><span><small>WORKSPACE</small><strong>Jawa Tengah</strong></span><ChevronDown size={15} /></div><nav><p className="nav-caption">Menu utama</p>{navItems.filter((item) => !item.admin || role === 'superadmin').map((item) => {
    const Icon = item.icon
    const label = item.id === 'overview' ? t.dashboard : item.id === 'database' ? t.database : item.id === 'fields' ? t.fields : item.label
    return <button key={item.id} className={`nav-item ${activePage === item.id ? 'active' : ''}`} onClick={() => setActivePage(item.id)} title={collapsed ? label : undefined}><Icon size={18} /><span>{label}</span></button>
  })}<p className="nav-caption second">Sistem</p><button className={`nav-item ${activePage === 'settings' ? 'active' : ''}`} onClick={() => setActivePage('settings')} title={collapsed ? t.settings : undefined}><Settings size={18} /><span>{t.settings}</span></button>{role === 'superadmin' && <button className={`nav-item ${activePage === 'users' ? 'active' : ''}`} onClick={() => setActivePage('users')} title={collapsed ? 'Manajemen user' : undefined}><UsersRound size={18} /><span>Manajemen user</span></button>}</nav><div className="sidebar-bottom"><button className="profile-mini" onClick={onLogout} title={collapsed ? 'Keluar' : undefined}><span className="avatar">AS</span><span><strong>Admin Sistem</strong><small>{role === 'superadmin' ? 'Superadmin' : 'Operator data'}</small></span><LogOut size={16} /></button></div></aside>
}

function TopbarLegacy({ onMenu, user, theme, setTheme, language, setLanguage, t }) {
  return <header className="topbar"><div className="mobile-menu"><Menu size={20} /></div><div className="breadcrumb"><span>Workspace</span><span>/</span><strong>{t.dashboard}</strong></div><div className="top-actions"><button className="icon-btn notification" aria-label="Notifikasi"><Bell size={18} /><i /></button><select className="compact-select" value={language} onChange={(event) => setLanguage(event.target.value)} aria-label="Bahasa"><option value="id">ID</option><option value="en">EN</option></select><select className="compact-select theme-select" value={theme} onChange={(event) => setTheme(event.target.value)} aria-label="Tema"><option value="green">Green</option><option value="light">Light</option><option value="dark">Dark</option><option value="blue">Blue</option></select><span className="top-avatar">AS</span></div></header>
}

function Topbar({ onMenu, user, theme, setTheme, language, setLanguage, t, profileMenuOpen, onProfileMenu, onManageAccount, onLogout, onSync, syncStatus, lastSyncAt }) {
  const [serverTime, setServerTime] = useState(null)
  const dateFormatter = new Intl.DateTimeFormat('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Jakarta' })
  const formatServerDate = (date) => dateFormatter.format(date).replace(/^Jumat,/, "Jum'at,")
  const timeFormatter = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23', timeZone: 'Asia/Jakarta' })

  useEffect(() => {
    let isMounted = true
    const refreshServerTime = async () => {
      try {
        const response = await fetch('/api/index.php?action=time', { cache: 'no-store' })
        if (!response.ok) throw new Error(`HTTP ${response.status}`)
        const result = await response.json()
        const nextTime = new Date(result.timestamp)
        if (isMounted && !Number.isNaN(nextTime.getTime())) setServerTime(nextTime)
      } catch (error) {
        console.error('Gagal membaca waktu server:', error)
      }
    }

    refreshServerTime()
    const tickInterval = window.setInterval(() => {
      setServerTime((current) => current ? new Date(current.getTime() + 1000) : current)
    }, 1000)
    const refreshInterval = window.setInterval(refreshServerTime, 60000)
    return () => {
      isMounted = false
      window.clearInterval(tickInterval)
      window.clearInterval(refreshInterval)
    }
  }, [])

  return (
    <header className="topbar">
      <button className="mobile-menu" onClick={onMenu} aria-label="Buka menu navigasi"><Menu size={20} /></button>
      <div className="breadcrumb">
        <span>Workspace</span>
        <span>/</span>
        <strong className="breadcrumb-server-time" aria-label={serverTime ? `${formatServerDate(serverTime)} pukul ${timeFormatter.format(serverTime)} waktu server` : 'Memuat waktu server'}>
          {serverTime ? <>
            <time dateTime={serverTime.toISOString()}>{formatServerDate(serverTime)}</time>
            <span aria-hidden="true">|</span>
            <time dateTime={serverTime.toISOString()}>{timeFormatter.format(serverTime)}</time>
          </> : 'Memuat waktu server...'}
        </strong>
      </div>
      <div className="top-actions">
        <button className={`sync-button ${syncStatus}`} onClick={onSync} disabled={syncStatus === 'syncing'} title={lastSyncAt ? `Terakhir sinkron ${lastSyncAt.toLocaleTimeString('id-ID')}` : 'Tarik perubahan terbaru dari server'} aria-label="Sinkronisasi data"><RefreshCw size={15} className={syncStatus === 'syncing' ? 'sync-spinning' : ''} /><span>{syncStatus === 'syncing' ? 'Menyinkronkan...' : syncStatus === 'error' ? 'Sinkronisasi gagal' : 'Sinkronisasi'}</span></button>
        <button className="icon-btn notification" aria-label="Notifikasi"><Bell size={18} /><i /></button>
        <select className="compact-select" value={language} onChange={(event) => setLanguage(event.target.value)} aria-label="Bahasa"><option value="id">ID</option><option value="en">EN</option></select>
        <select className="compact-select theme-select" value={theme} onChange={(event) => setTheme(event.target.value)} aria-label="Tema"><option value="green">Green</option><option value="light">Light</option><option value="dark">Dark</option><option value="blue">Blue</option></select>
        <div className="profile-menu-wrap">
          <button className="top-avatar profile-trigger" onClick={onProfileMenu} aria-label="Buka menu akun" aria-expanded={profileMenuOpen}>{getUserInitials(user)}</button>
          {profileMenuOpen && <div className="profile-dropdown"><div className="profile-dropdown-head"><strong>{user?.name || 'Pengguna'}</strong><small>{user?.email || ''}</small></div><button onClick={onManageAccount}><UserRound size={16} /> Kelola akun</button><button onClick={onLogout} className="dropdown-logout"><LogOut size={16} /> Logout</button></div>}
        </div>
      </div>
    </header>
  )
}

function AccountModal({ user, onClose, onSave }) {
  const [value, setValue] = useState({ ...user, password: '' })
  const [photoDraft, setPhotoDraft] = useState(null)
  const [cropZoom, setCropZoom] = useState(1)
  const [cropOffset, setCropOffset] = useState({ x: 0, y: 0 })
  const dragRef = useRef(null)
  const update = (key, next) => setValue((current) => ({ ...current, [key]: next }))
  const cropSize = 240
  const baseScale = photoDraft ? Math.max(cropSize / photoDraft.width, cropSize / photoDraft.height) : 1
  const renderedWidth = photoDraft ? photoDraft.width * baseScale * cropZoom : cropSize
  const renderedHeight = photoDraft ? photoDraft.height * baseScale * cropZoom : cropSize
  const maxOffsetX = Math.max(0, (renderedWidth - cropSize) / 2)
  const maxOffsetY = Math.max(0, (renderedHeight - cropSize) / 2)
  const displayedOffset = {
    x: Math.max(-maxOffsetX, Math.min(maxOffsetX, cropOffset.x)),
    y: Math.max(-maxOffsetY, Math.min(maxOffsetY, cropOffset.y)),
  }
  const handlePhoto = (event) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const image = new Image()
      image.onload = () => {
        setPhotoDraft({ src: String(reader.result), width: image.naturalWidth, height: image.naturalHeight })
        setCropZoom(1)
        setCropOffset({ x: 0, y: 0 })
      }
      image.src = String(reader.result)
    }
    reader.readAsDataURL(file)
  }
  const handleCropPointerDown = (event) => {
    event.currentTarget.setPointerCapture(event.pointerId)
    dragRef.current = { x: event.clientX, y: event.clientY, offsetX: displayedOffset.x, offsetY: displayedOffset.y }
  }
  const handleCropPointerMove = (event) => {
    if (!dragRef.current) return
    const nextX = dragRef.current.offsetX + event.clientX - dragRef.current.x
    const nextY = dragRef.current.offsetY + event.clientY - dragRef.current.y
    setCropOffset({ x: Math.max(-maxOffsetX, Math.min(maxOffsetX, nextX)), y: Math.max(-maxOffsetY, Math.min(maxOffsetY, nextY)) })
  }
  const applyCrop = () => {
    if (!photoDraft) return
    const image = new Image()
    image.onload = () => {
      const displayScale = baseScale * cropZoom
      const sourceSize = cropSize / displayScale
      const sourceX = Math.max(0, Math.min(photoDraft.width - sourceSize, (photoDraft.width - sourceSize) / 2 - displayedOffset.x / displayScale))
      const sourceY = Math.max(0, Math.min(photoDraft.height - sourceSize, (photoDraft.height - sourceSize) / 2 - displayedOffset.y / displayScale))
      const canvas = document.createElement('canvas')
      canvas.width = 512
      canvas.height = 512
      const context = canvas.getContext('2d')
      if (!context) return
      context.drawImage(image, sourceX, sourceY, sourceSize, sourceSize, 0, 0, canvas.width, canvas.height)
      update('photo', canvas.toDataURL('image/png'))
      setPhotoDraft(null)
    }
    image.src = photoDraft.src
  }
  return (
    <div className="modal-backdrop">
      <div className="modal account-modal">
        <div className="modal-head">
          <div><p className="eyebrow">PENGELOLAAN AKUN</p><h2>Kelola akun</h2></div>
          <button className="close-btn" onClick={onClose} aria-label="Tutup"><X size={19} /></button>
        </div>
        <form onSubmit={(event) => { event.preventDefault(); onSave({ ...value, password: value.password || user.password }) }}>
          <div className="account-form">
            <div className="account-photo-preview">{value.photo ? <img src={value.photo} alt="Foto profil" /> : getUserInitials(value)}</div>
            <div className="field-group">Foto profil<label className="photo-file-picker"><Upload size={17} /><span>Pilih foto profil<small>Atur posisi dan crop setelah memilih</small></span><input type="file" accept="image/*" onChange={handlePhoto} /></label></div>
            <label className="field-group full-span">Nama lengkap <b>*</b><input required autoComplete="name" value={value.name || ''} onChange={(event) => update('name', event.target.value)} placeholder="Masukkan nama lengkap" /></label>
            <label className="field-group">Username <b>*</b><input required value={value.username || ''} onChange={(event) => update('username', event.target.value.toLowerCase().replace(/\s/g, ''))} /></label>
            <label className="field-group">Email <b>*</b><input required type="email" value={value.email || ''} onChange={(event) => update('email', event.target.value)} /></label>
            <label className="field-group full-span">Kontak person (WhatsApp)<input type="tel" inputMode="tel" autoComplete="tel" value={value.contactWhatsapp || ''} onChange={(event) => update('contactWhatsapp', event.target.value.replace(/[^0-9+]/g, ''))} placeholder="Contoh: 081234567890" /></label>
            <label className="field-group full-span">Password baru<small className="field-hint">Kosongkan jika password tidak diubah.</small><input type="password" value={value.password || ''} onChange={(event) => update('password', event.target.value)} placeholder="Masukkan password baru" /></label>
          </div>
          <div className="modal-foot"><button type="button" className="secondary-btn" onClick={onClose}>Batal</button><button type="submit" className="primary-btn"><Check size={16} /> Simpan akun</button></div>
        </form>
      </div>
      {photoDraft && <div className="photo-editor-backdrop">
        <section className="photo-editor" role="dialog" aria-modal="true" aria-labelledby="photo-editor-title">
          <div className="photo-editor-heading"><div><p className="eyebrow">FOTO PROFIL</p><h2 id="photo-editor-title">Atur foto Anda</h2></div><button type="button" className="close-btn" onClick={() => setPhotoDraft(null)} aria-label="Tutup editor"><X size={19} /></button></div>
          <p className="photo-editor-hint">Geser foto untuk mengatur posisi, lalu sesuaikan pembesaran.</p>
          <div className="photo-crop-stage" onPointerDown={handleCropPointerDown} onPointerMove={handleCropPointerMove} onPointerUp={() => { dragRef.current = null }} onPointerCancel={() => { dragRef.current = null }}>
            <img src={photoDraft.src} alt="Pratinjau foto yang akan dipotong" draggable="false" style={{ width: renderedWidth, height: renderedHeight, left: `calc(50% + ${displayedOffset.x}px)`, top: `calc(50% + ${displayedOffset.y}px)` }} />
            <div className="photo-crop-mask" />
          </div>
          <div className="photo-zoom-control"><button type="button" className="icon-btn" aria-label="Perkecil foto" title="Perkecil foto" onClick={() => setCropZoom((zoom) => Math.max(1, zoom - 0.1))}><ZoomOut size={18} /></button><input type="range" min="1" max="3" step="0.05" value={cropZoom} aria-label="Tingkat pembesaran foto" onChange={(event) => setCropZoom(Number(event.target.value))} /><button type="button" className="icon-btn" aria-label="Perbesar foto" title="Perbesar foto" onClick={() => setCropZoom((zoom) => Math.min(3, zoom + 0.1))}><ZoomIn size={18} /></button></div>
          <div className="photo-editor-actions"><button type="button" className="secondary-btn" onClick={() => { update('photo', photoDraft.src); setPhotoDraft(null) }}>Lewati</button><button type="button" className="primary-btn" onClick={applyCrop}><Check size={16} /> Terapkan crop</button></div>
        </section>
      </div>}
    </div>
  )
}

function Overview({ records, fields, verifications, user, t, onNavigate }) {
  const [pokjaColors, setPokjaColors] = usePersistedState('hibah-pokja-colors', defaultPokjaColors)
  const [budgetChartColor, setBudgetChartColor] = usePersistedState('hibah-budget-chart-color', '#39a778')
  const [showPokjaActions, setShowPokjaActions] = useState(false)
  const [activePokjaColor, setActivePokjaColor] = useState(null)
  const [isExportingPokja, setIsExportingPokja] = useState(false)
  const [showBudgetColorPicker, setShowBudgetColorPicker] = useState(false)
  const pokjaActionsRef = useRef(null)
  const pokjaPanelRef = useRef(null)
  const budgetColorPickerRef = useRef(null)

  useEffect(() => {
    const migrationKey = 'hibah-pokja-production-color-tune-v1'
    if (localStorage.getItem(migrationKey)) return
    setPokjaColors((current) => ({ ...current, 'Pokja Produksi': defaultPokjaColors['Pokja Produksi'] }))
    localStorage.setItem(migrationKey, 'applied')
  }, [setPokjaColors])

  const parseNumericValue = (value) => {
    if (value === undefined || value === null || value === '') return 0
    if (typeof value === 'number') return Number.isFinite(value) ? value : 0
    if (Array.isArray(value)) return value.reduce((sum, item) => sum + parseNumericValue(item), 0)
    const text = String(value).trim()
    if (!text) return 0
    const normalized = text.replace(/Rp|rp|\./g, '').replace(/\s+/g, '').replace(',', '.')
    const parsed = Number(normalized)
    return Number.isFinite(parsed) ? parsed : 0
  }

  const getRecordYear = (record) => {
    const values = record?.values ?? {}
    const yearField = Object.entries(values).find(([key, value]) => {
      if (value === undefined || value === null || value === '') return false
      const keyLower = String(key).toLowerCase()
      const valueLower = String(value).toLowerCase()
      return keyLower.includes('tahun') || valueLower.includes('tahun')
    })

    if (yearField) return String(yearField[1]).replace(/\D/g, '')

    const configuredYear = fields.find((field) => {
      const fieldKey = String(field?.key || '').toLowerCase()
      const fieldLabel = String(field?.label || '').toLowerCase()
      return fieldKey.includes('tahun') || fieldLabel.includes('tahun')
    })
    if (configuredYear) return String(values[configuredYear.key] ?? '').replace(/\D/g, '')

    return ''
  }

  const getRecordBudget = (record) => {
    const values = record?.values ?? {}
    const budgetKeys = ['nilai_bantuan', 'pagu_anggaran', 'anggaran', 'anggaran_bantuan', 'nilai_anggaran', 'nominal_bantuan', 'jumlah_bantuan']

    for (const key of budgetKeys) {
      const value = values[key]
      if (value !== undefined && value !== null && value !== '') return parseNumericValue(value)
    }

    const configuredBudget = fields.find((field) => {
      const fieldKey = String(field?.key || '').toLowerCase()
      const fieldLabel = String(field?.label || '').toLowerCase()
      return !fieldKey.includes('tahun') && !fieldLabel.includes('tahun') && (fieldKey.includes('anggaran') || fieldKey.includes('nilai') || fieldKey.includes('bantuan') || fieldLabel.includes('anggaran') || fieldLabel.includes('nilai') || fieldLabel.includes('bantuan'))
    })
    if (configuredBudget) return parseNumericValue(values[configuredBudget.key])

    const fallback = Object.entries(values).reduce((sum, [key, value]) => {
      const lowerKey = String(key).toLowerCase()
      const lowerValue = String(value).toLowerCase()
      if (lowerKey.includes('tahun') || lowerValue.includes('tahun')) return sum
      if ((lowerKey.includes('anggaran') || lowerKey.includes('nilai') || lowerKey.includes('bantuan') || lowerKey.includes('pagu')) && value !== '') {
        return sum + parseNumericValue(value)
      }
      return sum
    }, 0)

    return fallback
  }

  const years = [...new Set(records.map((record) => getRecordYear(record)).filter(Boolean))]
    .sort((left, right) => right.localeCompare(left, undefined, { numeric: true }))
  const [selectedYear, setSelectedYear] = useState(years[0] || '')
  const [activePieCategory, setActivePieCategory] = useState(null)

  useEffect(() => {
    if (!showPokjaActions) return undefined
    const closeOnOutsideClick = (event) => {
      if (!pokjaActionsRef.current?.contains(event.target)) setShowPokjaActions(false)
    }
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setShowPokjaActions(false)
    }
    document.addEventListener('pointerdown', closeOnOutsideClick)
    document.addEventListener('keydown', closeOnEscape)
    return () => {
      document.removeEventListener('pointerdown', closeOnOutsideClick)
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [showPokjaActions])

  useEffect(() => {
    if (!showBudgetColorPicker) return undefined
    const closeOnOutsideClick = (event) => {
      if (!budgetColorPickerRef.current?.contains(event.target)) setShowBudgetColorPicker(false)
    }
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setShowBudgetColorPicker(false)
    }
    document.addEventListener('pointerdown', closeOnOutsideClick)
    document.addEventListener('keydown', closeOnEscape)
    return () => {
      document.removeEventListener('pointerdown', closeOnOutsideClick)
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [showBudgetColorPicker])

  useEffect(() => {
    if (selectedYear && years.length && !years.includes(selectedYear)) {
      setSelectedYear(years[0] || '')
    }
  }, [years, selectedYear])

  const focusRecords = selectedYear ? records.filter((record) => getRecordYear(record) === selectedYear) : records
  const comparisonYear = selectedYear && years.includes(String(Number(selectedYear) - 1)) ? String(Number(selectedYear) - 1) : years[1] || ''
  const comparisonRecords = comparisonYear ? records.filter((record) => getRecordYear(record) === comparisonYear) : []

  const formatShareChange = (current, previous) => {
    if (!previous && !current) return '0.0%'
    if (!previous) return '+100.0%'
    const delta = ((current - previous) / previous) * 100
    const sign = delta >= 0 ? '+' : ''
    return `${sign}${delta.toFixed(1)}%`
  }

  const approved = focusRecords.filter((record) => record.status === 'Disetujui').length
  const pending = focusRecords.filter((record) => record.status !== 'Disetujui').length
  const total = focusRecords.reduce((sum, record) => sum + getRecordBudget(record), 0)
  const verificationByRecord = new Map((verifications || []).map((verification) => [String(verification.hibahId), verification]))
  const verificationCategories = [
    { id: 'passed', label: 'Lolos', color: '#357c55' },
    { id: 'failed', label: 'Tidak Lolos', color: '#c45c4a' },
    { id: 'unverified', label: '-/Belum verifikasi', color: '#a6aea8' },
  ]
  const getVerificationCategory = (record) => {
    const verification = verificationByRecord.get(String(record.id))
    const status = String(verification ? verification.status : record.status || '').trim().toLowerCase()
    if (['terverifikasi', 'lolos', 'disetujui'].includes(status)) return 'passed'
    if (['ditolak', 'tidak lolos', 'perlu perbaikan'].includes(status)) return 'failed'
    return 'unverified'
  }
  const verificationSummary = verificationCategories.map((category) => {
    const categoryRecords = focusRecords.filter((record) => getVerificationCategory(record) === category.id)
    return {
      ...category,
      groups: categoryRecords.length,
      budget: categoryRecords.reduce((sum, record) => sum + getRecordBudget(record), 0),
      percentage: focusRecords.length ? categoryRecords.length / focusRecords.length : 0,
    }
  })
  const normalizePokjaValue = (value) => {
    const text = String(value ?? '').trim()
    if (!text) return ''
    const lower = text.toLowerCase()
    if (lower.includes('produksi')) return 'Pokja Produksi'
    if (lower.includes('bibit')) return 'Pokja Bibit'
    if (lower.includes('pakan')) return 'Pokja Pakan'
    return text
  }
  const pokjaGroups = ['Pokja Produksi', 'Pokja Bibit', 'Pokja Pakan']
  const pokjaSummary = pokjaGroups.map((pokjaName) => {
    const recordsForPokja = focusRecords.filter((record) => {
      const pokjaValue = record.values?.pokja ?? record.values?.pokja_pengampu ?? ''
      return normalizePokjaValue(pokjaValue) === pokjaName
    })
    const summary = verificationCategories.map((category) => {
      const categoryRecords = recordsForPokja.filter((record) => getVerificationCategory(record) === category.id)
      return {
        ...category,
        groups: categoryRecords.length,
        budget: categoryRecords.reduce((sum, record) => sum + getRecordBudget(record), 0),
        percentage: recordsForPokja.length ? categoryRecords.length / recordsForPokja.length : 0,
      }
    })
    return {
      name: pokjaName,
      total: recordsForPokja.length,
      budget: recordsForPokja.reduce((sum, record) => sum + getRecordBudget(record), 0),
      summary,
    }
  })
  const totalPokjaGroups = pokjaSummary.reduce((sum, item) => sum + item.total, 0)
  const totalPokjaBudget = pokjaSummary.reduce((sum, item) => sum + item.budget, 0)
  const combinedPokjaSummary = pokjaSummary.map((pokja, index) => {
    const budgetShare = totalPokjaBudget ? pokja.budget / totalPokjaBudget : 0
    const groupShare = totalPokjaGroups ? pokja.total / totalPokjaGroups : 0
    return {
      id: `pokja-${index}`,
      label: pokja.name,
      color: pokjaColors[pokja.name] || defaultPokjaColors[pokja.name],
      totalGroups: pokja.total,
      totalBudget: pokja.budget,
      combinedShare: (budgetShare + groupShare) / 2,
    }
  }).sort((left, right) => right.totalBudget - left.totalBudget)
  const kabkotTotals = focusRecords.reduce((totals, record) => {
    const kabkot = String(record.values?.kabkot || 'Lainnya').trim() || 'Lainnya'
    totals[kabkot] = (totals[kabkot] || 0) + getRecordBudget(record)
    return totals
  }, {})
  const kabkotGroupCounts = focusRecords.reduce((counts, record) => {
    const kabkot = String(record.values?.kabkot || 'Lainnya').trim() || 'Lainnya'
    counts[kabkot] = (counts[kabkot] || 0) + 1
    return counts
  }, {})
  const chartData = Object.entries(kabkotTotals).sort(([, left], [, right]) => right - left)
  const topKabkot = chartData[0] || ['-', 0]
  const totalKabkotArea = chartData.reduce((sum, [, value]) => sum + Number(value || 0), 0)
  const avgKabkot = chartData.length ? totalKabkotArea / chartData.length : 0

  const recordsChange = formatShareChange(focusRecords.length, comparisonRecords.length)
  const approvedChange = formatShareChange(approved, comparisonRecords.filter((record) => record.status === 'Disetujui').length)
  const pendingChange = formatShareChange(pending, comparisonRecords.filter((record) => record.status !== 'Disetujui').length)
  const totalChange = formatShareChange(total, comparisonRecords.reduce((sum, record) => sum + getRecordBudget(record), 0))

  const insightLabel = selectedYear ? `${selectedYear}` : years[0] ? `Tahun ${years[0]}` : 'Semua data'

  const downloadPokjaMonitoring = async () => {
    const panel = pokjaPanelRef.current
    if (!panel) return
    setShowPokjaActions(false)
    setIsExportingPokja(true)
    try {
      await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))
      const { default: html2canvas } = await import('html2canvas')
      const canvas = await html2canvas(panel, {
        backgroundColor: '#ffffff',
        scale: 2,
        useCORS: true,
        ignoreElements: (element) => element.hasAttribute('data-html2canvas-ignore'),
      })
      const image = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'))
      if (!image) throw new Error('Gambar monitoring tidak dapat dibuat.')
      downloadFile(image, `monitoring-pokja-${selectedYear || 'semua-tahun'}.png`)
    } catch (error) {
      console.error('Gagal mengunduh gambar monitoring Pokja:', error)
      window.alert('Gagal mengunduh gambar monitoring Pokja.')
    } finally {
      setIsExportingPokja(false)
    }
  }

  return (
    <div className="content-wrap">
      <section className="page-heading overview-page-heading">
        <div>
          <p className="eyebrow">MONITORING PROGRAM</p>
          <h1>{t.welcome} <span className="heading-leaf">✦</span></h1>
          <p className="muted">Pantau perkembangan penyaluran hibah di seluruh wilayah Jawa Tengah.</p>
        </div>
        <div className="heading-actions">
          <label className="filter-inline">
            <span>Tahun Anggaran</span>
            <select value={selectedYear} onChange={(event) => setSelectedYear(event.target.value)}>
              <option value="">Semua</option>
              {years.map((year) => <option key={year} value={year}>{year}</option>)}
            </select>
          </label>
          <button className="secondary-btn" onClick={() => alert('Laporan siap diunduh pada integrasi berikutnya.')}><ArrowDownToLine size={16} /> Unduh laporan</button>
          <button className="primary-btn" onClick={() => onNavigate('database')}><Plus size={16} /> Pengajuan baru</button>
        </div>
      </section>
      <section className="stat-grid">
        <StatCard icon={UsersRound} label={t.records} value={focusRecords.length} change={recordsChange} tone="mint" />
        <StatCard icon={Check} label={t.approved} value={approved} change={approvedChange} tone="yellow" />
        <StatCard icon={Activity} label={t.pending} value={pending} change={pendingChange} tone="pink" negative />
        <StatCard icon={BudgetMoneyIcon} label={t.value} value={`Rp ${formatCurrency(total)}`} change={totalChange} tone="blue" />
      </section>

      <section className="dashboard-grid">
        <div className="panel chart-panel" style={{ '--budget-chart-color': budgetChartColor }}>
          <div className="panel-head">
            <div>
              <h2>Kumulatif pagu anggaran per kabupaten/kota</h2>
              <p className="muted">Data kumulatif anggaran per kabupaten/kota{selectedYear ? ` · ${selectedYear}` : ''}</p>
            </div>
            <div className="chart-panel-actions">
              <div className="budget-chart-color-wrap" ref={budgetColorPickerRef}>
                <button type="button" className="chart-color-trigger" aria-label="Atur warna diagram anggaran" title="Atur warna diagram" aria-expanded={showBudgetColorPicker} onClick={() => setShowBudgetColorPicker((current) => !current)}>
                  <Palette size={15} aria-hidden="true" />
                  <span style={{ backgroundColor: budgetChartColor }} />
                </button>
                {showBudgetColorPicker && <div className="budget-chart-color-menu" role="dialog" aria-label="Palet warna diagram anggaran">
                  <div className="pokja-actions-heading">
                    <strong>Warna diagram</strong>
                    <span>Kumulatif pagu anggaran</span>
                  </div>
                  <IroWheelColorPicker color={budgetChartColor} onChange={setBudgetChartColor} />
                  <div className="pokja-quick-colors" role="group" aria-label="Warna cepat diagram anggaran">
                    {pokjaQuickColors.map((color) => (
                      <button key={color} type="button" className="pokja-color-swatch" style={{ '--palette-color': color }} aria-label={`Pilih warna ${color}`} onClick={() => setBudgetChartColor(color)}>
                        <span />
                      </button>
                    ))}
                  </div>
                </div>}
              </div>
              <button className="filter-button">{selectedYear || 'Semua tahun'} <ChevronDown size={15} /></button>
            </div>
          </div>
          <BudgetBarChart chartData={chartData} totalBudget={total} groupCounts={kabkotGroupCounts} emptyMessage="Tidak ada data untuk tahun yang dipilih." />
        </div>

        <div className="panel insight-panel status-insight-panel">
          <div className="panel-head">
            <div>
              <h2>Status verifikasi kelompok</h2>
              <p className="muted">Persentase berdasarkan jumlah kelompok{selectedYear ? ` · ${selectedYear}` : ''}</p>
            </div>
            <MoreHorizontal size={16} aria-hidden="true" />
          </div>
          <div className="status-chart-content" onMouseLeave={() => setActivePieCategory(null)}>
            <div className="status-chart-layout">
              <VerificationStatusPie data={verificationSummary} totalCount={focusRecords.length} onSelect={setActivePieCategory} />
              <div className="status-pie-legend">
                {verificationSummary.map((category) => (
                  <button type="button" className={`status-legend-entry ${activePieCategory === category.id ? 'active' : ''}`} key={category.id} onMouseEnter={() => setActivePieCategory(category.id)} onFocus={() => setActivePieCategory(category.id)} onBlur={() => setActivePieCategory(null)}>
                    <span className="status-legend-swatch" style={{ '--status-color': category.color }} />
                    <span className="status-legend-label">{category.label}</span>
                    <strong>{formatPercentage(category.groups, focusRecords.length)}</strong>
                  </button>
                ))}
              </div>
            </div>
            {activePieCategory && verificationSummary.filter((category) => category.id === activePieCategory).map((category) => (
              <div className="status-chart-tooltip" key={category.id} role="tooltip">
                <strong>{category.label}</strong>
                <span>Jumlah kelompok <b>{formatCurrency(category.groups)}</b></span>
                <span>Jumlah anggaran <b>Rp {formatCurrency(category.budget)}</b></span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="panel pokja-monitor-panel" ref={pokjaPanelRef}>
        <div className="panel-head">
          <div>
            <h2>Monitoring berdasarkan Pokja</h2>
            <p className="muted">Distribusi status verifikasi per kelompok kerja{selectedYear ? ` · ${selectedYear}` : ''}</p>
          </div>
          <div className="pokja-actions-wrap" ref={pokjaActionsRef} data-html2canvas-ignore="true">
            <button type="button" className="pokja-actions-trigger" aria-label="Pengaturan diagram Pokja" aria-expanded={showPokjaActions} aria-haspopup="dialog" onClick={() => setShowPokjaActions((current) => !current)}>
              <MoreHorizontal size={18} aria-hidden="true" />
            </button>
            {showPokjaActions && <div className="pokja-actions-menu" role="dialog" aria-label="Pengaturan diagram monitoring Pokja">
              <div className="pokja-actions-heading">
                <strong>Warna diagram</strong>
                <span>Pilih warna tiap Pokja</span>
              </div>
              {pokjaGroups.map((pokjaName) => (
                <div className="pokja-color-row" key={pokjaName}>
                  <span>{pokjaName}</span>
                  <button type="button" className="pokja-color-current" style={{ '--current-color': pokjaColors[pokjaName] || defaultPokjaColors[pokjaName] }} aria-label={`Atur warna ${pokjaName}`} aria-expanded={activePokjaColor === pokjaName} onClick={() => setActivePokjaColor((current) => current === pokjaName ? null : pokjaName)}>
                    <span />
                    <ChevronDown size={12} aria-hidden="true" />
                  </button>
                </div>
              ))}
              {activePokjaColor && <div className="pokja-wheel-editor">
                <div className="pokja-wheel-heading">Warna {activePokjaColor}</div>
                <IroWheelColorPicker key={activePokjaColor} color={pokjaColors[activePokjaColor] || defaultPokjaColors[activePokjaColor]} onChange={(color) => setPokjaColors((current) => ({ ...current, [activePokjaColor]: color }))} />
                <div className="pokja-quick-colors" role="group" aria-label={`Warna cepat ${activePokjaColor}`}>
                  {pokjaQuickColors.map((color) => (
                    <button key={color} type="button" className="pokja-color-swatch" style={{ '--palette-color': color }} aria-label={`Pilih warna ${color}`} onClick={() => setPokjaColors((current) => ({ ...current, [activePokjaColor]: color }))}>
                      <span />
                    </button>
                  ))}
                </div>
              </div>}
              <button type="button" className="pokja-download-action" onClick={downloadPokjaMonitoring} disabled={isExportingPokja}>
                <ArrowDownToLine size={15} aria-hidden="true" />
                {isExportingPokja ? 'Menyiapkan gambar...' : 'Unduh gambar PNG'}
              </button>
            </div>}
          </div>
        </div>
        <div className="field-monitoring-block">
          <div className="field-monitoring-chart">
            <div className="field-monitoring-head">
              <h3>Monitoring bidang</h3>
              <span>Gabungan anggaran & jumlah kelompok</span>
            </div>
            <CombinedPokjaDonut data={combinedPokjaSummary} totalBudget={total} year={selectedYear} />
          </div>
        </div>
        <div className="pokja-donut-grid">
          {pokjaSummary.map((pokja) => (
            <div className="pokja-donut-card" key={pokja.name} style={{ '--pokja-card-color': pokjaColors[pokja.name] || defaultPokjaColors[pokja.name] }}>
              <h3>{pokja.name}</h3>
              <div className="pokja-chart-layout">
                <VerificationStatusPie data={pokja.summary} totalCount={pokja.total} onSelect={() => {}} />
                <ul className="pokja-legend">
                  {pokja.summary.map((category) => (
                    <li key={category.id} className="pokja-legend-row">
                      <span className="status-legend-swatch" style={{ '--status-color': category.color }} />
                      <span>{category.label}</span>
                      <strong>{pokja.total ? formatPercentage(category.groups, pokja.total) : '0%'}</strong>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </section>

      <VerificationBudgetMonitor records={records} fields={fields} getRecordYear={getRecordYear} getVerificationCategory={getVerificationCategory} getRecordBudget={getRecordBudget} normalizePokjaValue={normalizePokjaValue} years={years} pokjaGroups={pokjaGroups} year={selectedYear} />

      <div className="panel insight-panel full-width-panel">
        <div className="panel-head">
          <div>
            <h2>Ringkasan kinerja</h2>
            <p className="muted">Peringkat kontribusi anggaran berdasarkan tahun anggaran aktif.</p>
          </div>
          <MoreHorizontal size={16} />
        </div>
        <div className="insight-body">
          <div className="insight-highlight">
            <div className="insight-icon"><Sparkles size={18} /></div>
            <div>
              <strong>{chartData[0]?.[0] || 'Belum ada data'}</strong>
              <span>kabupaten/kota terbesar</span>
            </div>
            <span className="trend-up">Rp {formatCurrency(chartData[0]?.[1] || 0)}</span>
          </div>
          <div className="insight-metrics">
            <div><span>Wilayah terdata</span><strong>{chartData.length}</strong></div>
            <div><span>Rata-rata kab/kota</span><strong>Rp {formatCurrency(avgKabkot)}</strong></div>
            <div><span>Periode</span><strong>{insightLabel}</strong></div>
          </div>
          <div className="progress-line"><span style={{ width: `${Math.min(100, chartData.length ? (chartData[0][1] / totalKabkotArea) * 100 : 0)}%` }} /></div>
          <div className="insight-list">
            <div><span className="dot green-dot" />Pengajuan dengan dokumen lengkap<strong>24</strong></div>
            <div><span className="dot orange-dot" />Menunggu verifikasi<strong>{pending}</strong></div>
            <div><span className="dot blue-dot" />Wilayah aktif<strong>{chartData.length}</strong></div>
          </div>
          <div className="mini-grid">
            {chartData.slice(0, 4).map(([kabkot, value]) => (
              <div className="mini-metric" key={kabkot}>
                <span>{kabkot}</span>
                <strong>Rp {formatCurrency(value)}</strong>
              </div>
            ))}
          </div>
        </div>
      </div>

      <section className="panel recent-panel">
        <div className="panel-head">
          <div>
            <h2>{t.recent}</h2>
            <p className="muted">Aktivitas terbaru dalam sistem</p>
          </div>
          <button className="text-btn" onClick={() => onNavigate('database')}>Lihat semua <span>→</span></button>
        </div>
        <RecordTable records={records.slice(0, 4)} fields={fields} compact />
      </section>
    </div>
  )
}

function BudgetBarChart({ chartData, totalBudget, groupCounts, emptyMessage, ariaLabel = 'Diagram batang anggaran per kabupaten/kota' }) {
  const columnsStyle = { gridTemplateColumns: `repeat(${Math.max(chartData.length, 1)}, minmax(0, 1fr))` }
  const maximumBudget = Math.max(...chartData.map(([, value]) => Number(value || 0)), 1)
  const chartTicks = [maximumBudget, maximumBudget / 2, 0]

  return (
    <div className="chart-area">
      <div className="chart-y">{chartTicks.map((tick) => <span key={tick}>{tick === 0 ? '0' : `${formatCurrency(Math.round(tick / 1000000))} jt`}</span>)}</div>
      <div className={`chart-track ${chartData.length > 24 ? 'is-dense' : ''}`} role="region" aria-label={ariaLabel} tabIndex={0}>
        <div className="bars" style={columnsStyle}>
          {chartData.length ? chartData.map(([kabkot, budget]) => (
            <div className="bar-column" key={kabkot} tabIndex={0} role="img" aria-label={`${kabkot}, anggaran Rp ${formatCurrency(budget)}, ${formatBudgetShare(budget, totalBudget)} dari total anggaran, ${formatCurrency(groupCounts[kabkot] || 0)} kelompok`}>
              <div className="bar-tooltip" aria-hidden="true">
                <strong>{kabkot}</strong>
                <span>Anggaran <b>Rp {formatCurrency(budget)}</b></span>
                <span>Persentase dari total <b>{formatBudgetShare(budget, totalBudget)}</b></span>
                <span>Jumlah kelompok <b>{formatCurrency(groupCounts[kabkot] || 0)}</b></span>
              </div>
              <div className="bar-value" aria-hidden="true">{formatCompactBudget(budget)}</div>
              <div className="bar" style={{ height: `${Math.max(12, budget / maximumBudget * 130)}px` }} />
            </div>
          )) : <div className="empty-chart-state">{emptyMessage}</div>}
        </div>
        {chartData.length > 0 && <div className="chart-x-axis" style={columnsStyle} aria-hidden="true">
          {chartData.map(([kabkot]) => <div className="chart-x-label" key={kabkot}><span>{kabkot}</span></div>)}
        </div>}
      </div>
    </div>
  )
}

function VerificationBudgetMonitor({ records, fields, getRecordYear, getVerificationCategory, getRecordBudget, normalizePokjaValue, years, pokjaGroups, year }) {
  const [chartYear, setChartYear] = useState(year || '')
  const [selectedCommodity, setSelectedCommodity] = useState('')
  const [selectedKabkots, setSelectedKabkots] = useState(null)
  const [selectedPokja, setSelectedPokja] = useState('')
  const [visibleSeries, setVisibleSeries] = useState(['passed', 'failed', 'other'])
  const [activeTooltip, setActiveTooltip] = useState(null)
  const series = [
    { id: 'passed', label: 'Lolos', color: '#59a96d' },
    { id: 'failed', label: 'Tidak Lolos', color: '#c45c4a' },
    { id: 'other', label: 'Lainnya', color: '#a6aea8' },
  ]
  const commodityField = fields.find((field) => {
    const key = String(field.key || '').toLowerCase()
    const label = String(field.label || '').toLowerCase()
    return key.includes('komoditas') || label.includes('komoditas')
  })
  const getRecordCommodities = (record) => {
    const source = record.values?.komoditas_ternak ?? record.values?.komoditas ?? (commodityField ? record.values?.[commodityField.key] : '') ?? ''
    const values = Array.isArray(source) ? source : String(source).split(/[;,]/)
    return values.map((item) => String(item).trim()).filter(Boolean)
  }
  const yearRecords = chartYear ? records.filter((record) => getRecordYear(record) === chartYear) : records
  const availableCommodities = [...new Set(yearRecords.flatMap(getRecordCommodities))].sort((left, right) => left.localeCompare(right, 'id'))
  const availableKabkots = [...new Set(yearRecords.map((record) => String(record.values?.kabkot || 'Lainnya').trim() || 'Lainnya'))].sort((left, right) => left.localeCompare(right, 'id'))
  const filteredRecords = yearRecords.filter((record) => {
    const kabkot = String(record.values?.kabkot || 'Lainnya').trim() || 'Lainnya'
    const rawPokja = record.values?.pokja ?? record.values?.pokja_pengampu ?? ''
    const matchesKabkot = selectedKabkots === null || selectedKabkots.includes(kabkot)
    const matchesPokja = !selectedPokja || normalizePokjaValue(rawPokja) === selectedPokja
    const matchesCommodity = !selectedCommodity || getRecordCommodities(record).includes(selectedCommodity)
    return matchesKabkot && matchesPokja && matchesCommodity
  })
  const kabkotSummary = new Map()

  filteredRecords.forEach((record) => {
    const kabkot = String(record.values?.kabkot || 'Lainnya').trim() || 'Lainnya'
    const category = getVerificationCategory(record)
    const seriesId = category === 'passed' || category === 'failed' ? category : 'other'
    const budget = getRecordBudget(record)
    const locationSummary = kabkotSummary.get(kabkot) || Object.fromEntries(series.map((item) => [item.id, { budget: 0, groups: 0 }]))
    locationSummary[seriesId].budget += budget
    locationSummary[seriesId].groups += 1
    kabkotSummary.set(kabkot, locationSummary)
  })

  const chartData = [...kabkotSummary.entries()]
    .map(([kabkot, values]) => ({ kabkot, values, total: series.reduce((sum, item) => sum + values[item.id].budget, 0) }))
    .sort((left, right) => right.total - left.total)
  const seriesTotals = series.map((item) => ({
    ...item,
    budget: chartData.reduce((sum, city) => sum + city.values[item.id].budget, 0),
    groups: chartData.reduce((sum, city) => sum + city.values[item.id].groups, 0),
  }))
  const activeSeries = series.filter((item) => visibleSeries.includes(item.id))
  const totalGroups = seriesTotals.filter((item) => visibleSeries.includes(item.id)).reduce((sum, item) => sum + item.groups, 0)
  const maxBudget = Math.max(1, ...chartData.flatMap((city) => activeSeries.map((item) => city.values[item.id].budget)))
  const chartTicks = [maxBudget, maxBudget / 2, 0]
  const chartWidth = Math.max(chartData.length * 52, 1)
  const chartColumnsStyle = { gridTemplateColumns: `repeat(${Math.max(chartData.length, 1)}, minmax(0, 1fr))`, minWidth: `${chartWidth}px` }
  const selectedCount = selectedKabkots === null ? availableKabkots.length : selectedKabkots.length
  const showBarTooltip = (kabkot, item, result, event) => {
    const bounds = event.currentTarget.getBoundingClientRect()
    const halfWidth = Math.min(110, window.innerWidth / 2 - 16)
    const pointerX = bounds.left + bounds.width / 2
    setActiveTooltip({
      kabkot,
      item,
      result,
      categoryTotal: seriesTotals.find((total) => total.id === item.id)?.budget || 0,
      left: Math.min(Math.max(pointerX, halfWidth + 16), window.innerWidth - halfWidth - 16),
      top: Math.max(100, bounds.top - 8),
    })
  }
  const toggleKabkot = (kabkot, checked) => {
    const current = selectedKabkots === null ? availableKabkots : selectedKabkots
    const next = checked ? [...new Set([...current, kabkot])] : current.filter((item) => item !== kabkot)
    setSelectedKabkots(next.length === availableKabkots.length ? null : next)
  }
  const toggleSeries = (seriesId, checked) => {
    setActiveTooltip(null)
    setVisibleSeries((current) => checked ? [...current, seriesId] : current.filter((item) => item !== seriesId))
  }

  useEffect(() => {
    setChartYear(year || '')
    setSelectedCommodity('')
    setSelectedKabkots(null)
  }, [year])

  return (
    <section className="panel verification-budget-panel">
      <div className="panel-head verification-budget-head">
        <div>
          <h2>Monitoring pagu anggaran berdasarkan hasil verifikasi</h2>
          <p className="muted">Perbandingan hasil verifikasi per kabupaten/kota</p>
        </div>
        <div className="verification-budget-filters">
          <label className="verification-filter-control">
            <span>Komoditas</span>
            <select value={selectedCommodity} onChange={(event) => setSelectedCommodity(event.target.value)} aria-label="Filter komoditas">
              <option value="">Semua komoditas</option>
              {availableCommodities.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </label>
          <label className="verification-filter-control">
            <span>Tahun</span>
            <select value={chartYear} onChange={(event) => { setChartYear(event.target.value); setSelectedKabkots(null) }} aria-label="Filter tahun anggaran">
              <option value="">Semua tahun</option>
              {years.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </label>
          <details className="kabkot-checklist">
            <summary aria-label="Filter kabupaten atau kota">{selectedCount === availableKabkots.length ? 'Semua Kab/Kota' : `${selectedCount} Kab/Kota`} <ChevronDown size={13} /></summary>
            <div className="kabkot-checklist-menu">
              <div className="kabkot-checklist-actions">
                <button type="button" onClick={() => setSelectedKabkots(null)}>Pilih semua</button>
                <button type="button" onClick={() => setSelectedKabkots([])}>Tidak pilih semua</button>
              </div>
              {availableKabkots.map((kabkot) => (
                <label key={kabkot}>
                  <input type="checkbox" checked={selectedKabkots === null || selectedKabkots.includes(kabkot)} onChange={(event) => toggleKabkot(kabkot, event.target.checked)} />
                  <span>{kabkot}</span>
                </label>
              ))}
            </div>
          </details>
          <label className="verification-filter-control">
            <span>Pokja</span>
            <select value={selectedPokja} onChange={(event) => setSelectedPokja(event.target.value)} aria-label="Filter Pokja">
              <option value="">Semua Pokja</option>
              {pokjaGroups.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </label>
        </div>
      </div>
      <div className="verification-budget-summary">
        <span>{formatCurrency(selectedCount)} kabupaten/kota · {formatCurrency(totalGroups)} kelompok</span>
        <div className="verification-series-legend" role="group" aria-label="Tampilkan seri hasil verifikasi">
          {seriesTotals.map((item) => <label className="verification-series-toggle" key={item.id}>
            <input type="checkbox" checked={visibleSeries.includes(item.id)} style={{ '--series-color': item.color }} onChange={(event) => toggleSeries(item.id, event.target.checked)} />
            <span>{item.label}</span>
          </label>)}
        </div>
      </div>
      <div className="chart-area verification-chart-area">
        <div className="chart-y">{chartTicks.map((tick) => <span key={tick}>{tick === 0 ? '0' : `${formatCurrency(Math.round(tick / 1000000))} jt`}</span>)}</div>
        <div className="chart-track verification-chart-track" role="region" aria-label="Diagram batang anggaran lolos, tidak lolos, dan lainnya per kabupaten/kota" tabIndex={0}>
          {chartData.length && activeSeries.length ? <>
            <div className="verification-bars" style={chartColumnsStyle}>
              {chartData.map(({ kabkot, values }) => (
                <div className="verification-city-group" key={kabkot}>
                  <div className="verification-city-bars">
                    {activeSeries.map((item) => {
                      const result = values[item.id]
                      return <div className="verification-bar-column" key={item.id} tabIndex={0} role="img" aria-label={`${kabkot}, ${item.label}, anggaran Rp ${formatCurrency(result.budget)}, ${formatCurrency(result.groups)} kelompok`} onMouseEnter={(event) => showBarTooltip(kabkot, item, result, event)} onMouseLeave={() => setActiveTooltip(null)} onFocus={(event) => showBarTooltip(kabkot, item, result, event)} onBlur={() => setActiveTooltip(null)}>
                        <div className="verification-bar" style={{ '--series-color': item.color, height: result.budget ? `${Math.max(4, result.budget / maxBudget * 130)}px` : '0px' }} />
                      </div>
                    })}
                  </div>
                </div>
              ))}
            </div>
            <div className="chart-x-axis verification-chart-x-axis" style={chartColumnsStyle} aria-hidden="true">
              {chartData.map(({ kabkot }) => <div className="chart-x-label" key={kabkot}><span>{kabkot}</span></div>)}
            </div>
          </> : <div className="verification-chart-empty">{chartData.length ? 'Pilih setidaknya satu hasil verifikasi.' : 'Tidak ada data untuk filter yang dipilih.'}</div>}
        </div>
      </div>
      {activeTooltip && <div className="bar-tooltip verification-bar-tooltip-overlay" data-series={activeTooltip.item.id} role="tooltip" style={{ left: activeTooltip.left, top: activeTooltip.top }}>
        <strong>{activeTooltip.kabkot} · {activeTooltip.item.label}</strong>
        <span>Anggaran <b>Rp {formatCurrency(activeTooltip.result.budget)}</b></span>
        <span>Persentase kategori <b>{formatBudgetShare(activeTooltip.result.budget, activeTooltip.categoryTotal)}</b></span>
        <span>Jumlah kelompok <b>{formatCurrency(activeTooltip.result.groups)}</b></span>
      </div>}
    </section>
  )
}

function VerificationStatusPie({ data, totalCount, onSelect }) {
  const radius = 66
  const circumference = 2 * Math.PI * radius
  const wrapperRef = useRef(null)
  const [tooltip, setTooltip] = useState(null)
  let offset = 0
  const showTooltip = (category, event) => {
    const bounds = wrapperRef.current?.getBoundingClientRect()
    if (!bounds) return
    const halfWidth = Math.max(0, Math.min(110, bounds.width / 2 - 8))
    const pointerX = event?.clientX != null ? event.clientX - bounds.left : bounds.width / 2
    const pointerY = event?.clientY != null ? event.clientY - bounds.top : 110
    setTooltip({
      category,
      x: Math.min(Math.max(pointerX, halfWidth), bounds.width - halfWidth),
      y: Math.max(pointerY, 64),
    })
    onSelect(category.id)
  }

  return (
    <div className="donut-tooltip-wrap" ref={wrapperRef} onMouseLeave={() => setTooltip(null)}>
      {tooltip && <div className="donut-tooltip" role="tooltip" style={{ left: tooltip.x, top: tooltip.y }}>
        <strong>{tooltip.category.label}</strong>
        <span>Persentase <b>{formatPercentage(tooltip.category.groups, totalCount)}</b></span>
        <span>Jumlah kelompok <b>{formatCurrency(tooltip.category.groups)}</b></span>
        <span>Jumlah anggaran <b>Rp {formatCurrency(tooltip.category.budget)}</b></span>
      </div>}
      <svg className="status-pie" viewBox="0 0 160 160" role="img" aria-label="Diagram persentase status verifikasi kelompok">
        <circle cx="80" cy="80" r={radius} fill="none" stroke="var(--line)" strokeWidth="23" />
        {data.map((category) => {
          const segmentLength = circumference * category.percentage
          const visibleLength = Math.max(0, segmentLength - (category.groups ? 2 : 0))
          const currentOffset = offset
          offset += segmentLength
          if (!category.groups) return null
          return <circle key={category.id} className="status-pie-segment" cx="80" cy="80" r={radius} fill="none" stroke={category.color} strokeWidth="23" strokeDasharray={`${visibleLength} ${circumference - visibleLength}`} strokeDashoffset={-currentOffset} transform="rotate(-90 80 80)" tabIndex={0} role="button" aria-label={`${category.label}: ${formatPercentage(category.groups, totalCount)}, ${formatCurrency(category.groups)} kelompok, anggaran Rp ${formatCurrency(category.budget)}`} onMouseEnter={(event) => showTooltip(category, event)} onMouseMove={(event) => showTooltip(category, event)} onFocus={() => showTooltip(category)} onBlur={() => setTooltip(null)} />
        })}
        <text className="status-pie-total" x="80" y="78" textAnchor="middle">{formatCurrency(totalCount)}</text>
        <text className="status-pie-caption" x="80" y="96" textAnchor="middle">KELOMPOK</text>
      </svg>
    </div>
  )
}

function CombinedPokjaDonut({ data, totalBudget, year }) {
  if (!data.length) return null
  const radius = 60
  const circumference = 2 * Math.PI * radius
  const totalShare = data.reduce((sum, item) => sum + item.combinedShare, 0) || 1
  const wrapperRef = useRef(null)
  const [tooltip, setTooltip] = useState(null)
  const [selectedId, setSelectedId] = useState(null)
  const selectedItem = data.find((item) => item.id === selectedId)
  let offset = 0
  const showTooltip = (item, event) => {
    const bounds = wrapperRef.current?.getBoundingClientRect()
    if (!bounds) return
    const halfWidth = Math.max(0, Math.min(110, bounds.width / 2 - 8))
    const pointerX = event?.clientX != null ? event.clientX - bounds.left : bounds.width / 2
    const pointerY = event?.clientY != null ? event.clientY - bounds.top : 110
    setTooltip({
      item,
      x: Math.min(Math.max(pointerX, halfWidth), bounds.width - halfWidth),
      y: Math.max(pointerY, 64),
    })
  }

  return (
    <div className="field-monitoring-layout">
      <div className="donut-tooltip-wrap combined-donut-tooltip-wrap" ref={wrapperRef} onMouseLeave={() => setTooltip(null)}>
        {tooltip && <div className="donut-tooltip" role="tooltip" style={{ left: tooltip.x, top: tooltip.y }}>
          <strong>{tooltip.item.label}</strong>
          <span>Persentase anggaran <b>{formatPercentage(tooltip.item.totalBudget, totalBudget)}</b></span>
          <span>Jumlah kelompok <b>{formatCurrency(tooltip.item.totalGroups)}</b></span>
          <span>Jumlah anggaran <b>Rp {formatCurrency(tooltip.item.totalBudget)}</b></span>
        </div>}
        <svg className="field-monitoring-donut" viewBox="0 0 180 180" role="img" aria-label="Diagram gabungan anggaran dan jumlah kelompok per pokja">
          <circle cx="90" cy="90" r={radius} fill="none" stroke="var(--line)" strokeWidth="22" />
          {data.map((item) => {
            const segmentLength = circumference * (item.combinedShare / totalShare)
            const currentOffset = offset
            offset += segmentLength
            return <circle key={item.id} cx="90" cy="90" r={radius} fill="none" stroke={item.color} strokeWidth="22" strokeDasharray={`${Math.max(0, segmentLength - 2)} ${circumference - Math.max(0, segmentLength - 2)}`} strokeDashoffset={-currentOffset} transform="rotate(-90 90 90)" className="combined-pokja-segment" tabIndex={0} role="button" aria-pressed={selectedId === item.id} aria-label={`${item.label}: klik untuk melihat rincian`} onMouseEnter={(event) => showTooltip(item, event)} onMouseMove={(event) => showTooltip(item, event)} onClick={(event) => { setSelectedId(item.id); showTooltip(item, event) }} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); setSelectedId(item.id) } }} onFocus={() => showTooltip(item)} onBlur={() => setTooltip(null)} />
          })}
          <text x="90" y="82" textAnchor="middle" className="field-monitoring-total">{data.length}</text>
          <text x="90" y="102" textAnchor="middle" className="field-monitoring-caption">POKJA</text>
        </svg>
      </div>
      <ul className="field-monitoring-legend" aria-label="Legenda Pokja">
        {data.map((item) => (
          <li key={item.id}>
            <button type="button" aria-pressed={selectedId === item.id} onClick={() => setSelectedId(item.id)}>
              <span className="status-legend-swatch" style={{ '--status-color': item.color }} />
              <span>{item.label}</span>
              <strong>Rp {formatCurrency(item.totalBudget)}</strong>
            </button>
          </li>
        ))}
      </ul>
      <div className={`field-monitoring-preview ${selectedItem ? 'has-selection' : ''}`} aria-live="polite">
        {selectedItem ? <>
          <div className="field-preview-heading">
            <span className="status-legend-swatch" style={{ '--status-color': selectedItem.color }} />
            <div>
              <span className="field-preview-year">Tahun anggaran {year || 'semua tahun'}</span>
              <h4>{selectedItem.label}</h4>
            </div>
          </div>
          <div className="field-preview-metrics">
            <div><span>Jumlah kelompok</span><strong>{formatCurrency(selectedItem.totalGroups)}</strong></div>
            <div><span>Jumlah anggaran</span><strong>Rp {formatCurrency(selectedItem.totalBudget)}</strong></div>
            <div><span>Persentase anggaran Pokja</span><strong>{formatPercentage(selectedItem.totalBudget, totalBudget)}</strong></div>
          </div>
        </> : <p className="field-preview-empty">Klik salah satu irisan diagram untuk melihat rincian Pokja.</p>}
      </div>
    </div>
  )
}

function IroWheelColorPicker({ color, onChange }) {
  const match = /^#([0-9a-f]{6})([0-9a-f]{2})?$/i.exec(color || '')
  const hexColor = match ? `#${match[1]}` : '#59a96d'
  const alpha = match?.[2] ? Number.parseInt(match[2], 16) : 255
  const transparency = Math.round((255 - alpha) / 255 * 100)
  const alphaHex = (percent) => Math.round((100 - percent) / 100 * 255).toString(16).padStart(2, '0')

  return <div className="native-dashboard-color-picker">
    <label className="dashboard-color-choice"><span>Warna</span><span className="dashboard-color-input-wrap"><input type="color" aria-label="Pilih warna diagram" value={hexColor} onChange={(event) => onChange(`${event.target.value}${alpha.toString(16).padStart(2, '0')}`)} /><code>{hexColor.toUpperCase()}</code></span></label>
    <label className="dashboard-alpha-control"><span>Transparansi <output>{transparency}%</output></span><input type="range" min="0" max="100" step="1" value={transparency} aria-label="Atur transparansi warna diagram" onChange={(event) => onChange(`${hexColor}${alphaHex(Number(event.target.value))}`)} /></label>
  </div>
}

function BudgetMoneyIcon({ size }) { return <span className="budget-money-icon" style={{ '--icon-size': `${size}px` }} aria-hidden="true"><Banknote className="budget-money-note" /><Coins className="budget-money-coins" /></span> }

function StatCard({ icon: Icon, label, value, change, tone, negative }) { return <div className={`stat-card stat-card-${tone}`}><div className={`stat-icon ${tone}`}><Icon size={19} /></div><div className="stat-body"><span>{label}</span><strong>{value}</strong><small className={negative ? 'negative' : ''}><span>{negative ? '↓' : '↑'}</span> {change} <em>dari bulan lalu</em></small></div><MoreHorizontal className="stat-more" size={17} /></div> }
function VerificationFieldsPage({ fields, setFields }) {
  const [editing, setEditing] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [draggedId, setDraggedId] = useState(null)
  const [dragOverId, setDragOverId] = useState(null)
  const save = (field) => {
    setFields((current) => editing
      ? current.map((item) => item.id === editing.id ? { ...field, id: editing.id, order: item.order } : item)
      : [...current, { ...field, id: `vf${Date.now()}`, order: current.length }])
    setEditing(null)
    setShowForm(false)
  }
  const remove = (field) => {
    if (!window.confirm(`Hapus pertanyaan "${field.label}" dari form verifikasi?`)) return
    setFields((current) => current.filter((item) => item.id !== field.id).map((item, order) => ({ ...item, order })))
  }
  const toggle = (field) => setFields((current) => current.map((item) => item.id === field.id ? { ...item, active: !item.active } : item))
  const move = (index, direction) => setFields((current) => {
    const next = [...current]
    const target = index + direction
    if (target < 0 || target >= next.length) return current
    ;[next[index], next[target]] = [next[target], next[index]]
    return next.map((field, order) => ({ ...field, order }))
  })
  const reorder = (targetId) => {
    if (!draggedId || draggedId === targetId) return
    setFields((current) => {
      const next = [...current]
      const from = next.findIndex((field) => field.id === draggedId)
      const to = next.findIndex((field) => field.id === targetId)
      if (from < 0 || to < 0) return current
      const [dragged] = next.splice(from, 1)
      next.splice(to, 0, dragged)
      return next.map((field, order) => ({ ...field, order }))
    })
  }
  const duplicate = (field) => {
    const baseKey = `${field.key}_copy`
    let key = baseKey
    let suffix = 2
    while (fields.some((item) => item.key === key)) key = `${baseKey}_${suffix++}`
    const index = fields.findIndex((item) => item.id === field.id)
    const copy = { ...field, id: `vf${Date.now()}`, key, label: `${field.label} (salinan)` }
    setFields((current) => {
      const next = [...current]
      next.splice(index + 1, 0, copy)
      return next.map((item, order) => ({ ...item, order }))
    })
  }
  const exportConfig = () => {
    const payload = { app: 'E-Hibah', type: 'verification-field-configuration', version: 1, exportedAt: new Date().toISOString(), fields }
    downloadFile(new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' }), `e-hibah-verification-config-${new Date().toISOString().slice(0, 10)}.json`)
  }
  const importConfig = async (event) => {
    const input = event.currentTarget
    const file = input.files?.[0]
    input.value = ''
    if (!file) return
    try {
      const payload = JSON.parse(await file.text())
      const imported = Array.isArray(payload) ? payload : payload?.fields
      const valid = Array.isArray(imported) && imported.length > 0 && imported.every((field) => field && typeof field.label === 'string' && typeof field.key === 'string' && typeLabels[field.type])
      if (!valid) throw new Error('Format konfigurasi form verifikasi tidak valid.')
      if (!window.confirm('Impor konfigurasi ini dan mengganti konfigurasi form verifikasi saat ini?')) return
      setFields(imported.map((field, index) => ({ ...field, id: field.id || `vf${Date.now()}_${index}`, order: index })))
    } catch (error) {
      window.alert(error.message || 'File konfigurasi tidak dapat dibaca.')
    }
  }
  const actions = <div className="verification-config-actions"><button className="secondary-btn" onClick={() => setShowPreview(true)}><Eye size={16} /> Preview form</button><label className="secondary-btn"><Upload size={16} /> Import<input className="visually-hidden" type="file" accept="application/json,.json" onChange={importConfig} /></label><button className="secondary-btn" onClick={exportConfig}><ArrowDownToLine size={16} /> Export</button><button className="primary-btn" onClick={() => { setEditing(null); setShowForm(true) }}><Plus size={16} /> Tambah pertanyaan</button></div>
  return <><section className="page-heading compact-heading"><div><p className="eyebrow">PENGATURAN VERIFIKASI</p><h1>Config Form Verifikasi</h1><p className="muted">Atur pertanyaan yang muncul saat memverifikasi pengajuan Hibah.</p></div>{actions}</section><div className="field-summary"><div><ClipboardCheck size={18} /><span><strong>{fields.length}</strong> Total pertanyaan</span></div><div><Check size={18} /><span><strong>{fields.filter((field) => field.active).length}</strong> Pertanyaan aktif</span></div></div><section className="panel fields-panel"><div className="panel-head"><div><h2>Form verifikasi data kelompok</h2><p className="muted">Seret handle untuk mengubah urutan. Pertanyaan aktif tampil di popup verifikasi.</p></div></div><div className="field-list verification-field-list">{fields.map((field, index) => <div className={`field-row ${!field.active ? 'inactive' : ''} ${dragOverId === field.id ? 'drag-over' : ''}`} key={field.id} onDragOver={(event) => { event.preventDefault(); setDragOverId(field.id) }} onDrop={(event) => { event.preventDefault(); reorder(field.id); setDraggedId(null); setDragOverId(null) }} onDragLeave={() => setDragOverId((current) => current === field.id ? null : current)} onDragEnd={() => { reorder(dragOverId); setDraggedId(null); setDragOverId(null) }}><button className="drag-handle verification-drag-handle" draggable onDragStart={(event) => { event.dataTransfer.effectAllowed = 'move'; setDraggedId(field.id) }} title="Seret untuk mengubah urutan" aria-label={`Seret ${field.label}`}><span /><span /><span /></button><div className="field-order">{String(index + 1).padStart(2, '0')}</div><div className="field-info"><strong>{field.label}</strong><small>{field.key} · {typeLabels[field.type]}</small></div><span className="field-type">{typeLabels[field.type]}</span>{field.required && <span className="required-tag">Wajib</span>}<button className={`toggle ${field.active ? 'on' : ''}`} onClick={() => toggle(field)} aria-label={`${field.active ? 'Nonaktifkan' : 'Aktifkan'} ${field.label}`}><span /></button><div className="field-actions"><button onClick={() => duplicate(field)} title="Duplikat pertanyaan" aria-label={`Duplikat ${field.label}`}><Copy size={14} /></button><button onClick={() => { setEditing(field); setShowForm(true) }} title="Edit pertanyaan" aria-label={`Edit ${field.label}`}><Pencil size={14} /></button><button onClick={() => remove(field)} title="Hapus pertanyaan" aria-label={`Hapus ${field.label}`}><Trash2 size={14} /></button></div></div>)}{!fields.length && <div className="empty-state">Belum ada pertanyaan. Tambahkan pertanyaan untuk membentuk Form Verifikasi.</div>}</div></section>{showForm && <VerificationFieldForm field={editing} onClose={() => { setShowForm(false); setEditing(null) }} onSave={save} />}{showPreview && <VerificationFormPreview fields={fields} onClose={() => setShowPreview(false)} />}</>
}

function VerificationFormPreview({ fields, onClose }) {
  const activeFields = fields.filter((field) => field.active)
  const [values, setValues] = useState(() => Object.fromEntries(activeFields.map((field) => [field.key, field.type === 'checklist' ? [] : ''])))
  const update = (key, value) => setValues((current) => ({ ...current, [key]: value }))
  return <div className="modal-backdrop"><div className="modal verification-modal"><div className="modal-head"><div><p className="eyebrow">PRATINJAU</p><h2>Form Verifikasi Data Kelompok</h2><p className="muted">Contoh tampilan berdasarkan pertanyaan aktif saat ini.</p></div><button className="close-btn" onClick={onClose} aria-label="Tutup preview"><X size={19} /></button></div><div className="verification-controls verification-preview-controls">{activeFields.map((field) => <DynamicInputProfessional key={field.id} field={field} value={values[field.key]} onChange={(value) => update(field.key, value)} />)}{!activeFields.length && <div className="empty-state">Tidak ada pertanyaan aktif untuk ditampilkan.</div>}</div><div className="modal-foot"><button className="secondary-btn" onClick={onClose}>Tutup preview</button><button className="primary-btn" onClick={onClose}><Check size={16} /> Selesai</button></div></div></div>
}

function VerificationFieldForm({ field, onClose, onSave }) {
  const [value, setValue] = useState(field || { label: '', key: '', type: 'text', options: '', placeholder: '', description: '', required: false, active: true })
  const update = (key, next) => setValue((current) => ({ ...current, [key]: next }))
  return <div className="modal-backdrop">
    <div className="modal field-modal">
      <div className="modal-head"><div><p className="eyebrow">CONFIG FORM VERIFIKASI</p><h2>{field ? 'Edit pertanyaan' : 'Tambah pertanyaan'}</h2></div><button className="close-btn" onClick={onClose} aria-label="Tutup"><X size={19} /></button></div>
      <form onSubmit={(event) => { event.preventDefault(); onSave(value) }}>
        <div className="dynamic-form">
          <label className="field-group full-span">Label pertanyaan <b>*</b><textarea rows="4" required value={value.label} onChange={(event) => update('label', event.target.value)} placeholder="Contoh: Kesesuaian dokumen" /></label>
          <label className="field-group">Field key <b>*</b><input required value={value.key} onChange={(event) => update('key', event.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_'))} placeholder="kesesuaian_dokumen" /></label>
          <label className="field-group">Tipe jawaban <b>*</b><select value={value.type} onChange={(event) => update('type', event.target.value)}>{Object.entries(typeLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label>
          <label className="field-group">Placeholder<input value={value.placeholder || ''} onChange={(event) => update('placeholder', event.target.value)} placeholder="Contoh: Masukkan catatan" /></label>
          <label className="field-group full-span">Deskripsi<textarea rows="3" value={value.description || ''} onChange={(event) => update('description', event.target.value)} placeholder="Petunjuk untuk verifikator" /></label>
          {['checklist', 'list'].includes(value.type) && <label className="field-group full-span">Daftar opsi <b>*</b><textarea rows="4" required value={value.options || ''} onChange={(event) => update('options', event.target.value)} placeholder="Pisahkan opsi dengan titik koma (;)" /></label>}
          <label className="switch-label"><input type="checkbox" checked={Boolean(value.required)} onChange={(event) => update('required', event.target.checked)} /><span>Jawaban wajib diisi</span></label>
        </div>
        <div className="modal-foot"><button type="button" className="secondary-btn" onClick={onClose}>Batal</button><button type="submit" className="primary-btn"><Check size={16} /> Simpan pertanyaan</button></div>
      </form>
    </div>
  </div>
}

function VerificationFormModal({ record, hibahFields, fields, verification, onClose, onSave }) {
  const [values, setValues] = useState(() => {
    const initialValues = verification?.values || Object.fromEntries(fields.map((field) => [field.key, field.type === 'checklist' ? [] : '']))
    const savedChecklist = initialValues.verificationChecklist
    return {
      ...initialValues,
      verificationChecklist: {
        selected: Array.isArray(savedChecklist?.selected) ? savedChecklist.selected : [],
        other: typeof savedChecklist?.other === 'string' ? savedChecklist.other : '',
      },
    }
  })
  const [status, setStatus] = useState(verification?.status || '')
  const visibleFields = fields.filter((field) => field.active)
  const sourceFields = hibahFields.filter((field) => field.active && !['header', 'separator'].includes(field.type))
  const checklistOptions = ['Administrasi Dokumen', 'Verifikasi Faktual (cek lapangan)', 'Lain-lain']
  const selectedChecks = values.verificationChecklist.selected
  const budgetKeys = ['nilai_bantuan', 'pagu_anggaran', 'anggaran', 'anggaran_bantuan', 'nilai_anggaran', 'nominal_bantuan', 'jumlah_bantuan']
  const budgetKey = budgetKeys.find((key) => record.values?.[key] !== undefined && record.values[key] !== null && record.values[key] !== '')
    || hibahFields.find((field) => {
      const key = String(field.key || '').toLowerCase()
      const label = String(field.label || '').toLowerCase()
      return !key.includes('tahun') && !label.includes('tahun') && (field.type === 'currency' || ['anggaran', 'pagu', 'nilai', 'bantuan', 'nominal'].some((term) => key.includes(term) || label.includes(term)))
    })?.key
  const budgetAmount = formatBudget(record.values?.[budgetKey]) || '-'
  const update = (key, value) => setValues((current) => ({ ...current, [key]: value }))
  const updateChecklist = (key, value) => setValues((current) => ({
    ...current,
    verificationChecklist: { ...current.verificationChecklist, [key]: value },
  }))
  const submit = (event) => {
    event.preventDefault()
    if (selectedChecks.includes('Lain-lain') && !values.verificationChecklist.other.trim()) {
      window.alert('Lengkapi keterangan untuk pilihan Lain-lain.')
      return
    }
    const missing = visibleFields.find((field) => field.required && (field.type === 'checklist' ? !values[field.key]?.length : !String(values[field.key] ?? '').trim()))
    if (missing) {
      window.alert(`Pertanyaan "${missing.label}" wajib diisi.`)
      return
    }
    onSave({ id: verification?.id, hibahId: record.id, noId: record.noId, status, values })
  }
  return (
    <div className="modal-backdrop">
      <div className="modal verification-modal">
        <div className="modal-head verification-modal-head">
          <div className="verification-modal-heading">
            <div>
              <p className="eyebrow">FORM VERIFIKASI</p>
              <h2>{verification ? 'Perbarui verifikasi' : 'Verifikasi data kelompok'}</h2>
              <p className="muted">{record.noId}</p>
            </div>
            <div className="verification-group-meta">
              <strong>{record.values.nama_kelompok || 'Kelompok hibah'}</strong>
              <b>{budgetAmount}</b>
            </div>
          </div>
          <button className="close-btn" onClick={onClose} aria-label="Tutup"><X size={19} /></button>
        </div>
        <form onSubmit={submit}>
          <div className="verification-form-content">
            <section className="verification-source">
              <h3>Data pengajuan dari Database Hibah</h3>
              <div className="verification-source-grid">
                {sourceFields.map((field) => <div key={field.id}><span>{field.label}</span><strong>{formatVerificationValue(record.values[field.key], field)}</strong></div>)}
              </div>
            </section>
            <div className="verification-controls">
              <label className="field-group">
                Hasil verifikasi
                <select value={status} onChange={(event) => setStatus(event.target.value)}>
                  <option value="">Pilih hasil (opsional)</option>
                  <option>Terverifikasi</option>
                  <option>Proses Berlangsung</option>
                  <option>Perlu Perbaikan</option>
                  <option>Ditolak</option>
                </select>
              </label>
              <div className="verification-checklist" role="group" aria-labelledby="verification-checklist-label">
                <strong id="verification-checklist-label">Verifikasi:</strong>
                <div className="check-grid">
                  {checklistOptions.map((option) => (
                    <label className="check-option" key={option}>
                      <input
                        type="checkbox"
                        checked={selectedChecks.includes(option)}
                        onChange={(event) => updateChecklist('selected', event.target.checked ? [...selectedChecks, option] : selectedChecks.filter((item) => item !== option))}
                      />
                      <span>{option}</span>
                    </label>
                  ))}
                </div>
                {selectedChecks.includes('Lain-lain') && (
                  <label className="field-group verification-other">
                    Keterangan Lain-lain <b>*</b>
                    <textarea rows="3" required value={values.verificationChecklist.other} onChange={(event) => updateChecklist('other', event.target.value)} placeholder="Tuliskan keterangan verifikasi" />
                  </label>
                )}
              </div>
              {visibleFields.map((field) => <DynamicInputProfessional key={field.id} field={field} value={values[field.key]} onChange={(value) => update(field.key, value)} />)}
              {!visibleFields.length && <p className="muted">Belum ada pertanyaan aktif pada Config Form Verifikasi.</p>}
            </div>
          </div>
          <div className="modal-foot">
            <button type="button" className="secondary-btn" onClick={onClose}>Batal</button>
            <button type="submit" className="primary-btn"><ClipboardCheck size={16} /> {verification ? 'Simpan perubahan' : 'Simpan verifikasi'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

function formatVerificationValue(value, field) {
  if (value === undefined || value === null || value === '') return '-'
  const key = String(field?.key ?? '').toLowerCase()
  const label = String(field?.label ?? '').toLowerCase()
  const isYearField = key.includes('tahun') || label.includes('tahun')
  if (isYearField) return String(value).replace(/\D/g, '')
  if (field.type === 'currency' || (field.key.includes('anggaran') && !isYearField) || field.key.includes('nilai')) return formatBudget(value)
  return Array.isArray(value) ? value.join(', ') : String(value)
}

function VerificationDatabasePage({ records, verifications, setVerifications, verificationFields, hibahFields, user }) {
  const [search, setSearch] = useState('')
  const [editing, setEditing] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [isImporting, setIsImporting] = useState(false)
  const filtered = verifications.filter((item) => `${item.noId} ${item.hibahSnapshot?.nama_kelompok || ''} ${item.status} ${item.verifiedByName || ''}`.toLowerCase().includes(search.toLowerCase()))
  const exportVerifications = () => {
    const payload = { app: 'E-Hibah', type: 'verification-records', version: 1, exportedAt: new Date().toISOString(), verifications: filtered }
    downloadFile(new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' }), `e-hibah-verifikasi-${new Date().toISOString().slice(0, 10)}.json`)
  }
  const importVerifications = async (event) => {
    const input = event.currentTarget
    const file = input.files?.[0]
    input.value = ''
    if (!file) return
    setIsImporting(true)
    try {
      const payload = JSON.parse(await file.text())
      const imported = Array.isArray(payload) ? payload : payload?.verifications
      const valid = Array.isArray(imported) && imported.length > 0 && imported.every((item) => item && typeof item.noId === 'string' && typeof item.status === 'string' && item.values && typeof item.values === 'object' && !Array.isArray(item.values))
      if (!valid) throw new Error('Format arsip verifikasi tidak valid.')
      const sourceByNoId = new Map(records.filter((record) => record.noId).map((record) => [String(record.noId), record]))
      const linked = imported.flatMap((item) => {
        const source = sourceByNoId.get(item.noId.trim())
        return source ? [{ ...item, hibahId: source.id, noId: source.noId, hibahSnapshot: item.hibahSnapshot || source.values }] : []
      })
      if (!linked.length) throw new Error('Tidak ada No ID arsip yang cocok dengan Database Hibah saat ini.')
      const existingIds = new Set(verifications.map((item) => String(item.hibahId)))
      const added = linked.filter((item) => !existingIds.has(String(item.hibahId))).length
      const updated = linked.length - added
      const skipped = imported.length - linked.length
      if (!window.confirm(`Impor ${linked.length} hasil verifikasi dari ${file.name}? ${added} ditambahkan, ${updated} diperbarui${skipped ? `, ${skipped} dilewati karena No ID tidak cocok` : ''}.`)) return
      setVerifications((current) => {
        const next = [...current]
        linked.forEach((item, index) => {
          const existingIndex = next.findIndex((currentItem) => String(currentItem.hibahId) === String(item.hibahId))
          const saved = { ...item, id: existingIndex >= 0 ? next[existingIndex].id : `v${Date.now()}_${index}` }
          if (existingIndex >= 0) next[existingIndex] = { ...next[existingIndex], ...saved }
          else next.unshift(saved)
        })
        return next
      })
      window.alert(`Impor selesai: ${added} data ditambahkan, ${updated} data diperbarui${skipped ? `, ${skipped} data dilewati` : ''}.`)
    } catch (error) {
      window.alert(error.message || 'File arsip verifikasi tidak dapat dibaca.')
    } finally {
      setIsImporting(false)
    }
  }
  const openEdit = (verification) => {
    const source = records.find((record) => String(record.id) === String(verification.hibahId))
    if (!source) return window.alert('Data Hibah sumber tidak ditemukan.')
    setEditing({ verification, source })
  }
  const save = (nextVerification) => {
    setVerifications((current) => {
      const existing = current.find((item) => item.hibahId === nextVerification.hibahId)
      const saved = { ...nextVerification, id: existing?.id || `v${Date.now()}`, noId: verificationTarget.noId, hibahSnapshot: verificationTarget.values, verifiedBy: user?.id, verifiedByName: user?.name, createdAt: existing?.createdAt || new Date().toLocaleString('id-ID') }
      return existing ? current.map((item) => item.hibahId === saved.hibahId ? saved : item) : [saved, ...current]
    })
    setVerificationTarget(null)
  }
  const remove = () => {
    if (!deleteTarget) return
    setVerifications((current) => current.filter((item) => item.id !== deleteTarget.id))
    setDeleteTarget(null)
  }
  return (
    <>
      <section className="page-heading compact-heading">
        <div><p className="eyebrow">ARSIP PEMERIKSAAN</p><h1>Database Verifikasi Hibah</h1><p className="muted">Hasil verifikasi tersimpan dan tertaut pada data pengajuan asal.</p></div>
        <span className="saved-badge"><ClipboardCheck size={14} /> {verifications.length} hasil verifikasi</span>
      </section>
      <div className="database-toolbar">
        <div className="search-box"><Search size={17} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Cari No ID, kelompok, status..." /></div>
        <label className={`secondary-btn database-import-btn ${isImporting ? 'is-importing' : ''}`}>
          <Upload size={16} /> {isImporting ? 'Mengimpor...' : 'Import JSON'}
          <input className="visually-hidden" type="file" accept="application/json,.json" onChange={importVerifications} disabled={isImporting} />
        </label>
        <button className="secondary-btn" onClick={exportVerifications}><ArrowDownToLine size={16} /> Export JSON</button>
        <span className="toolbar-count">{filtered.length} dari {verifications.length} hasil</span>
      </div>
      <div className="panel table-panel">
        <div className="table-scroll">
          <table className="verification-table">
            <thead><tr><th>No</th><th>No ID Hibah</th><th>Kelompok penerima</th><th>Hasil verifikasi</th><th>Verifikator</th><th>Terakhir diperbarui</th><th>Aksi</th></tr></thead>
            <tbody>{filtered.map((item, index) => <tr key={item.id}>
              <td>{index + 1}</td><td>{item.noId}</td><td><strong>{item.hibahSnapshot?.nama_kelompok || '-'}</strong></td>
              <td><span className={`verification-status verification-${item.status ? item.status.toLowerCase().replace(/\s/g, '-') : 'unassigned'}`}>{item.status || 'Belum ditentukan'}</span></td>
              <td>{item.verifiedByName || '-'}</td><td>{item.updatedAt || item.createdAt || '-'}</td>
              <td><div className="row-actions"><button onClick={() => openEdit(item)} title="Edit verifikasi" aria-label={`Edit verifikasi ${item.noId}`}><Pencil size={15} /></button><button onClick={() => setDeleteTarget(item)} title="Hapus verifikasi" aria-label={`Hapus verifikasi ${item.noId}`}><Trash2 size={15} /></button></div></td>
            </tr>)}</tbody>
          </table>
          {!filtered.length && <div className="empty-state">{verifications.length ? 'Tidak ada hasil yang cocok dengan pencarian.' : 'Belum ada hasil verifikasi. Mulai dari tombol Verifikasi data pada Database Hibah.'}</div>}
        </div>
      </div>
      {editing && <VerificationFormModal record={editing.source} hibahFields={hibahFields} fields={verificationFields} verification={editing.verification} onClose={() => setEditing(null)} onSave={save} />}
      {deleteTarget && <div className="logout-backdrop" role="presentation" onClick={() => setDeleteTarget(null)}><section className="logout-modal" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}><div className="logout-icon"><Trash2 size={21} /></div><h2>Hapus hasil verifikasi?</h2><p>Hasil verifikasi {deleteTarget.noId} akan dihapus. Data pengajuan Hibah tetap tersimpan.</p><div className="logout-actions"><button className="cancel-logout" onClick={() => setDeleteTarget(null)}>Batal</button><button className="confirm-logout" onClick={remove}>Hapus hasil</button></div></section></div>}
    </>
  )
}

function DatabasePage({ records, setRecords, fields, allFields, verificationFields, verifications, setVerifications, user, role, t }) {
  const [search, setSearch] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = usePersistedState(`hibah-database-filters-${user?.id || 'anonymous'}`, { tahun_anggaran: '', pokja: '', kabkot: '' })
  const [showExportMenu, setShowExportMenu] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(null)
  const [selected, setSelected] = useState(null)
  const [verificationTarget, setVerificationTarget] = useState(null)
  const filterOptions = Object.keys(filters).reduce((options, key) => {
    options[key] = [...new Set(records.map((record) => record.values?.[key]).filter((value) => value !== undefined && value !== null && String(value).trim()).map(String))]
      .sort((left, right) => key === 'tahun_anggaran' ? right.localeCompare(left, undefined, { numeric: true }) : left.localeCompare(right, 'id'))
    return options
  }, {})
  const filtered = records.filter((record) => {
    const matchesSearch = JSON.stringify(record.values).toLowerCase().includes(search.toLowerCase())
    return matchesSearch && Object.entries(filters).every(([key, value]) => !value || String(record.values?.[key] ?? '').trim().toLocaleLowerCase('id-ID') === value.toLocaleLowerCase('id-ID'))
  })
  const activeFilterCount = Object.values(filters).filter(Boolean).length
  const openForm = (record = null) => { setEditing(record); setShowForm(true) }
  const save = (values, noId) => { if (editing) setRecords(records.map((record) => record.id === editing.id ? { ...record, noId: role === 'superadmin' ? noId : record.noId, values } : record)); else setRecords([{ id: Date.now(), noId: getNextGrantId(records), status: 'Menunggu', createdAt: 'Hari ini', values }, ...records]); setShowForm(false); setEditing(null) }
  const remove = (id) => { if (window.confirm('Hapus data pengajuan ini?')) setRecords(records.filter((record) => record.id !== id)) }
  const importRecords = async (event) => {
    const input = event.currentTarget
    const file = input.files?.[0]
    input.value = ''
    if (!file) return
    setIsImporting(true)
    try {
      const imported = await readGrantImport(file, allFields)
      if (!imported.length) throw new Error('Tidak ada baris valid. Pastikan file memiliki kolom Nama kelompok.')
      if (!window.confirm(`Impor ${imported.length} baris dari ${file.name}? Baris dengan No ID yang sama akan diperbarui.`)) return
      let added = 0
      let updated = 0
      const nextRecords = [...records]
      imported.forEach((row, index) => {
        const existingIndex = row.noId ? nextRecords.findIndex((record) => record.noId === row.noId) : -1
        if (existingIndex >= 0) {
          const existing = nextRecords[existingIndex]
          nextRecords[existingIndex] = { ...existing, status: row.status || existing.status, createdAt: row.createdAt || existing.createdAt, values: { ...existing.values, ...row.values } }
          updated += 1
          return
        }
        const duplicateId = row.noId && nextRecords.some((record) => record.noId === row.noId)
        const noId = row.noId && !duplicateId ? row.noId : getNextGrantId(nextRecords)
        nextRecords.unshift({ id: Date.now() + index, noId, status: row.status || 'Menunggu', createdAt: row.createdAt || new Date().toLocaleDateString('id-ID'), values: row.values })
        added += 1
      })
      setRecords(nextRecords)
      window.alert(`Impor selesai: ${added} data ditambahkan, ${updated} data diperbarui.`)
    } catch (error) {
      window.alert(error.message || 'File Excel tidak dapat dibaca.')
    } finally {
      setIsImporting(false)
    }
  }
  const exportRecords = async (format) => {
    setShowExportMenu(false)
    try {
      await exportGrantData(format, filtered, allFields.filter((field) => field.active))
    } catch (error) {
      window.alert(error.message || 'Data tidak dapat diekspor.')
    }
  }
  const saveVerification = (nextVerification) => {
    setVerifications((current) => {
      const existing = current.find((item) => item.hibahId === nextVerification.hibahId)
      const saved = { ...nextVerification, id: existing?.id || `v${Date.now()}`, noId: verificationTarget.noId, hibahSnapshot: verificationTarget.values, verifiedBy: user?.id, verifiedByName: user?.name, createdAt: existing?.createdAt || new Date().toLocaleString('id-ID') }
      return existing ? current.map((item) => item.hibahId === saved.hibahId ? saved : item) : [saved, ...current]
    })
    setVerificationTarget(null)
  }
  return (
    <>
      <section className="page-heading compact-heading">
        <div><p className="eyebrow">DATA UTAMA</p><h1>{t.database}</h1><p className="muted">Kelola seluruh pengajuan hibah dengan field yang fleksibel.</p></div>
        <button className="primary-btn" onClick={() => openForm()}><Plus size={16} /> Tambah pengajuan</button>
      </section>
      <div className="database-toolbar">
        <div className="search-box"><Search size={17} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Cari nama kelompok, wilayah..." /></div>
        <button className="secondary-btn" onClick={() => setShowFilters((current) => !current)} aria-expanded={showFilters} aria-controls="database-filters"><Filter size={16} /> Filter{activeFilterCount > 0 && <span className="filter-count">{activeFilterCount}</span>}</button>
        <label className={`secondary-btn database-import-btn ${isImporting ? 'is-importing' : ''}`}>
          <Upload size={16} /> {isImporting ? 'Mengimpor...' : 'Import Excel'}
          <input className="visually-hidden" type="file" accept=".xls,.xlsx,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" onChange={importRecords} disabled={isImporting} />
        </label>
        <div className="export-menu-wrap">
          <button className="secondary-btn" onClick={() => setShowExportMenu((current) => !current)} aria-expanded={showExportMenu} aria-haspopup="menu"><ArrowDownToLine size={16} /> Export <ChevronDown size={14} /></button>
          {showExportMenu && <div className="export-menu" role="menu" aria-label="Pilih format export">{[['xls', 'Excel (.xls)'], ['csv', 'CSV (.csv)'], ['pdf', 'PDF (.pdf)']].map(([format, label]) => <button key={format} role="menuitem" onClick={() => exportRecords(format)}>{label}</button>)}</div>}
        </div>
        <span className="toolbar-count">{filtered.length} dari {records.length} data</span>
      </div>
      {showFilters && <section className="database-filter-panel" id="database-filters" aria-label="Filter database hibah">{[['tahun_anggaran', 'Tahun Anggaran'], ['pokja', 'Pokja Pengampu'], ['kabkot', 'Kabkot']].map(([key, label]) => <label key={key}>{label}<select value={filters[key]} onChange={(event) => setFilters((current) => ({ ...current, [key]: event.target.value }))}><option value="">Semua</option>{filterOptions[key].map((option) => <option key={option} value={option}>{option}</option>)}</select></label>)}{activeFilterCount > 0 && <button className="text-btn" onClick={() => setFilters({ tahun_anggaran: '', pokja: '', kabkot: '' })}>Hapus filter</button>}</section>}
      <div className="panel table-panel"><RecordTable records={filtered} fields={fields} onEdit={openForm} onDelete={remove} onSelect={setSelected} onVerify={(record) => setVerificationTarget(record)} verifications={verifications} emptyMessage={records.length ? 'Tidak ada pengajuan yang cocok dengan pencarian atau filter.' : 'Belum ada data hibah.'} /></div>
      {showForm && <RecordFormWithId fields={allFields.filter((field) => field.active)} record={editing} role={role} nextNoId={getNextGrantId(records)} onClose={() => setShowForm(false)} onSave={save} />}
      {selected && <DetailModal record={selected} fields={fields} onClose={() => setSelected(null)} />}
      {verificationTarget && <VerificationFormModal record={verificationTarget} hibahFields={allFields} fields={verificationFields} verification={verifications.find((item) => String(item.hibahId) === String(verificationTarget.id))} onClose={() => setVerificationTarget(null)} onSave={saveVerification} />}
    </>
  )
}

function RecordTable({ records, fields, onEdit, onDelete, onSelect, onVerify, verifications = [], compact, emptyMessage = 'Belum ada data hibah.' }) {
  const locationColumns = [
    { label: 'Kabupaten/Kota', keys: ['kabkot', 'kabupatenkota'] },
    { label: 'Kecamatan', keys: ['kecamatan'] },
    { label: 'Desa', keys: ['desa', 'desakelurahan', 'kelurahan'] },
    { label: 'Alamat', keys: ['alamat'] },
  ]
  const normalizeLocationKey = (value) => String(value || '').toLowerCase().replace(/[^a-z0-9]/g, '')
  const isLocationField = (field) => locationColumns.some(({ keys }) => keys.includes(normalizeLocationKey(field.key)) || keys.includes(normalizeLocationKey(field.label)))
  const tableFields = fields.filter((field) => isDataField(field) && (compact || !isLocationField(field)))
  const getLocationValue = (values, location) => {
    const field = fields.find((item) => location.keys.includes(normalizeLocationKey(item.key)) || location.keys.includes(normalizeLocationKey(item.label)))
    const recordKey = Object.keys(values || {}).find((key) => location.keys.includes(normalizeLocationKey(key)))
    const key = [field?.key, ...location.keys, recordKey].find((candidate) => candidate && values?.[candidate] !== undefined && values[candidate] !== null && values[candidate] !== '')
    const value = key ? values[key] : ''
    return Array.isArray(value) ? value.join(', ') || '-' : value || '-'
  }
  return <div className={`table-scroll ${compact ? 'compact-table' : ''}`}><table><thead><tr><th className="select-column"><input type="checkbox" /></th>{!compact && <th className="actions-column">Aksi</th>}<th className="row-number-column">No Urut</th><th className="grant-id-column">No ID</th><th>Nama kelompok <ArrowUpDown size={13} /></th>{!compact && locationColumns.map((location) => <th key={location.label}>{location.label}</th>)}{tableFields.slice(0, compact ? 2 : 4).map((field) => <th key={field.id}>{field.label} <ArrowUpDown size={13} /></th>)}<th>Status</th></tr></thead><tbody>{records.map((record, index) => {
    const verification = verifications.find((item) => item.hibahId === record.id)
    return <tr key={record.id} onClick={() => onSelect?.(record)}><td className="select-column"><input type="checkbox" onClick={(event) => event.stopPropagation()} /></td>{!compact && <td className="actions-column"><div className="row-actions"><button className="row-action-verify" onClick={(event) => { event.stopPropagation(); onVerify?.(record) }} title={verification ? 'Edit verifikasi data' : 'Verifikasi data'} aria-label={`${verification ? 'Edit verifikasi data' : 'Verifikasi data'} ${record.values.nama_kelompok}`}><ClipboardCheck size={15} /></button><button className="row-action-edit" onClick={(event) => { event.stopPropagation(); onEdit(record) }} title="Edit" aria-label={`Edit ${record.values.nama_kelompok}`}><Pencil size={15} /></button><button className="row-action-delete" onClick={(event) => { event.stopPropagation(); onDelete(record.id) }} title="Hapus" aria-label={`Hapus ${record.values.nama_kelompok}`}><Trash2 size={15} /></button></div></td>}<td className="row-number-column">{index + 1}</td><td className="grant-id-column">{record.noId || formatGrantId(index + 1)}</td><td><div className="name-cell"><span className="record-avatar">{record.values.nama_kelompok?.slice(0, 2).toUpperCase()}</span><span><strong>{record.values.nama_kelompok}</strong></span></div></td>{!compact && locationColumns.map((location) => <td key={location.label}>{getLocationValue(record.values, location)}</td>)}{tableFields.slice(0, compact ? 2 : 4).map((field) => <td key={field.id}>{field.type === 'currency' || field.key === 'nilai_bantuan' ? formatBudget(record.values[field.key]) : Array.isArray(record.values[field.key]) ? record.values[field.key].join(', ') : record.values[field.key] || '-'}</td>)}<td><span className={`status status-${record.status.toLowerCase()}`}>{record.status}</span>{verification && <small className={`verification-inline-status verification-${verification.status.toLowerCase().replace(/\s/g, '-')}`}>{verification.status}</small>}</td></tr>
  })}</tbody></table>{!records.length && <div className="empty-state">{emptyMessage}</div>}</div>
}

function RecordForm({ fields, record, onClose, onSave }) { const [values, setValues] = useState(record?.values || Object.fromEntries(fields.map((field) => [field.key, field.type === 'checklist' ? [] : '']))); const update = (key, value) => setValues((current) => ({ ...current, [key]: value })); const submit = (event) => { event.preventDefault(); onSave(values) }; return <div className="modal-backdrop"><div className="modal large-modal"><div className="modal-head"><div><p className="eyebrow">{record ? 'EDIT DATA' : 'DATA BARU'}</p><h2>{record ? 'Perbarui pengajuan' : 'Tambah pengajuan hibah'}</h2></div><button className="close-btn" onClick={onClose}><X size={19} /></button></div><form onSubmit={submit}><div className="dynamic-form">{fields.map((field) => <DynamicInput key={field.id} field={field} value={values[field.key]} onChange={(value) => update(field.key, value)} />)}</div><div className="modal-foot"><button type="button" className="secondary-btn" onClick={onClose}>Batal</button><button type="submit" className="primary-btn"><Check size={16} /> Simpan pengajuan</button></div></form></div></div> }

function DynamicInputBase({ field, value, onChange }) { const options = field.options.split(';').filter(Boolean); if (field.type === 'checklist') return <fieldset className="field-group"><legend>{field.label} {field.required && <b>*</b>}</legend><div className="check-grid">{options.map((option) => <label className="check-option" key={option}><input type="checkbox" checked={(value || []).includes(option)} onChange={(event) => onChange(event.target.checked ? [...(value || []), option] : (value || []).filter((item) => item !== option))} /><span>{option}</span></label>)}</div></fieldset>; return <label className="field-group">{field.label} {field.required && <b>*</b>}{field.type === 'paragraph' ? <textarea rows="5" value={value || ''} onChange={(event) => onChange(event.target.value)} required={field.required} /> : field.type === 'list' ? <select value={value || ''} onChange={(event) => onChange(event.target.value)} required={field.required}><option value="">Pilih opsi</option>{options.map((option) => <option key={option}>{option}</option>)}</select> : <input type={field.type === 'number' ? 'number' : field.type} value={value || ''} onChange={(event) => onChange(event.target.value)} placeholder={field.placeholder || ''} required={field.required} />}</label> }

function CurrencyInput({ field, value, onChange }) { return <label className="field-group">{field.label} {field.required && <b>*</b>}{field.type === 'currency' ? <input inputMode="numeric" value={formatBudget(value)} onChange={(event) => onChange(parseBudget(event.target.value))} placeholder="Rp 0" required={field.required} /> : <input type={field.type === 'number' ? 'number' : field.type} value={value || ''} onChange={(event) => onChange(event.target.value)} placeholder={field.placeholder || ''} required={field.required} />}</label> }

function DynamicInput({ field, value, onChange }) { return field.type === 'currency' ? <CurrencyInput field={field} value={value} onChange={onChange} /> : <DynamicInputBase field={field} value={value} onChange={onChange} /> }

function DynamicInputProfessional({ field, value, onChange }) { const options = field.options.split(';').filter(Boolean); const hint = field.description && <small className="field-description">{field.description}</small>; if (field.type === 'header') return <div className="form-section-header"><h3>{field.label}</h3>{hint}</div>; if (field.type === 'separator') return <div className="form-section-separator" role="separator" aria-label={field.label || 'Pembatas formulir'} />; if (field.type === 'checklist') return <fieldset className="field-group"><legend>{field.label} {field.required && <b>*</b>}</legend>{hint}<div className="check-grid">{options.map((option) => <label className="check-option" key={option}><input type="checkbox" checked={(value || []).includes(option)} onChange={(event) => onChange(event.target.checked ? [...(value || []), option] : (value || []).filter((item) => item !== option))} /><span>{option}</span></label>)}</div></fieldset>; if (field.type === 'currency') return <label className="field-group">{field.label} {field.required && <b>*</b>}{hint}<input inputMode="numeric" value={formatBudget(value)} onChange={(event) => onChange(parseBudget(event.target.value))} placeholder={field.placeholder || 'Rp 0'} required={field.required} /></label>; return <label className="field-group">{field.label} {field.required && <b>*</b>}{hint}{field.type === 'paragraph' ? <textarea rows="5" value={value || ''} onChange={(event) => onChange(event.target.value)} placeholder={field.placeholder || ''} required={field.required} /> : field.type === 'list' ? <select value={value || ''} onChange={(event) => onChange(event.target.value)} required={field.required}><option value="">{field.placeholder || 'Pilih opsi'}</option>{options.map((option) => <option key={option}>{option}</option>)}</select> : <input type={field.type === 'number' ? 'number' : field.type} value={value || ''} onChange={(event) => onChange(event.target.value)} placeholder={field.placeholder || ''} required={field.required} />}</label> }

function DetailModal({ record, fields, onClose }) { return <div className="modal-backdrop"><div className="modal detail-modal"><div className="modal-head"><div><p className="eyebrow">DETAIL PENGAJUAN</p><h2>{record.values.nama_kelompok}</h2><strong className="detail-no-id">{record.noId || '-'}</strong></div><button className="close-btn" onClick={onClose}><X size={19} /></button></div><div className="detail-status"><span className={`status status-${record.status.toLowerCase()}`}>{record.status}</span><span>Dibuat {record.createdAt}</span></div><div className="detail-list">{fields.filter(isDataField).map((field) => <div key={field.id}><span>{field.label}</span><strong>{field.type === 'currency' ? formatBudget(record.values[field.key]) : Array.isArray(record.values[field.key]) ? record.values[field.key].join(', ') : record.values[field.key] || '-'}</strong></div>)}</div></div></div> }

function FieldsPage({ fields, setFields }) { const [showForm, setShowForm] = useState(false); const [editing, setEditing] = useState(null); const move = (index, direction) => { const next = [...fields]; const target = index + direction; if (target < 0 || target >= next.length) return; [next[index], next[target]] = [next[target], next[index]]; setFields(next.map((field, order) => ({ ...field, order }))) }; const save = (field) => { if (editing) setFields(fields.map((item) => item.id === editing.id ? { ...field, id: editing.id } : item)); else setFields([...fields, { ...field, id: `f${Date.now()}` }]); setShowForm(false); setEditing(null) }; const toggle = (id) => setFields(fields.map((field) => field.id === id ? { ...field, active: !field.active } : field)); return <><section className="page-heading compact-heading"><div><p className="eyebrow">KONFIGURASI SISTEM</p><h1>Config field</h1><p className="muted">Bentuk struktur data hibah tanpa mengubah kode aplikasi.</p></div><button className="primary-btn" onClick={() => { setEditing(null); setShowForm(true) }}><Plus size={16} /> Tambah field</button></section><div className="field-summary"><div><FileCog size={18} /><span><strong>{fields.length}</strong> Total field</span></div><div><Check size={18} /><span><strong>{fields.filter((field) => field.active).length}</strong> Field aktif</span></div><div><Activity size={18} /><span><strong>Live</strong> Sinkronisasi</span></div></div><div className="panel fields-panel"><div className="panel-head"><div><h2>Struktur field database</h2><p className="muted">Field aktif akan otomatis tampil di tabel dan form pengajuan.</p></div><button className="secondary-btn"><SlidersHorizontal size={16} /> Preview form</button></div><div className="field-list">{fields.map((field, index) => <div className={`field-row ${!field.active ? 'inactive' : ''} ${dragOverId === field.id ? 'drag-over' : ''}`} key={field.id}><div className="drag-handle"><span /><span /><span /></div><div className="field-order">{String(index + 1).padStart(2, '0')}</div><div className="field-info"><strong>{field.label}</strong><small>{field.key} · {typeLabels[field.type]}</small></div><span className="field-type">{typeLabels[field.type]}</span>{field.required && <span className="required-tag">Wajib</span>}<button className={`toggle ${field.active ? 'on' : ''}`} onClick={() => toggle(field.id)} aria-label={`${field.active ? 'Nonaktifkan' : 'Aktifkan'} ${field.label}`}><span /></button><div className="field-actions"><button onClick={() => move(index, -1)} title="Naikkan" aria-label={`Naikkan ${field.label}`}><ChevronUp size={14} /></button><button onClick={() => move(index, 1)} title="Turunkan" aria-label={`Turunkan ${field.label}`}><ChevronDown size={14} /></button><button onClick={() => { setEditing(field); setShowForm(true) }} title="Edit" aria-label={`Edit ${field.label}`}><Pencil size={15} /></button><button onClick={() => setDeleteTarget(field)} title="Hapus" aria-label={`Hapus ${field.label}`}><Trash2 size={15} /></button></div></div>)}</div></div>{showForm && <FieldFormProfessional field={editing} onClose={() => setShowForm(false)} onSave={save} />}</>
}

function FieldFormProfessional({ field, onClose, onSave }) {
  const [value, setValue] = useState(field || { label: '', key: '', type: 'text', options: '', placeholder: '', description: '', required: false, active: true })
  const update = (key, next) => setValue((current) => ({ ...current, [key]: next }))
  const submit = (event) => { event.preventDefault(); onSave(value) }

  return <div className="modal-backdrop"><div className="modal field-modal">
    <div className="modal-head"><div><p className="eyebrow">CONFIG FIELD</p><h2>{field ? 'Edit field' : 'Field baru'}</h2></div><button className="close-btn" onClick={onClose}><X size={19} /></button></div>
    <form onSubmit={submit}>
      <div className="dynamic-form">
        <label className="field-group">Label field <b>*</b><input required value={value.label} onChange={(event) => update('label', event.target.value)} placeholder="Contoh: Nama penerima" /></label>
        <label className="field-group">Field key <b>*</b><input required value={value.key} onChange={(event) => update('key', event.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_'))} placeholder="nama_penerima" /></label>
        <label className="field-group">Tipe field <b>*</b><select value={value.type} onChange={(event) => update('type', event.target.value)}>{Object.entries(typeLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label>
        <label className="field-group">Placeholder<input value={value.placeholder || ''} onChange={(event) => update('placeholder', event.target.value)} placeholder="Contoh: Masukkan nama penerima" /></label>
        <label className="field-group full-span">Deskripsi<textarea rows="3" value={value.description || ''} onChange={(event) => update('description', event.target.value)} placeholder="Petunjuk atau keterangan untuk pengisi form" /></label>
        {['checklist', 'list'].includes(value.type) && <label className="field-group full-span">Daftar opsi <b>*</b><textarea rows="5" required value={value.options} onChange={(event) => update('options', event.target.value)} placeholder="Pisahkan opsi dengan titik koma (;)" /><small className="field-hint">Contoh: Sapi;Kambing;Domba;Ayam</small></label>}
        <label className="switch-label"><input type="checkbox" checked={value.required} onChange={(event) => update('required', event.target.checked)} /><span>Field wajib diisi</span></label>
      </div>
      <div className="modal-foot"><button type="button" className="secondary-btn" onClick={onClose}>Batal</button><button type="submit" className="primary-btn"><Check size={16} /> Simpan field</button></div>
    </form>
  </div></div>
}

function AnnouncementTicker({ message, style }) {
  if (!message?.trim()) return null
  const bannerStyle = {
    '--announcement-text-color': style.textColor,
    '--announcement-background-color': style.backgroundColor,
    '--announcement-font-size': `${style.fontSize}px`,
    '--announcement-speed': `${style.speed}s`,
    '--announcement-bg-opacity': `${100 - style.transparency}%`,
  }
  return <section className="announcement-banner" aria-label="Pengumuman" style={bannerStyle}>
    <Megaphone size={20} aria-hidden="true" />
    <div className="announcement-marquee" role="status">
      <div className="announcement-track"><span>{message}</span><span aria-hidden="true">{message}</span></div>
    </div>
  </section>
}

function LibraryPage({ items }) {
  return <>
    <section className="page-heading compact-heading">
      <div><p className="eyebrow">REFERENSI DOKUMEN</p><h1>Pustaka</h1><p className="muted">Dokumen dan tautan referensi untuk seluruh user.</p></div>
    </section>
    <section className="panel library-list-panel" aria-label="Daftar dokumen pustaka">
      <div className="library-table-wrap"><table className="library-table"><thead><tr><th scope="col">No</th><th scope="col">Dokumen</th><th scope="col">Nomor dokumen</th><th scope="col">Tanggal dokumen</th></tr></thead><tbody>
        {items.length ? items.map((item, index) => <tr key={item.id}><td>{index + 1}</td><td><a className="library-item" href={item.url} target="_blank" rel="noreferrer"><BookOpen size={18} /><span><strong>{item.name}</strong><small>{item.url}</small></span><ExternalLink size={16} /></a></td><td>{item.documentNumber || '-'}</td><td>{item.documentDate ? new Date(`${item.documentDate}T00:00:00`).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'}</td></tr>) : <tr><td colSpan="4" className="library-empty-cell">Belum ada dokumen di Pustaka.</td></tr>}
      </tbody></table></div>
    </section>
  </>
}

function LibrarySettings({ items, onSave }) {
  const [draft, setDraft] = useState(items)
  const [isSaving, setIsSaving] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [saveMessage, setSaveMessage] = useState('')
  useEffect(() => setDraft(items), [items])
  const updateItem = (id, key, value) => setDraft((current) => current.map((item) => item.id === id ? { ...item, [key]: value } : item))
  const addItem = () => setDraft((current) => [...current, { id: `library-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, name: '', documentNumber: '', documentDate: '', url: '' }])
  const exportLibrary = () => {
    const payload = { app: 'E-Hibah', type: 'library-items', version: 1, exportedAt: new Date().toISOString(), items: draft }
    downloadFile(new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' }), `e-hibah-pustaka-${new Date().toISOString().slice(0, 10)}.json`)
  }
  const importLibrary = async (event) => {
    const input = event.currentTarget
    const file = input.files?.[0]
    input.value = ''
    if (!file) return
    setIsImporting(true)
    try {
      const payload = JSON.parse(await file.text())
      const imported = Array.isArray(payload) ? payload : payload?.items
      if (!Array.isArray(imported) || imported.length > 500) throw new Error('Format file Pustaka tidak valid atau melebihi 500 dokumen.')
      const normalized = imported.map((item, index) => {
        const name = typeof item?.name === 'string' ? item.name.trim() : ''
        const url = typeof item?.url === 'string' ? item.url.trim() : ''
        const documentNumber = typeof item?.documentNumber === 'string' ? item.documentNumber.trim() : ''
        const documentDate = typeof item?.documentDate === 'string' ? item.documentDate.trim() : ''
        let parsedUrl
        try { parsedUrl = new URL(url) } catch { throw new Error(`Hyperlink dokumen nomor ${index + 1} tidak valid.`) }
        const isValidDate = !documentDate || (/^\d{4}-\d{2}-\d{2}$/.test(documentDate) && new Date(`${documentDate}T00:00:00Z`).toISOString().slice(0, 10) === documentDate)
        if (!name || !['http:', 'https:'].includes(parsedUrl.protocol) || !isValidDate) throw new Error(`Data dokumen nomor ${index + 1} tidak valid.`)
        return { id: typeof item.id === 'string' && item.id ? item.id : `library-import-${Date.now()}-${index}`, name, documentNumber, documentDate, url }
      })
      if (!window.confirm(`Impor ${normalized.length} dokumen dan mengganti draft Pustaka saat ini?`)) return
      setDraft(normalized)
      setSaveMessage('File diimpor. Simpan Pustaka untuk menerapkan perubahan.')
    } catch (error) {
      window.alert(error.message || 'File Pustaka tidak dapat dibaca.')
    } finally {
      setIsImporting(false)
    }
  }
  const save = async (event) => {
    event.preventDefault()
    setIsSaving(true)
    setSaveMessage('')
    try {
      await onSave(draft)
      setSaveMessage('Pustaka berhasil disimpan.')
    } catch (error) {
      setSaveMessage(error.message || 'Pustaka gagal disimpan.')
    } finally {
      setIsSaving(false)
    }
  }

  return <section className="panel system-settings-panel library-settings-panel">
    <div className="panel-head"><div><p className="eyebrow">PENGATURAN SISTEM</p><h2>Pengaturan Pustaka</h2><p className="muted">Dokumen yang disimpan akan tersedia untuk semua user.</p></div><BookOpen size={19} /></div>
    <form onSubmit={save}>
      <div className="library-config-list">
        {draft.map((item) => <div className="library-config-row" key={item.id}>
          <label className="field-group">Nama dokumen<input required maxLength="180" value={item.name} onChange={(event) => updateItem(item.id, 'name', event.target.value)} placeholder="Contoh: Pedoman Hibah Peternakan" /></label>
          <label className="field-group">Nomor dokumen<input maxLength="120" value={item.documentNumber || ''} onChange={(event) => updateItem(item.id, 'documentNumber', event.target.value)} placeholder="Nomor dokumen" /></label>
          <label className="field-group">Tanggal dokumen<input type="date" value={item.documentDate || ''} onChange={(event) => updateItem(item.id, 'documentDate', event.target.value)} /></label>
          <label className="field-group">Hyperlink<input required type="url" maxLength="2048" value={item.url} onChange={(event) => updateItem(item.id, 'url', event.target.value)} placeholder="https://" /></label>
          <button type="button" className="library-remove-btn" onClick={() => setDraft((current) => current.filter((entry) => entry.id !== item.id))} aria-label={`Hapus ${item.name || 'dokumen'}`} title="Hapus dokumen"><Trash2 size={16} /></button>
        </div>)}
        {!draft.length && <p className="empty-state">Belum ada dokumen. Tambahkan nama dokumen dan hyperlink.</p>}
      </div>
      <div className="library-config-actions"><div className="library-config-file-actions"><label className={`secondary-btn library-import-btn ${isImporting ? 'is-importing' : ''}`}><Upload size={16} /> {isImporting ? 'Mengimpor...' : 'Import JSON'}<input className="visually-hidden" type="file" accept="application/json,.json" onChange={importLibrary} disabled={isImporting} /></label><button type="button" className="secondary-btn" onClick={exportLibrary}><ArrowDownToLine size={16} /> Export JSON</button><button type="button" className="secondary-btn" onClick={addItem}><Plus size={16} /> Tambah dokumen</button></div><div className="system-settings-actions"><span className="field-hint" role="status">{saveMessage}</span><button className="primary-btn" type="submit" disabled={isSaving}>{isSaving ? 'Menyimpan...' : 'Simpan Pustaka'}</button></div></div>
    </form>
  </section>
}

function SettingsPage({ user, onEditAccount, theme, setTheme, language, setLanguage, announcement, announcementStyle, onSaveAnnouncement, libraryItems, onSaveLibrary }) {
  const [announcementDraft, setAnnouncementDraft] = useState(announcement)
  const [announcementStyleDraft, setAnnouncementStyleDraft] = useState(announcementStyle)
  const [isSavingAnnouncement, setIsSavingAnnouncement] = useState(false)
  const [announcementSaveMessage, setAnnouncementSaveMessage] = useState('')
  useEffect(() => setAnnouncementDraft(announcement), [announcement])
  useEffect(() => setAnnouncementStyleDraft(announcementStyle), [announcementStyle])
  const themes = [
    { id: 'green', label: 'Green Pastel', color: '#236b48', description: 'Tenang dan natural' },
    { id: 'light', label: 'Light', color: '#2c5d7c', description: 'Bersih dan fokus' },
    { id: 'dark', label: 'Dark', color: '#202a25', description: 'Nyaman untuk malam' },
    { id: 'blue', label: 'Blue Sky', color: '#19718d', description: 'Segar dan profesional' },
  ]
  const updateAnnouncementStyle = (key, value) => setAnnouncementStyleDraft((current) => ({ ...current, [key]: value }))
  const saveAnnouncement = async (event) => {
    event.preventDefault()
    setIsSavingAnnouncement(true)
    setAnnouncementSaveMessage('')
    try {
      await onSaveAnnouncement(announcementDraft, announcementStyleDraft)
      setAnnouncementSaveMessage('Pengumuman berhasil disimpan.')
    } catch (error) {
      setAnnouncementSaveMessage(error.message || 'Pengumuman gagal disimpan.')
    } finally {
      setIsSavingAnnouncement(false)
    }
  }

  return <>
    <section className="page-heading compact-heading"><div><p className="eyebrow">PREFERENSI AKUN</p><h1>Pengaturan</h1><p className="muted">Sesuaikan pengalaman kerja sesuai kebutuhan Anda.</p></div><span className="saved-badge"><Check size={14} /> Tersimpan otomatis</span></section>
    <section className="panel settings-account"><div className="account-avatar">AS</div><div><p className="eyebrow">AKUN AKTIF</p><h2>{user?.name || 'Pengguna'}</h2><p className="muted">{user?.email || ''} · {user?.role === 'superadmin' ? 'Superadmin' : 'User'}</p></div><button className="secondary-btn" onClick={onEditAccount}>Edit profil</button></section>
    <div className="settings-grid">
      <section className="panel settings-panel"><div className="panel-head"><div><h2>Bahasa aplikasi</h2><p className="muted">Pilih bahasa untuk label dan navigasi utama.</p></div><BookOpen size={19} /></div><div className="language-options"><button className={language === 'id' ? 'selected' : ''} onClick={() => setLanguage('id')}><span className="flag-badge">ID</span><span><strong>Bahasa Indonesia</strong><small>Bahasa default sistem</small></span>{language === 'id' && <Check size={16} />}</button><button className={language === 'en' ? 'selected' : ''} onClick={() => setLanguage('en')}><span className="flag-badge flag-en">EN</span><span><strong>English</strong><small>Use English interface</small></span>{language === 'en' && <Check size={16} />}</button></div></section>
      <section className="panel settings-panel"><div className="panel-head"><div><h2>Tema tampilan</h2><p className="muted">Preferensi ini hanya berlaku pada akun Anda.</p></div><Sparkles size={19} /></div><div className="theme-options">{themes.map((item) => <button key={item.id} className={theme === item.id ? 'selected' : ''} onClick={() => setTheme(item.id)}><span className="theme-swatch" style={{ background: item.color }} /><span><strong>{item.label}</strong><small>{item.description}</small></span>{theme === item.id && <Check size={16} />}</button>)}</div></section>
    </div>
    {user?.role === 'superadmin' && <section className="panel system-settings-panel"><div className="panel-head"><div><p className="eyebrow">PENGATURAN SISTEM</p><h2>Sistem Aplikasi</h2></div><Settings size={19} /></div><form onSubmit={saveAnnouncement}><div className="system-announcement-field"><strong>Pengumuman</strong><label className="field-group">Siaran<textarea rows="5" required maxLength="5000" value={announcementDraft} onChange={(event) => setAnnouncementDraft(event.target.value)} placeholder="Tulis pengumuman untuk seluruh user" /></label><div className="announcement-display-settings"><label className="announcement-color-control">Warna font<input type="color" value={announcementStyleDraft.textColor} onChange={(event) => updateAnnouncementStyle('textColor', event.target.value)} /></label><label className="announcement-color-control">Warna dasar / shading<input type="color" value={announcementStyleDraft.backgroundColor} onChange={(event) => updateAnnouncementStyle('backgroundColor', event.target.value)} /></label><label className="announcement-range-control"><span>Ukuran font <output>{announcementStyleDraft.fontSize} px</output></span><input type="range" min="10" max="28" step="1" value={announcementStyleDraft.fontSize} onChange={(event) => updateAnnouncementStyle('fontSize', Number(event.target.value))} /></label><label className="announcement-range-control"><span>Kecepatan running text <output>{announcementStyleDraft.speed} detik / putaran</output></span><input type="range" min="8" max="60" step="1" value={announcementStyleDraft.speed} onChange={(event) => updateAnnouncementStyle('speed', Number(event.target.value))} /></label><label className="announcement-range-control announcement-transparency-control"><span>Transparansi bilah <output>{announcementStyleDraft.transparency}%</output></span><input type="range" min="0" max="100" step="1" value={announcementStyleDraft.transparency} onChange={(event) => updateAnnouncementStyle('transparency', Number(event.target.value))} /></label></div></div><div className="system-settings-actions"><span className="field-hint" role="status">{announcementSaveMessage}</span><button className="primary-btn" type="submit" disabled={isSavingAnnouncement}><Check size={16} /> {isSavingAnnouncement ? 'Menyimpan...' : 'Simpan pengumuman'}</button></div></form></section>}
    {user?.role === 'superadmin' && <LibrarySettings items={libraryItems} onSave={onSaveLibrary} />}
  </>
}

function UsersPage({ users, setUsers, currentUser }) {
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [isImporting, setIsImporting] = useState(false)

  const exportUsers = () => {
    const payload = {
      app: 'E-Hibah',
      type: 'user-accounts',
      version: 1,
      exportedAt: new Date().toISOString(),
      users,
    }
    downloadFile(new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' }), `e-hibah-users-${new Date().toISOString().slice(0, 10)}.json`)
  }

  const importUsers = async (event) => {
    const input = event.currentTarget
    const file = input.files?.[0]
    input.value = ''
    if (!file) return

    setIsImporting(true)
    try {
      const payload = JSON.parse(await file.text())
      const imported = Array.isArray(payload) ? payload : payload?.users
      const valid = Array.isArray(imported) && imported.length > 0 && imported.every((user) => user && typeof user.name === 'string' && typeof user.username === 'string' && typeof user.email === 'string' && ['superadmin', 'user'].includes(user.role || 'user'))
      if (!valid) throw new Error('Format file pengguna tidak valid. Gunakan file JSON yang diekspor dari aplikasi ini.')

      if (!window.confirm(`Impor ${imported.length} akun dari ${file.name}? Akun yang memiliki username atau email sama akan diperbarui.`)) return

      const next = [...users]
      imported.forEach((user, index) => {
        const normalizedUser = {
          id: user.id || `u${Date.now()}_${index}`,
          name: String(user.name || '').trim(),
          username: String(user.username || '').trim(),
          email: String(user.email || '').trim(),
          password: user.password || '',
          contactWhatsapp: user.contactWhatsapp || '',
          role: ['superadmin', 'user'].includes(user.role) ? user.role : 'user',
          status: ['Aktif', 'Nonaktif'].includes(user.status) ? user.status : 'Aktif',
        }

        const existingIndex = next.findIndex((candidate) => {
          if (candidate.id && normalizedUser.id && String(candidate.id) === String(normalizedUser.id)) return true
          const sameUsername = candidate.username && candidate.username.toLowerCase() === normalizedUser.username.toLowerCase()
          const sameEmail = candidate.email && candidate.email.toLowerCase() === normalizedUser.email.toLowerCase()
          return sameUsername || sameEmail
        })

        if (existingIndex >= 0) {
          next[existingIndex] = { ...next[existingIndex], ...normalizedUser }
          return
        }

        next.push(normalizedUser)
      })

      setUsers(next)
      window.alert(`Impor selesai: ${imported.length} akun diproses.`)
    } catch (error) {
      window.alert(error.message || 'File pengguna tidak dapat dibaca.')
    } finally {
      setIsImporting(false)
    }
  }

  const save = (user) => { if (editing) setUsers(users.map((item) => item.id === editing.id ? { ...user, id: editing.id } : item)); else setUsers([...users, { ...user, id: `u${Date.now()}` }]); setShowForm(false); setEditing(null) }
  const remove = () => {
    if (!deleteTarget) return
    if (String(deleteTarget.id) === String(currentUser?.id)) {
      window.alert('Akun yang sedang digunakan tidak dapat dihapus.')
      setDeleteTarget(null)
      return
    }
    const remainingActiveSuperadmins = users.filter((user) => user.id !== deleteTarget.id && user.role === 'superadmin' && user.status === 'Aktif')
    if (deleteTarget.role === 'superadmin' && deleteTarget.status === 'Aktif' && !remainingActiveSuperadmins.length) {
      window.alert('Tidak dapat menghapus superadmin aktif terakhir.')
      setDeleteTarget(null)
      return
    }
    setUsers((current) => current.filter((user) => user.id !== deleteTarget.id))
    setDeleteTarget(null)
  }
  return <>
    <section className="page-heading compact-heading"><div><p className="eyebrow">AKSES DAN PERAN</p><h1>Manajemen user</h1><p className="muted">Kelola akun yang dapat mengakses workspace hibah.</p></div><div className="user-page-actions"><label className={`secondary-btn user-import-btn ${isImporting ? 'is-importing' : ''}`}>
      <Upload size={16} /> {isImporting ? 'Mengimpor...' : 'Import JSON'}
      <input className="visually-hidden" type="file" accept="application/json,.json" onChange={importUsers} disabled={isImporting} />
    </label><button className="secondary-btn" onClick={exportUsers}><ArrowDownToLine size={16} /> Export JSON</button><button className="primary-btn" onClick={() => { setEditing(null); setShowForm(true) }}><Plus size={16} /> Tambah user</button></div></section>
    <div className="user-summary"><span><strong>{users.length}</strong> Total akun</span><span><strong>{users.filter((user) => user.status === 'Aktif').length}</strong> Aktif</span><span><strong>{users.filter((user) => user.role === 'superadmin').length}</strong> Superadmin</span></div>
    <section className="panel users-panel"><div className="panel-head"><div><h2>Daftar pengguna</h2><p className="muted">Perubahan role berlaku pada login berikutnya.</p></div><ShieldCheck size={19} /></div><div className="user-list">{users.map((user) => <div className="user-row" key={user.id}><span className="user-avatar">{user.name.split(' ').map((part) => part[0]).join('').slice(0, 2)}</span><div className="user-info"><strong>{user.name}</strong><small>{user.email}</small><small>{user.contactWhatsapp || 'Kontak WhatsApp belum diisi'}</small></div><span className={`role-pill ${user.role}`}>{user.role === 'superadmin' ? 'Superadmin' : 'User'}</span><span className={`user-status ${user.status.toLowerCase()}`}>{user.status}</span><div className="row-actions"><button title="Edit" onClick={() => { setEditing(user); setShowForm(true) }}><Pencil size={15} /></button><button title={String(user.id) === String(currentUser?.id) ? 'Akun yang sedang digunakan tidak dapat dihapus' : 'Hapus user'} aria-label={`Hapus user ${user.name}`} onClick={() => setDeleteTarget(user)}><Trash2 size={15} /></button></div></div>)}</div></section>
    {showForm && <UserForm user={editing} onClose={() => setShowForm(false)} onSave={save} />}
    {deleteTarget && <div className="logout-backdrop" role="presentation" onClick={() => setDeleteTarget(null)}><section className="logout-modal" role="alertdialog" aria-modal="true" aria-labelledby="delete-user-title" onClick={(event) => event.stopPropagation()}><div className="logout-icon"><Trash2 size={21} /></div><h2 id="delete-user-title">Konfirmasi hapus user</h2><p>Apakah Anda yakin untuk menghapus <strong>{deleteTarget.name}</strong> dari sistem?</p><div className="logout-actions"><button className="cancel-logout" onClick={() => setDeleteTarget(null)}>Batal</button><button className="confirm-logout" onClick={remove}>Ya, hapus</button></div></section></div>}
  </>
}

function UserForm({ user, onClose, onSave }) {
  const [value, setValue] = useState(user || { name: '', username: '', email: '', contactWhatsapp: '', password: '', role: 'user', status: 'Aktif' })
  const [showPassword, setShowPassword] = useState(false)
  const update = (key, next) => setValue((current) => ({ ...current, [key]: next }))
  return <div className="modal-backdrop">
    <div className="modal user-modal">
      <div className="modal-head">
        <div><p className="eyebrow">MANAJEMEN USER</p><h2>{user ? 'Edit pengguna' : 'Tambah pengguna'}</h2></div>
        <button className="close-btn" onClick={onClose}><X size={19} /></button>
      </div>
      <form onSubmit={(event) => { event.preventDefault(); onSave(value) }}>
        <div className="dynamic-form">
          <label className="field-group">Nama lengkap <b>*</b><input required value={value.name} onChange={(event) => update('name', event.target.value)} placeholder="Nama pengguna" /></label>
          <label className="field-group">Username <b>*</b><input required value={value.username || ''} onChange={(event) => update('username', event.target.value.toLowerCase().replace(/\s/g, ''))} placeholder="username" /></label>
          <label className="field-group">Email <b>*</b><input required type="email" value={value.email} onChange={(event) => update('email', event.target.value)} placeholder="nama@dinas.go.id" /></label>
          <label className="field-group">Kontak person (WhatsApp)<input type="tel" inputMode="tel" autoComplete="tel" value={value.contactWhatsapp || ''} onChange={(event) => update('contactWhatsapp', event.target.value.replace(/[^0-9+]/g, ''))} placeholder="Contoh: 081234567890" /></label>
          <label className="field-group">Password <b>*</b><span className="user-password-wrap"><input required={!user} type={showPassword ? 'text' : 'password'} value={value.password || ''} onChange={(event) => update('password', event.target.value)} placeholder={user ? 'Biarkan jika tidak diubah' : 'Password pengguna'} /><button type="button" className="user-password-toggle" onClick={() => setShowPassword((current) => !current)} aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'} title={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}>{showPassword ? <EyeOff size={16} /> : <Eye size={16} />}</button></span></label>
          <label className="field-group">Role <b>*</b><select value={value.role} onChange={(event) => update('role', event.target.value)}><option value="user">User</option><option value="superadmin">Superadmin</option></select></label>
          <label className="field-group">Status <b>*</b><select value={value.status} onChange={(event) => update('status', event.target.value)}><option>Aktif</option><option>Nonaktif</option></select></label>
        </div>
        <div className="modal-foot"><button type="button" className="secondary-btn" onClick={onClose}>Batal</button><button className="primary-btn" type="submit"><Check size={16} /> Simpan pengguna</button></div>
      </form>
    </div>
  </div>
}

function RecordFormWithId({ fields, record, role, nextNoId, onClose, onSave }) {
  const [values, setValues] = useState(record?.values || Object.fromEntries(fields.map((field) => [field.key, field.type === 'checklist' ? [] : ''])))
  const [noId, setNoId] = useState(record?.noId || nextNoId)
  const update = (key, value) => setValues((current) => ({ ...current, [key]: value }))
  const submit = (event) => { event.preventDefault(); onSave(values, noId) }
  return <div className="modal-backdrop"><div className="modal large-modal"><div className="modal-head"><div><p className="eyebrow">{record ? 'EDIT DATA' : 'DATA BARU'}</p><h2>{record ? 'Perbarui pengajuan' : 'Tambah pengajuan hibah'}</h2></div><strong className="record-form-no-id">{noId}</strong><button className="close-btn" onClick={onClose}><X size={19} /></button></div><form onSubmit={submit}><div className="dynamic-form">{role === 'superadmin' ? <label className="field-group">No ID <b>*</b><input required pattern="ID-[0-9]{10}" value={noId} onChange={(event) => setNoId(event.target.value.toUpperCase())} placeholder="ID-0000000001" /><small className="field-hint">Format: ID-0000000001 sampai ID-9999999999</small></label> : <label className="field-group">No ID<input value={noId} readOnly /></label>}{fields.map((field) => field.key === 'komoditas_ternak' ? <div className="commodity-checklist" key={field.id}><DynamicInputProfessional field={field} value={values[field.key]} onChange={(value) => update(field.key, value)} /></div> : <DynamicInputProfessional key={field.id} field={field} value={values[field.key]} onChange={(value) => update(field.key, value)} />)}</div><div className="modal-foot"><button type="button" className="secondary-btn" onClick={onClose}>Batal</button><button type="submit" className="primary-btn"><Check size={16} /> Simpan pengajuan</button></div></form></div></div>
}

function FieldsPageDnd({ fields, setFields }) {
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(null)
  const [draggedId, setDraggedId] = useState(null)
  const [dragOverId, setDragOverId] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const move = (index, direction) => { const next = [...fields]; const target = index + direction; if (target < 0 || target >= next.length) return; [next[index], next[target]] = [next[target], next[index]]; setFields(next.map((field, order) => ({ ...field, order }))) }
  const reorder = (targetId) => { if (!draggedId || draggedId === targetId) return; const next = [...fields]; const from = next.findIndex((field) => field.id === draggedId); const to = next.findIndex((field) => field.id === targetId); const [dragged] = next.splice(from, 1); next.splice(to, 0, dragged); setFields(next.map((field, order) => ({ ...field, order }))) }
  const save = (field) => { if (editing) setFields(fields.map((item) => item.id === editing.id ? { ...field, id: editing.id } : item)); else setFields([...fields, { ...field, id: `f${Date.now()}` }]); setShowForm(false); setEditing(null) }
  const duplicate = (field) => { const keyBase = `${field.key}_copy`; let key = keyBase; let suffix = 2; while (fields.some((item) => item.key === key)) key = `${keyBase}_${suffix++}`; const copy = { ...field, id: `f${Date.now()}`, key, label: `${field.label} (salinan)` }; const index = fields.findIndex((item) => item.id === field.id); const next = [...fields]; next.splice(index + 1, 0, copy); setFields(next.map((item, order) => ({ ...item, order }))) }
  const toggle = (id) => setFields(fields.map((field) => field.id === id ? { ...field, active: !field.active } : field))
  const remove = () => { if (!deleteTarget) return; setFields(fields.filter((field) => field.id !== deleteTarget.id).map((field, order) => ({ ...field, order }))); setDeleteTarget(null) }
  return <><section className="page-heading compact-heading"><div><p className="eyebrow">KONFIGURASI SISTEM</p><h1>Config field</h1><p className="muted">Bentuk struktur data hibah tanpa mengubah kode aplikasi.</p></div><button className="primary-btn" onClick={() => { setEditing(null); setShowForm(true) }}><Plus size={16} /> Tambah field</button></section><div className="field-summary"><div><FileCog size={18} /><span><strong>{fields.length}</strong> Total field</span></div><div><Check size={18} /><span><strong>{fields.filter((field) => field.active).length}</strong> Field aktif</span></div><div><Activity size={18} /><span><strong>Live</strong> Sinkronisasi</span></div></div><div className="panel fields-panel"><div className="panel-head"><div><h2>Struktur field database</h2><p className="muted">Seret handle di kiri untuk mengubah urutan field.</p></div><button className="secondary-btn"><SlidersHorizontal size={16} /> Preview form</button></div><div className="field-list">{fields.map((field, index) => <div className={`field-row ${!field.active ? 'inactive' : ''} ${dragOverId === field.id ? 'drag-over' : ''}`} key={field.id} draggable onDragStart={() => setDraggedId(field.id)} onDragOver={(event) => { event.preventDefault(); setDragOverId(field.id) }} onDragEnd={() => { reorder(dragOverId); setDraggedId(null); setDragOverId(null) }}><div className="drag-handle" title="Seret untuk mengubah urutan" aria-label={`Seret ${field.label}`}><span /><span /><span /></div><div className="field-order">{String(index + 1).padStart(2, '0')}</div><div className="field-info"><strong>{field.label}</strong><small>{field.key} · {typeLabels[field.type]}</small></div><span className="field-type">{typeLabels[field.type]}</span>{field.active && <span className="required-tag">Wajib</span>}<button className={`toggle ${field.active ? 'on' : ''}`} onClick={() => toggle(field.id)} aria-label={`${field.active ? 'Nonaktifkan' : 'Aktifkan'} ${field.label}`}><span /></button><div className="field-actions"><button onClick={() => move(index, -1)} disabled={index === 0} title="Naikkan" aria-label={`Naikkan ${field.label}`}><ChevronUp size={14} /></button><button onClick={() => move(index, 1)} disabled={index === fields.length - 1} title="Turunkan" aria-label={`Turunkan ${field.label}`}><ChevronDown size={14} /></button><button onClick={() => duplicate(field)} title="Duplikat" aria-label={`Duplikat ${field.label}`}><Copy size={15} /></button><button onClick={() => { setEditing(field); setShowForm(true) }} title="Edit" aria-label={`Edit ${field.label}`}><Pencil size={15} /></button><button onClick={() => setDeleteTarget(field)} title="Hapus" aria-label={`Hapus ${field.label}`}><Trash2 size={15} /></button></div></div>)}</div></div>{showForm && <FieldFormProfessional field={editing} onClose={() => setShowForm(false)} onSave={save} />}{deleteTarget && <DeleteFieldConfirm field={deleteTarget} onCancel={() => setDeleteTarget(null)} onConfirm={remove} />}</>
}

function FieldsPageDelete({ fields, setFields }) {
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(null)
  const [draggedId, setDraggedId] = useState(null)
  const [dragOverId, setDragOverId] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const move = (index, direction) => { const next = [...fields]; const target = index + direction; if (target < 0 || target >= next.length) return; [next[index], next[target]] = [next[target], next[index]]; setFields(next.map((field, order) => ({ ...field, order }))) }
  const reorder = (targetId) => { if (!draggedId || draggedId === targetId) return; const next = [...fields]; const from = next.findIndex((field) => field.id === draggedId); const to = next.findIndex((field) => field.id === targetId); const [dragged] = next.splice(from, 1); next.splice(to, 0, dragged); setFields(next.map((field, order) => ({ ...field, order }))) }
  const save = (field) => { if (editing) setFields(fields.map((item) => item.id === editing.id ? { ...field, id: editing.id } : item)); else setFields([...fields, { ...field, id: `f${Date.now()}` }]); setShowForm(false); setEditing(null) }
  const duplicate = (field) => { const keyBase = `${field.key}_copy`; let key = keyBase; let suffix = 2; while (fields.some((item) => item.key === key)) key = `${keyBase}_${suffix++}`; const copy = { ...field, id: `f${Date.now()}`, key, label: `${field.label} (salinan)` }; const index = fields.findIndex((item) => item.id === field.id); const next = [...fields]; next.splice(index + 1, 0, copy); setFields(next.map((item, order) => ({ ...item, order }))) }
  const toggle = (id) => setFields(fields.map((field) => field.id === id ? { ...field, active: !field.active } : field))
  const remove = () => { if (!deleteTarget) return; setFields(fields.filter((field) => field.id !== deleteTarget.id).map((field, order) => ({ ...field, order }))); setDeleteTarget(null) }
  return <><section className="page-heading compact-heading"><div><p className="eyebrow">KONFIGURASI SISTEM</p><h1>Config field</h1><p className="muted">Bentuk struktur data hibah tanpa mengubah kode aplikasi.</p></div><button className="primary-btn" onClick={() => { setEditing(null); setShowForm(true) }}><Plus size={16} /> Tambah field</button></section><div className="field-summary"><div><FileCog size={18} /><span><strong>{fields.length}</strong> Total field</span></div><div><Check size={18} /><span><strong>{fields.filter((field) => field.active).length}</strong> Field aktif</span></div><div><Activity size={18} /><span><strong>Live</strong> Sinkronisasi</span></div></div><div className="panel fields-panel"><div className="panel-head"><div><h2>Struktur field database</h2><p className="muted">Seret handle di kiri untuk mengubah urutan field.</p></div><button className="secondary-btn"><SlidersHorizontal size={16} /> Preview form</button></div><div className="field-list">{fields.map((field, index) => <div className={`field-row ${!field.active ? 'inactive' : ''} ${dragOverId === field.id ? 'drag-over' : ''}`} key={field.id} draggable onDragStart={() => setDraggedId(field.id)} onDragOver={(event) => { event.preventDefault(); setDragOverId(field.id) }} onDragEnd={() => { reorder(dragOverId); setDraggedId(null); setDragOverId(null) }}><div className="drag-handle" title="Seret untuk mengubah urutan" aria-label={`Seret ${field.label}`}><span /><span /><span /></div><div className="field-order">{String(index + 1).padStart(2, '0')}</div><div className="field-info"><strong>{field.label}</strong><small>{field.key} · {typeLabels[field.type]}</small></div><span className="field-type">{typeLabels[field.type]}</span>{field.active && <span className="required-tag">Wajib</span>}<button className={`toggle ${field.active ? 'on' : ''}`} onClick={() => toggle(field.id)} aria-label={`${field.active ? 'Nonaktifkan' : 'Aktifkan'} ${field.label}`}><span /></button><div className="field-actions"><button onClick={() => move(index, -1)} disabled={index === 0} title="Naikkan" aria-label={`Naikkan ${field.label}`}><ChevronUp size={14} /></button><button onClick={() => move(index, 1)} disabled={index === fields.length - 1} title="Turunkan" aria-label={`Turunkan ${field.label}`}><ChevronDown size={14} /></button><button onClick={() => duplicate(field)} title="Duplikat" aria-label={`Duplikat ${field.label}`}><Copy size={15} /></button><button onClick={() => { setEditing(field); setShowForm(true) }} title="Edit" aria-label={`Edit ${field.label}`}><Pencil size={15} /></button><button onClick={() => setDeleteTarget(field)} title="Hapus" aria-label={`Hapus ${field.label}`}><Trash2 size={15} /></button></div></div>)}</div></div>{showForm && <FieldFormProfessional field={editing} onClose={() => setShowForm(false)} onSave={save} />}{deleteTarget && <DeleteFieldConfirm field={deleteTarget} onCancel={() => setDeleteTarget(null)} onConfirm={remove} />}</>
}

function FieldsPageDuplicate({ fields, setFields }) {
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [draggedId, setDraggedId] = useState(null)
  const [dragOverId, setDragOverId] = useState(null)
  const move = (index, direction) => { const next = [...fields]; const target = index + direction; if (target < 0 || target >= next.length) return; [next[index], next[target]] = [next[target], next[index]]; setFields(next.map((field, order) => ({ ...field, order }))) }
  const reorder = (targetId) => { if (!draggedId || draggedId === targetId) return; const next = [...fields]; const from = next.findIndex((field) => field.id === draggedId); const to = next.findIndex((field) => field.id === targetId); const [dragged] = next.splice(from, 1); next.splice(to, 0, dragged); setFields(next.map((field, order) => ({ ...field, order }))) }
  const save = (field) => { if (editing) setFields(fields.map((item) => item.id === editing.id ? { ...field, id: editing.id } : item)); else setFields([...fields, { ...field, id: `f${Date.now()}` }]); setShowForm(false); setEditing(null) }
  const duplicate = (field) => { const keyBase = `${field.key}_copy`; let key = keyBase; let suffix = 2; while (fields.some((item) => item.key === key)) key = `${keyBase}_${suffix++}`; const copy = { ...field, id: `f${Date.now()}`, key, label: `${field.label} (salinan)` }; const index = fields.findIndex((item) => item.id === field.id); const next = [...fields]; next.splice(index + 1, 0, copy); setFields(next.map((item, order) => ({ ...item, order }))) }
  const toggle = (id) => setFields(fields.map((field) => field.id === id ? { ...field, active: !field.active } : field))
  const remove = () => { if (!deleteTarget) return; setFields(fields.filter((field) => field.id !== deleteTarget.id).map((field, order) => ({ ...field, order }))); setDeleteTarget(null) }
  return <><section className="page-heading compact-heading"><div><p className="eyebrow">KONFIGURASI SISTEM</p><h1>Config field</h1><p className="muted">Bentuk struktur data hibah tanpa mengubah kode aplikasi.</p></div><button className="primary-btn" onClick={() => { setEditing(null); setShowForm(true) }}><Plus size={16} /> Tambah field</button></section><div className="field-summary"><div><FileCog size={18} /><span><strong>{fields.length}</strong> Total field</span></div><div><Check size={18} /><span><strong>{fields.filter((field) => field.active).length}</strong> Field aktif</span></div><div><Activity size={18} /><span><strong>Live</strong> Sinkronisasi</span></div></div><div className="panel fields-panel"><div className="panel-head"><div><h2>Struktur field database</h2><p className="muted">Seret handle di kiri untuk mengubah urutan field.</p></div><button className="secondary-btn"><SlidersHorizontal size={16} /> Preview form</button></div><div className="field-list">{fields.map((field, index) => <div className={`field-row ${!field.active ? 'inactive' : ''} ${dragOverId === field.id ? 'drag-over' : ''}`} key={field.id} draggable onDragStart={() => setDraggedId(field.id)} onDragOver={(event) => { event.preventDefault(); setDragOverId(field.id) }} onDragEnd={() => { reorder(dragOverId); setDraggedId(null); setDragOverId(null) }}><div className="drag-handle" title="Seret untuk mengubah urutan" aria-label={`Seret ${field.label}`}><span /><span /><span /></div><div className="field-order">{String(index + 1).padStart(2, '0')}</div><div className="field-info"><strong>{field.label}</strong><small>{field.key} · {typeLabels[field.type]}</small></div><span className="field-type">{typeLabels[field.type]}</span>{field.active && <span className="required-tag">Wajib</span>}<button className={`toggle ${field.active ? 'on' : ''}`} onClick={() => toggle(field.id)} aria-label={`${field.active ? 'Nonaktifkan' : 'Aktifkan'} ${field.label}`}><span /></button><div className="field-actions"><button onClick={() => move(index, -1)} disabled={index === 0} title="Naikkan" aria-label={`Naikkan ${field.label}`}><ChevronUp size={14} /></button><button onClick={() => move(index, 1)} disabled={index === fields.length - 1} title="Turunkan" aria-label={`Turunkan ${field.label}`}><ChevronDown size={14} /></button><button onClick={() => duplicate(field)} title="Duplikat" aria-label={`Duplikat ${field.label}`}><Copy size={15} /></button><button onClick={() => { setEditing(field); setShowForm(true) }} title="Edit" aria-label={`Edit ${field.label}`}><Pencil size={15} /></button><button onClick={() => setDeleteTarget(field)} title="Hapus" aria-label={`Hapus ${field.label}`}><Trash2 size={15} /></button></div></div>)}</div></div>{showForm && <FieldFormProfessional field={editing} onClose={() => setShowForm(false)} onSave={save} />}{deleteTarget && <DeleteFieldConfirm field={deleteTarget} onCancel={() => setDeleteTarget(null)} onConfirm={remove} />}</>
}

function FieldsPageBackup({ fields, setFields }) {
  const [panelTarget, setPanelTarget] = useState(null)
  const exportConfig = () => { const payload = { app: 'E-Hibah', type: 'field-configuration', version: 1, exportedAt: new Date().toISOString(), fields }; const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' }); const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; link.download = `e-hibah-field-config-${new Date().toISOString().slice(0, 10)}.json`; link.click(); URL.revokeObjectURL(url) }
  const importConfig = (event) => { const file = event.target.files?.[0]; event.target.value = ''; if (!file) return; const reader = new FileReader(); reader.onload = () => { try { const payload = JSON.parse(String(reader.result)); const imported = Array.isArray(payload) ? payload : payload.fields; const valid = Array.isArray(imported) && imported.length > 0 && imported.every((field) => field && typeof field.label === 'string' && typeof field.key === 'string' && typeLabels[field.type]); if (!valid) throw new Error('Format konfigurasi tidak valid.'); if (!window.confirm('Impor konfigurasi ini dan mengganti konfigurasi field saat ini?')) return; setFields(imported.map((field, index) => ({ ...field, id: field.id || `f${Date.now()}_${index}`, order: index }))) } catch (error) { window.alert(error.message || 'File konfigurasi tidak dapat dibaca.') } }; reader.readAsText(file) }
  useEffect(() => { setPanelTarget(document.querySelector('.fields-panel .panel-head > div')) }, [fields.length])
  const actions = <div className="field-page-actions"><input id="field-config-import" className="visually-hidden" type="file" accept="application/json,.json" onChange={importConfig} /><button className="secondary-btn" onClick={() => document.getElementById('field-config-import').click()}><Upload size={16} /> Import</button><button className="secondary-btn" onClick={exportConfig}><ArrowDownToLine size={16} /> Export</button></div>
  return <><FieldsPageDuplicate fields={fields} setFields={setFields} />{panelTarget && createPortal(actions, panelTarget)}</>
}

function DeleteFieldConfirm({ field, onCancel, onConfirm }) { return <div className="logout-backdrop" role="presentation" onClick={onCancel}><section className="logout-modal delete-field-modal" role="dialog" aria-modal="true" aria-labelledby="delete-field-title" onClick={(event) => event.stopPropagation()}><div className="logout-icon"><Trash2 size={21} /></div><h2 id="delete-field-title">Apakah anda yakin untuk menghapus field ini?</h2><p>Field <strong>{field.label}</strong> akan dihapus dari konfigurasi.</p><div className="logout-actions"><button className="cancel-logout" onClick={onCancel}>Batal</button><button className="confirm-logout" onClick={onConfirm}>Hapus field</button></div></section></div> }

function AccessDenied({ onBack }) { return <div className="access-denied"><ShieldCheck size={40} /><h2>Akses terbatas</h2><p>Halaman ini hanya tersedia untuk Superadmin.</p><button className="primary-btn" onClick={onBack}>Kembali ke ringkasan</button></div> }

const root = window.__hibahRoot || createRoot(document.getElementById('root'))
window.__hibahRoot = root
root.render(<StrictMode><App /></StrictMode>)
