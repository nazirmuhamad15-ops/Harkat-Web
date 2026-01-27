'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  User,
  Shield,
  Mail,
  Phone,
  ToggleLeft,
  ToggleRight,
  UserPlus,
  RefreshCw,
  MoreHorizontal,
  CheckSquare
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'
import { useCsrf, fetchWithCsrf } from '@/components/providers/csrf-provider'

interface User {
  id: string
  name: string
  email: string
  phone: string
  role: string
  isActive: boolean
  createdAt: string
  lastLogin?: string
}

export default function UsersPage() {
  const { csrfToken } = useCsrf()
  const { data: session, status } = useSession()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [showDialog, setShowDialog] = useState(false)
  const [deleteDialog, setDeleteDialog] = useState<string | null>(null)
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set())
  const [bulkActionLoading, setBulkActionLoading] = useState(false)
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false)
  
  // Security Check
  useEffect(() => {
    if (status === 'authenticated') {
        if (session?.user?.role !== 'SUPER_ADMIN') {
            window.location.href = '/admin/dashboard'
        }
    }
  }, [status, session])

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/admin/users')
      if (response.ok) {
        const data = await response.json()
        setUsers(data.users || [])
      }
    } catch (error) {
      console.error('Failed to fetch users:', error)
      toast.error('Gagal memuat data pengguna')
    } finally {
      setLoading(false)
    }
  }

  // Edit State
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'ADMIN',
    password: ''
  })

  const roles = [
    { value: 'all', label: 'Semua Role' },
    { value: 'SUPER_ADMIN', label: 'Super Admin' },
    { value: 'ADMIN', label: 'Admin' },
    { value: 'DRIVER', label: 'Driver' },
    { value: 'CUSTOMER', label: 'Customer' } 
  ]

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'SUPER_ADMIN': return 'bg-rose-100 text-rose-800 border-rose-200'
      case 'ADMIN': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'DRIVER': return 'bg-amber-100 text-amber-800 border-amber-200'
      case 'CUSTOMER': return 'bg-stone-100 text-stone-800 border-stone-200'
      default: return 'bg-stone-50 text-stone-600 border-stone-200'
    }
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'SUPER_ADMIN': return <Shield className="h-3.5 w-3.5" />
      case 'ADMIN': return <User className="h-3.5 w-3.5" />
      case 'DRIVER': return <User className="h-3.5 w-3.5" />
      default: return <User className="h-3.5 w-3.5" />
    }
  }

  const resetForm = () => {
      setFormData({ name: '', email: '', phone: '', role: 'ADMIN', password: '' })
      setEditingId(null)
  }

  const handleEditClick = (user: User) => {
      setEditingId(user.id)
      setFormData({
          name: user.name,
          email: user.email,
          phone: user.phone || '',
          role: user.role,
          password: '' 
      })
      setShowDialog(true)
  }

  const handleSaveUser = async () => {
    try {
      const isEditing = !!editingId
      const url = isEditing ? `/api/admin/users/${editingId}` : '/api/admin/users'
      const method = isEditing ? 'PATCH' : 'POST'

      const response = await fetchWithCsrf(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      }, csrfToken)

      if (response.ok) {
        setShowDialog(false)
        resetForm()
        fetchUsers()
        toast.success(isEditing ? 'User berhasil diupdate' : 'User berhasil dibuat')
      } else {
          const err = await response.json()
          toast.error(err.error || 'Gagal menyimpan user')
      }
    } catch (error) {
      console.error('Failed to save user:', error)
      toast.error('Terjadi kesalahan jaringan')
    }
  }

  const toggleUserStatus = async (userId: string, currentStatus: boolean) => {
    try {
      const response = await fetchWithCsrf(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !currentStatus })
      }, csrfToken)

      if (response.ok) {
        fetchUsers()
        toast.success('Status berhasil diupdate')
      } else {
        toast.error('Gagal mengupdate status')
      }
    } catch (error) {
      toast.error('Error saat update status')
    }
  }

  const handleDeleteUser = async (id: string) => {
    try {
      const response = await fetchWithCsrf(`/api/admin/users/${id}`, {
        method: 'DELETE'
      }, csrfToken)

      if (response.ok) {
        setDeleteDialog(null)
        fetchUsers()
        toast.success('User berhasil dihapus')
      } else {
          const err = await response.json()
          toast.error(err.error || 'Gagal menghapus user')
      }
    } catch (error) {
      toast.error('Gagal menghapus user')
    }
  }

  // Bulk Actions
  const toggleSelectUser = (id: string) => {
    setSelectedUsers(prev => {
      const newSet = new Set(prev)
      if (newSet.has(id)) {
        newSet.delete(id)
      } else {
        newSet.add(id)
      }
      return newSet
    })
  }

  const toggleSelectAll = () => {
    if (selectedUsers.size === filteredUsers.length) {
      setSelectedUsers(new Set())
    } else {
      setSelectedUsers(new Set(filteredUsers.map(u => u.id)))
    }
  }

  const handleBulkAction = async (action: 'activate' | 'deactivate' | 'changeRole', role?: string) => {
    if (selectedUsers.size === 0) {
      toast.error('Pilih user terlebih dahulu')
      return
    }

    setBulkActionLoading(true)
    let successCount = 0
    let failCount = 0

    for (const userId of selectedUsers) {
      // Skip current user for safety
      if (userId === session?.user?.id) {
        failCount++
        continue
      }

      try {
        const payload: any = {}
        if (action === 'activate') payload.isActive = true
        if (action === 'deactivate') payload.isActive = false
        if (action === 'changeRole' && role) payload.role = role

        const response = await fetchWithCsrf(`/api/admin/users/${userId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        }, csrfToken)

        if (response.ok) successCount++
        else failCount++
      } catch {
        failCount++
      }
    }

    if (successCount > 0) toast.success(`${successCount} user berhasil diupdate`)
    if (failCount > 0) toast.error(`${failCount} user gagal diupdate`)
    
    setSelectedUsers(new Set())
    fetchUsers()
    setBulkActionLoading(false)
  }

  const handleBulkDelete = async () => {
    if (selectedUsers.size === 0) {
      toast.error('Pilih user terlebih dahulu')
      return
    }

    setBulkActionLoading(true)
    let successCount = 0
    let failCount = 0

    for (const userId of selectedUsers) {
      // Skip current user
      if (userId === session?.user?.id) {
        failCount++
        continue
      }

      try {
        const response = await fetchWithCsrf(`/api/admin/users/${userId}`, {
          method: 'DELETE'
        }, csrfToken)

        if (response.ok) successCount++
        else failCount++
      } catch {
        failCount++
      }
    }

    if (successCount > 0) toast.success(`${successCount} user berhasil dihapus`)
    if (failCount > 0) toast.error(`${failCount} user gagal dihapus`)
    
    setSelectedUsers(new Set())
    setShowBulkDeleteConfirm(false)
    fetchUsers()
    setBulkActionLoading(false)
  }

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesRole = roleFilter === 'all' || user.role === roleFilter
    return matchesSearch && matchesRole
  })

  // Safe Stats
  const userStats = {
    total: users.length,
    active: users.filter(u => u.isActive).length,
    inactive: users.filter(u => !u.isActive).length,
    superAdmins: users.filter(u => u.role === 'SUPER_ADMIN').length,
    admins: users.filter(u => u.role === 'ADMIN').length,
    drivers: users.filter(u => u.role === 'DRIVER').length
  }

  if (loading || (status === 'authenticated' && session?.user?.role !== 'SUPER_ADMIN')) {
    return (
       <div className="h-full flex items-center justify-center">
          <p className="text-stone-500 text-sm">Loading users...</p>
       </div>
    )
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {/* Minimal Header */}
      <div className="flex flex-col bg-white border-b border-stone-200 shrink-0">
        
        {/* Row 1: Title & Stats & Actions */}
        <div className="flex items-center justify-between px-3 py-2 border-b border-stone-100">
          <div className="flex items-center gap-4">
            <h1 className="text-base font-bold text-stone-900">Users</h1>
            <div className="h-4 w-px bg-stone-200" />
            
            {/* Inline Stats */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 bg-stone-50 px-2.5 py-1 rounded-md border border-stone-100">
                <User className="w-3.5 h-3.5 text-stone-600" />
                <div>
                  <p className="text-[10px] text-stone-500 font-medium uppercase leading-none">Total</p>
                  <p className="text-xs font-bold text-stone-900 leading-none mt-0.5">{userStats.total}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-1.5 bg-green-50 px-2.5 py-1 rounded-md border border-green-100">
                <ToggleRight className="w-3.5 h-3.5 text-green-600" />
                <div>
                  <p className="text-[10px] text-green-600 font-medium uppercase leading-none">Active</p>
                  <p className="text-xs font-bold text-green-700 leading-none mt-0.5">{userStats.active}</p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 bg-rose-50 px-2.5 py-1 rounded-md border border-rose-100">
                <Shield className="w-3.5 h-3.5 text-rose-600" />
                <div>
                  <p className="text-[10px] text-rose-600 font-medium uppercase leading-none">Super Admin</p>
                  <p className="text-xs font-bold text-rose-700 leading-none mt-0.5">{userStats.superAdmins}</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={fetchUsers}>
              <RefreshCw className="w-3.5 h-3.5" />
            </Button>
            <Button size="sm" className="h-7 text-xs px-3 bg-stone-900 hover:bg-stone-800" onClick={() => { resetForm(); setShowDialog(true); }}>
              <UserPlus className="w-3.5 h-3.5 mr-1.5" />
              Add User
            </Button>
          </div>
        </div>

        {/* Row 2: Search & Filters */}
        <div className="flex items-center justify-between px-3 py-2 bg-stone-50/50">
          <div className="flex items-center gap-2">
            <div className="relative w-64">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-stone-400" />
              <Input
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-8 pl-8 text-xs bg-white border-stone-200"
              />
            </div>
            
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-[140px] h-8 text-xs bg-white border-stone-200">
                <SelectValue placeholder="Filter Role" />
              </SelectTrigger>
              <SelectContent>
                {roles.map(role => (
                  <SelectItem key={role.value} value={role.value} className="text-xs">
                    {role.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Bulk Actions */}
          {selectedUsers.size > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-stone-600">
                {selectedUsers.size} selected
              </span>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="sm" variant="outline" className="h-8 w-8 p-0 border-stone-300" disabled={bulkActionLoading}>
                    <MoreHorizontal className="w-4 h-4 text-stone-600" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleBulkAction('activate')}>
                    <ToggleRight className="mr-2 h-4 w-4 text-green-600" />
                    Activate All
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleBulkAction('deactivate')}>
                    <ToggleLeft className="mr-2 h-4 w-4 text-stone-600" />
                    Deactivate All
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => handleBulkAction('changeRole', 'ADMIN')}>
                    <User className="mr-2 h-4 w-4 text-blue-600" />
                    Set as Admin
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleBulkAction('changeRole', 'DRIVER')}>
                    <User className="mr-2 h-4 w-4 text-amber-600" />
                    Set as Driver
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={() => setShowBulkDeleteConfirm(true)}
                    className="text-red-600 focus:text-red-600 focus:bg-red-50"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete All ({selectedUsers.size})
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setSelectedUsers(new Set())}>
                    Clear Selection
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>
      </div>

      {/* Users Table - Maximized */}
      <div className="flex-1 flex flex-col min-h-0 border rounded-lg bg-white relative mx-3 mb-3">
          {/* Fixed Header */}
          <div className="bg-stone-50 border-b z-20 shrink-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10 pl-4">
                    <Checkbox 
                      checked={selectedUsers.size === filteredUsers.length && filteredUsers.length > 0}
                      onCheckedChange={toggleSelectAll}
                    />
                  </TableHead>
                  <TableHead className="font-semibold">User</TableHead>
                  <TableHead className="font-semibold">Contact</TableHead>
                  <TableHead className="font-semibold">Role</TableHead>
                  <TableHead className="font-semibold">Status</TableHead>
                  <TableHead className="font-semibold">Joined</TableHead>
                  <TableHead className="font-semibold text-right pr-4">Actions</TableHead>
                </TableRow>
              </TableHeader>
            </Table>
          </div>

          {/* Scrollable Body */}
          <div className="absolute inset-0 top-[45px] overflow-y-auto">
            <Table>
              <TableBody>
                {filteredUsers.length === 0 ? (
                  <TableRow>
                     <TableCell colSpan={7} className="h-24 text-center text-stone-500 text-sm">
                        <User className="w-12 h-12 mx-auto mb-2 opacity-20" />
                        Tidak ada user ditemukan.
                     </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((user) => (
                      <TableRow 
                        key={user.id} 
                        className={`hover:bg-stone-50 ${selectedUsers.has(user.id) ? 'bg-blue-50' : ''}`}
                      >
                      <TableCell className="pl-4">
                        <Checkbox 
                          checked={selectedUsers.has(user.id)}
                          onCheckedChange={() => toggleSelectUser(user.id)}
                        />
                      </TableCell>
                      <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 bg-stone-100 rounded-full flex items-center justify-center border border-stone-200 shrink-0">
                                <span className="text-sm font-bold text-stone-600">{user.name.charAt(0).toUpperCase()}</span>
                            </div>
                            <div>
                                <div className="font-medium text-stone-900">{user.name}</div>
                                {user.lastLogin ? (
                                    <div className="text-[10px] text-stone-400">
                                        Last login: {new Date(user.lastLogin).toLocaleDateString('id-ID')}
                                    </div>
                                ) : (
                                    <div className="text-[10px] text-stone-400 italic">Never logged in</div>
                                )}
                            </div>
                          </div>
                      </TableCell>
                      <TableCell>
                          <div className="space-y-1">
                            <div className="flex items-center text-xs text-stone-600">
                                <Mail className="h-3 w-3 mr-1.5 text-stone-400" />
                                {user.email}
                            </div>
                            {user.phone && (
                                <div className="flex items-center text-xs text-stone-600">
                                  <Phone className="h-3 w-3 mr-1.5 text-stone-400" />
                                  {user.phone}
                                </div>
                            )}
                          </div>
                      </TableCell>
                      <TableCell>
                          <Badge variant="outline" className={`font-normal ${getRoleColor(user.role)}`}>
                            <div className="flex items-center gap-1.5">
                                {getRoleIcon(user.role)}
                                <span className="capitalize">{user.role.replace('_', ' ').toLowerCase()}</span>
                            </div>
                          </Badge>
                      </TableCell>
                      <TableCell>
                          <div className="flex items-center gap-2">
                            <Switch
                                checked={user.isActive}
                                onCheckedChange={() => toggleUserStatus(user.id, user.isActive)}
                                disabled={user.id === session?.user?.id}
                                className="scale-90"
                            />
                            <span className={`text-xs font-medium ${user.isActive ? 'text-green-600' : 'text-stone-400'}`}>
                                {user.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                      </TableCell>
                      <TableCell className="text-xs text-stone-500">
                          {new Date(user.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </TableCell>
                      <TableCell className="text-right pr-4">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                  <Edit className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleEditClick(user)}>
                                  <Edit className="mr-2 h-4 w-4" />
                                  Edit Details
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  className="text-red-600 focus:text-red-600 focus:bg-red-50"
                                  onClick={() => setDeleteDialog(user.id)}
                                  disabled={user.id === session?.user?.id}
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete Account
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                      </TableCell>
                      </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
      </div>

      {/* Add/Edit User Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit User' : 'Tambah User Baru'}</DialogTitle>
            <DialogDescription>
              {editingId ? 'Update informasi pengguna' : 'Buat akun pengguna baru untuk sistem'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Nama Lengkap</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                placeholder="Masukkan nama lengkap"
                className="border-stone-200"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                placeholder="email@contoh.com"
                className="border-stone-200"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="phone">No. Telepon</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                placeholder="0812..."
                className="border-stone-200"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="role">Role</Label>
              <Select value={formData.role} onValueChange={(value) => setFormData({...formData, role: value})}>
                <SelectTrigger className="border-stone-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ADMIN">Admin</SelectItem>
                  <SelectItem value="DRIVER">Driver</SelectItem>
                  <SelectItem value="SUPER_ADMIN">Super Admin</SelectItem>
                  <SelectItem value="CUSTOMER">Customer</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Password {editingId && '(Kosongkan jika tidak diubah)'}</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                placeholder={editingId ? "Password baru (opsional)" : "Masukkan password"}
                className="border-stone-200"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Batal
            </Button>
            <Button onClick={handleSaveUser} className="bg-stone-900 hover:bg-stone-800">
              {editingId ? 'Simpan Perubahan' : 'Buat User'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteDialog} onOpenChange={() => setDeleteDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-rose-600 flex items-center gap-2">
               <Trash2 className="w-5 h-5" />
               Hapus User?
            </DialogTitle>
            <DialogDescription>
              Tindakan ini tidak dapat dibatalkan. Akun ini akan dihapus secara permanen dari sistem.
            </DialogDescription>
          </DialogHeader>
          <div className="py-2">
             <div className="bg-rose-50 border border-rose-200 p-3 rounded-md text-xs text-rose-800">
                Peringatan: Menghapus user mungkin akan mempengaruhi data historis order yang terkait.
             </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialog(null)}>
              Batal
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => deleteDialog && handleDeleteUser(deleteDialog)}
            >
              Ya, Hapus Permanen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Delete Confirmation Dialog */}
      <Dialog open={showBulkDeleteConfirm} onOpenChange={setShowBulkDeleteConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-rose-600 flex items-center gap-2">
               <Trash2 className="w-5 h-5" />
               Hapus {selectedUsers.size} User?
            </DialogTitle>
            <DialogDescription>
              Tindakan ini tidak dapat dibatalkan. {selectedUsers.size} akun akan dihapus secara permanen dari sistem.
            </DialogDescription>
          </DialogHeader>
          <div className="py-2">
             <div className="bg-rose-50 border border-rose-200 p-3 rounded-md text-xs text-rose-800">
                ⚠️ Peringatan: Menghapus user secara massal mungkin akan mempengaruhi data historis order yang terkait.
             </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBulkDeleteConfirm(false)} disabled={bulkActionLoading}>
              Batal
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleBulkDelete}
              disabled={bulkActionLoading}
            >
              {bulkActionLoading ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Menghapus...
                </>
              ) : (
                <>
                  Ya, Hapus {selectedUsers.size} User
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}