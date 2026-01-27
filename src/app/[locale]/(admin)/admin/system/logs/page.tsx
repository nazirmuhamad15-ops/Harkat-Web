'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { 
  Search, 
  Filter, 
  Download,
  RefreshCw,
  FileText,
  User,
  Settings,
  Package,
  ShoppingCart,
  AlertTriangle,
  LogIn,
  LogOut,
  Eye
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'

interface ActivityLog {
  id: string
  userId: string
  userName: string
  action: string
  entityType: string
  entityId: string
  oldValues: any
  newValues: any
  ipAddress: string
  userAgent: string
  createdAt: string
}

export default function LogsPage() {
  const { data: session } = useSession()
  const [logs, setLogs] = useState<ActivityLog[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [actionFilter, setActionFilter] = useState('all')
  const [entityFilter, setEntityFilter] = useState('all')
  const [dateFilter, setDateFilter] = useState('7days')

  const actionTypes = [
    { value: 'all', label: 'Semua Aksi' },
    { value: 'CREATE', label: 'Create' },
    { value: 'UPDATE', label: 'Update' },
    { value: 'DELETE', label: 'Delete' },
    { value: 'LOGIN', label: 'Login' },
    { value: 'LOGOUT', label: 'Logout' },
    { value: 'VIEW', label: 'View' },
  ]

  const entityTypes = [
    { value: 'all', label: 'Semua Entitas' },
    { value: 'USER', label: 'User' },
    { value: 'ORDER', label: 'Order' },
    { value: 'PRODUCT', label: 'Product' },
    { value: 'SYSTEM', label: 'System' }
  ]

  const dateRanges = [
    { value: 'today', label: 'Hari Ini' },
    { value: '7days', label: '7 Hari Terakhir' },
    { value: '30days', label: '30 Hari Terakhir' },
    { value: 'all', label: 'Semua Waktu' }
  ]

  const getActionColor = (action: string) => {
    switch (action) {
      case 'CREATE': return 'bg-green-100 text-green-800 border-green-200'
      case 'UPDATE': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'DELETE': return 'bg-red-100 text-red-800 border-red-200'
      case 'LOGIN': return 'bg-indigo-100 text-indigo-800 border-indigo-200'
      case 'LOGOUT': return 'bg-stone-100 text-stone-600 border-stone-200'
      default: return 'bg-stone-100 text-stone-800 border-stone-200'
    }
  }

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'CREATE': return <Package className="h-3 w-3" />
      case 'UPDATE': return <Settings className="h-3 w-3" />
      case 'DELETE': return <AlertTriangle className="h-3 w-3" />
      case 'LOGIN': return <LogIn className="h-3 w-3" />
      case 'LOGOUT': return <LogOut className="h-3 w-3" />
      case 'VIEW': return <Eye className="h-3 w-3" />
      default: return <FileText className="h-3 w-3" />
    }
  }

  const getEntityIcon = (entityType: string) => {
    switch (entityType) {
      case 'USER': return <User className="h-3.5 w-3.5" />
      case 'ORDER': return <ShoppingCart className="h-3.5 w-3.5" />
      case 'PRODUCT': return <Package className="h-3.5 w-3.5" />
      case 'SYSTEM': return <Settings className="h-3.5 w-3.5" />
      default: return <FileText className="h-3.5 w-3.5" />
    }
  }

  const [pagination, setPagination] = useState({
    current: 1,
    limit: 50,
    total: 0,
    pages: 1
  })

  // ... existing code

  useEffect(() => {
    fetchLogs()
  }, [actionFilter, entityFilter, dateFilter, pagination.current])

  const fetchLogs = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        action: actionFilter,
        entity: entityFilter,
        date: dateFilter,
        page: pagination.current.toString(),
        limit: pagination.limit.toString()
      })
      
      const response = await fetch(`/api/admin/logs?${params}`)
      if (response.ok) {
        const data = await response.json()
        setLogs(data.logs || [])
        if (data.pagination) {
            setPagination(prev => ({
                ...prev,
                total: data.pagination.total,
                pages: data.pagination.pages
            }))
        }
      }
    } catch (error) {
      console.error('Failed to fetch logs:', error)
    } finally {
      setLoading(false)
    }
  }

  const exportLogs = () => {
    const headers = ['Date', 'User', 'Action', 'Entity', 'Entity ID', 'IP Address']
    const csvContent = [
      headers.join(','),
      ...logs.map(log => [
        new Date(log.createdAt).toLocaleString('id-ID'),
        `"${log.userName}"`,
        log.action,
        log.entityType,
        log.entityId,
        log.ipAddress
      ].join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const filteredLogs = logs.filter(log => {
    const term = searchTerm.toLowerCase()
    return log.userName.toLowerCase().includes(term) ||
           log.action.toLowerCase().includes(term) ||
           log.entityType.toLowerCase().includes(term) ||
           log.entityId.toLowerCase().includes(term)
  })

  // Stats
  const logStats = {
    total: logs.length,
    creates: logs.filter(l => l.action === 'CREATE').length,
    updates: logs.filter(l => l.action === 'UPDATE').length,
    deletes: logs.filter(l => l.action === 'DELETE').length,
    logins: logs.filter(l => l.action === 'LOGIN').length
  }

  if (loading) {
     return (
        <div className="h-full flex items-center justify-center">
           <p className="text-stone-500 text-sm">Loading activity logs...</p>
        </div>
     )
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {/* Compact Header - 2 Rows */}
      <div className="flex flex-col bg-white border-b border-stone-200 shrink-0">
        
        {/* Row 1: Title & Stats & Actions */}
        <div className="flex items-center justify-between px-3 py-2 border-b border-stone-100">
          <div className="flex items-center gap-3">
            <h1 className="text-base font-bold text-stone-900">Audit Logs</h1>
            <div className="h-4 w-px bg-stone-200" />
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-stone-50 border border-stone-100">
                <FileText className="w-3 h-3 text-stone-500" />
                <span className="text-xs font-semibold text-stone-700">{logStats.total} <span className="text-[10px] font-normal text-stone-500">Total</span></span>
              </div>
              <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-green-50 border border-green-100">
                <Package className="w-3 h-3 text-green-600" />
                <span className="text-xs font-semibold text-stone-700">{logStats.creates} <span className="text-[10px] font-normal text-stone-500">Create</span></span>
              </div>
              <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-blue-50 border border-blue-100">
                <Settings className="w-3 h-3 text-blue-600" />
                <span className="text-xs font-semibold text-stone-700">{logStats.updates} <span className="text-[10px] font-normal text-stone-500">Update</span></span>
              </div>
              <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-red-50 border border-red-100">
                <AlertTriangle className="w-3 h-3 text-red-600" />
                <span className="text-xs font-semibold text-stone-700">{logStats.deletes} <span className="text-[10px] font-normal text-stone-500">Delete</span></span>
              </div>
              <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-indigo-50 border border-indigo-100">
                <LogIn className="w-3 h-3 text-indigo-600" />
                <span className="text-xs font-semibold text-stone-700">{logStats.logins} <span className="text-[10px] font-normal text-stone-500">Login</span></span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={fetchLogs}>
              <RefreshCw className="w-3.5 h-3.5" />
            </Button>
            <Button variant="outline" size="sm" className="h-7 text-xs px-2" onClick={exportLogs}>
              <Download className="w-3.5 h-3.5 mr-1.5" />
              Export
            </Button>
          </div>
        </div>

        {/* Row 2: Filters & Search */}
        <div className="flex items-center justify-between px-3 py-1.5 bg-stone-50/50">
          <div className="flex items-center gap-2">
            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger className="w-[110px] h-8 text-xs bg-white border-stone-200">
                <SelectValue placeholder="Action" />
              </SelectTrigger>
              <SelectContent>
                {actionTypes.map(type => (
                  <SelectItem key={type.value} value={type.value} className="text-xs">
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={entityFilter} onValueChange={setEntityFilter}>
              <SelectTrigger className="w-[110px] h-8 text-xs bg-white border-stone-200">
                <SelectValue placeholder="Entity" />
              </SelectTrigger>
              <SelectContent>
                {entityTypes.map(type => (
                  <SelectItem key={type.value} value={type.value} className="text-xs">
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger className="w-[110px] h-8 text-xs bg-white border-stone-200">
                <SelectValue placeholder="Date range" />
              </SelectTrigger>
              <SelectContent>
                {dateRanges.map(range => (
                  <SelectItem key={range.value} value={range.value} className="text-xs">
                    {range.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="relative w-48">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-stone-400" />
            <Input
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-8 pl-8 text-xs bg-white border-stone-200"
            />
          </div>
        </div>
      </div>

      {/* Logs Table */}
      <div className="flex-1 flex flex-col min-h-0 border rounded-lg bg-white relative mx-3 mb-3">
          {/* Fixed Header */}
          <div className="bg-stone-50 border-b z-20 shrink-0">
            <table className="w-full text-sm text-left">
              <TableHeader>
                <TableRow className="hover:bg-transparent border-none">
                  <TableHead className="pl-6 font-bold text-stone-700 h-10 text-xs uppercase tracking-wider">Waktu</TableHead>
                  <TableHead className="font-bold text-stone-700 h-10 text-xs uppercase tracking-wider">User</TableHead>
                  <TableHead className="font-bold text-stone-700 h-10 text-xs uppercase tracking-wider">Action</TableHead>
                  <TableHead className="font-bold text-stone-700 h-10 text-xs uppercase tracking-wider">Entity</TableHead>
                  <TableHead className="font-bold text-stone-700 h-10 text-xs uppercase tracking-wider">Details</TableHead>
                  <TableHead className="font-bold text-stone-700 h-10 text-xs uppercase tracking-wider">IP Address</TableHead>
                </TableRow>
              </TableHeader>
            </table>
          </div>

          {/* Scrollable Body */}
          <div className="absolute inset-0 top-[42px] bottom-[52px] overflow-y-auto">
            <table className="w-full text-sm text-left">
              <TableBody>
                {filteredLogs.length === 0 ? (
                   <TableRow>
                     <TableCell colSpan={6} className="h-32 text-center text-stone-500">
                        Tidak ada aktivitas ditemukan.
                     </TableCell>
                   </TableRow>
                ) : (
                  filteredLogs.map((log) => (
                    <TableRow key={log.id} className="hover:bg-stone-50 border-b border-stone-50">
                      <TableCell className="pl-6 py-3">
                        <div>
                          <div className="font-medium text-stone-900">
                            {new Date(log.createdAt).toLocaleDateString('id-ID')}
                          </div>
                          <div className="text-xs text-stone-500">
                            {new Date(log.createdAt).toLocaleTimeString('id-ID')}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <div className="w-6 h-6 bg-stone-100 rounded-full mr-2 flex items-center justify-center border border-stone-200">
                            <span className="text-[10px] font-bold text-stone-600">{log.userName ? log.userName.charAt(0).toUpperCase() : '?'}</span>
                          </div>
                          <span className="font-medium text-stone-800 text-xs">{log.userName || 'Unknown'}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`font-normal ${getActionColor(log.action)}`}>
                          <div className="flex items-center gap-1.5">
                              {getActionIcon(log.action)}
                              <span className="capitalize">{log.action.toLowerCase()}</span>
                          </div>
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center text-stone-600">
                          {getEntityIcon(log.entityType)}
                          <span className="ml-1.5 text-xs font-medium">{log.entityType}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-xs">
                          <div className="text-xs font-mono text-stone-500 truncate bg-stone-50 p-1 rounded border border-stone-100 w-fit">
                            ID: {log.entityId}
                          </div>
                          {(log.oldValues && Object.keys(log.oldValues).length > 0) && (
                            <div className="text-xs text-stone-400 mt-1">
                              Changed keys: {Object.keys(log.oldValues).join(', ')}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-xs text-stone-500">
                        {log.ipAddress}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </table>
          </div>
        
          {/* Pagination Footer */}
          <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-stone-100 flex items-center justify-between bg-white z-10">
            <div className="text-xs text-stone-500">
              Page {pagination.current} of {pagination.pages} ({pagination.total} entries)
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="h-7 text-xs"
                disabled={pagination.current === 1 || loading}
                onClick={() => setPagination(prev => ({ ...prev, current: prev.current - 1 }))}
              >
                Previous
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                className="h-7 text-xs"
                disabled={pagination.current >= pagination.pages || loading}
                onClick={() => setPagination(prev => ({ ...prev, current: prev.current + 1 }))}
              >
                Next
              </Button>
            </div>
          </div>
      </div>
    </div>
  )
}