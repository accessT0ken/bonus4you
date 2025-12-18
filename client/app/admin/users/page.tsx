"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Edit, Trash2, Shield, User as UserIcon } from "lucide-react"
import {
  getUsers,
  createUser,
  updateUser,
  deleteUser,
  type User,
  type UserRole,
  rolePermissions,
} from "@/lib/user-data"
import { getCurrentUser, hasPermission } from "@/lib/user-data"
import { useToast } from "@/hooks/use-toast"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

export default function UsersPage() {
  const { toast } = useToast()
  const [users, setUsers] = useState<User[]>([])
  const [isCreating, setIsCreating] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    email: "",
    name: "",
    role: "moderator" as UserRole,
    isActive: true,
    password: "",
    confirmPassword: "",
  })
  const [currentUser, setCurrentUser] = useState<User | null>(null)

  useEffect(() => {
    getUsers().then((usersList) => {
      setUsers(usersList)
    }).catch((error) => {
      console.error('Failed to load users:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load users. Please refresh the page.",
      })
    })
    
    getCurrentUser().then((user) => {
      setCurrentUser(user)
    })
  }, [])

  const canManageUsers = hasPermission(currentUser, "manage_users")

  const handleCreate = () => {
    setIsCreating(true)
    setEditingId(null)
    setFormData({
      email: "",
      name: "",
      role: "moderator",
      isActive: true,
      password: "",
      confirmPassword: "",
    })
  }

  const handleEdit = (user: User) => {
    setEditingId(user.id)
    setIsCreating(false)
    setFormData({
      email: user.email,
      name: user.name,
      role: user.role,
      isActive: user.isActive,
      password: "",
      confirmPassword: "",
    })
  }

  const handleSave = async () => {
    if (!formData.name || !formData.email) {
      toast({
        variant: "warning",
        title: "Validation Error",
        description: "Please fill in all required fields.",
      })
      return
    }

    // Validate password fields
    if (formData.password || formData.confirmPassword) {
      if (formData.password.length < 6 && !editingId) {
        toast({
          variant: "warning",
          title: "Validation Error",
          description: "Password must be at least 6 characters.",
        })
        return
      }

      if (formData.password !== formData.confirmPassword) {
        toast({
          variant: "warning",
          title: "Validation Error",
          description: "Passwords do not match.",
        })
        return
      }
    } else if (!editingId) {
      // Creating a new user requires a password
      toast({
        variant: "warning",
        title: "Validation Error",
        description: "Please provide a password for the new user.",
      })
      return
    }

    try {
      if (editingId) {
        // Update existing user
        const success = await updateUser(editingId, {
          email: formData.email,
          name: formData.name,
          role: formData.role,
          isActive: formData.isActive,
          // Only send password if provided (allows changing password in panel)
          ...(formData.password ? { password: formData.password } : {}),
        })
        if (success) {
          const updatedUsers = await getUsers()
          setUsers(updatedUsers)
          setEditingId(null)
          toast({
            variant: "success",
            title: "User Updated",
            description: "User has been successfully updated.",
          })
        } else {
          toast({
            variant: "destructive",
            title: "Update Failed",
            description: "Failed to update user. Please try again.",
          })
        }
      } else {
        // Create new user
        await createUser({
          email: formData.email,
          name: formData.name,
          role: formData.role,
          password: formData.password,
        })
        const updatedUsers = await getUsers()
        setUsers(updatedUsers)
        setIsCreating(false)
        toast({
          variant: "success",
          title: "User Created",
          description: "New user has been successfully created.",
        })
      }
    } catch (error: any) {
      console.error('Failed to save user:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to save user. Please try again.",
      })
    }
    
    setFormData({
      email: "",
      name: "",
      role: "moderator",
      isActive: true,
      password: "",
      confirmPassword: "",
    })
  }

  const handleDelete = async (id: string) => {
    if (id === currentUser?.id) {
      toast({
        variant: "warning",
        title: "Cannot Delete Account",
        description: "You cannot delete your own account!",
      })
      return
    }
    
    try {
      const success = await deleteUser(id)
      if (success) {
        const updatedUsers = await getUsers()
        setUsers(updatedUsers)
        toast({
          variant: "success",
          title: "User Deleted",
          description: "User has been successfully deleted.",
        })
      } else {
        toast({
          variant: "destructive",
          title: "Delete Failed",
          description: "Failed to delete user. Please try again.",
        })
      }
    } catch (error: any) {
      console.error('Failed to delete user:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to delete user. Please try again.",
      })
    }
  }

  const handleCancel = () => {
    setIsCreating(false)
    setEditingId(null)
    setFormData({
      email: "",
      name: "",
      role: "moderator",
      isActive: true,
      password: "",
      confirmPassword: "",
    })
  }

  if (!canManageUsers) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
          <p className="text-muted-foreground">You don't have permission to manage users.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
          <p className="text-muted-foreground">Manage users, roles, and permissions</p>
        </div>
        <Button onClick={handleCreate} className="gap-2">
          <Plus className="h-4 w-4" />
          New User
        </Button>
      </div>

      {(isCreating || editingId) && (
        <Card>
          <CardHeader>
            <CardTitle>{editingId ? "Edit User" : "Create New User"}</CardTitle>
            <CardDescription>Set user details and role</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="John Doe"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="user@bonus4you.com"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <select
                id="role"
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
              >
                <option value="moderator">Moderator</option>
                <option value="admin">Admin</option>
                <option value="owner">Owner</option>
              </select>
              <p className="text-xs text-muted-foreground mt-1">
                Permissions: {rolePermissions[formData.role].join(", ")}
              </p>
            </div>

            {/* Password fields */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="password">
                  {editingId ? "New Password" : "Password"}{!editingId && " *"}
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder={editingId ? "Leave blank to keep current password" : "Enter password"}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">
                  {editingId ? "Confirm New Password" : "Confirm Password"}{!editingId && " *"}
                </Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  placeholder={editingId ? "Repeat new password" : "Repeat password"}
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="rounded"
              />
              <Label htmlFor="isActive" className="cursor-pointer">
                Active User
              </Label>
            </div>

            <div className="flex gap-2">
              <Button onClick={handleSave}>Save User</Button>
              <Button variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>All Users</CardTitle>
          <CardDescription>Manage user accounts and permissions</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Permissions</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Login</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    No users found
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <UserIcon className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <div className="font-medium">{user.name}</div>
                          <div className="text-sm text-muted-foreground">{user.email}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold ${
                          user.role === "owner"
                            ? "bg-red-100 text-red-800"
                            : user.role === "admin"
                              ? "bg-purple-100 text-purple-800"
                              : "bg-blue-100 text-blue-800"
                        }`}
                      >
                        <Shield className="h-3 w-3" />
                        {user.role}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {user.permissions.slice(0, 2).map((perm) => (
                          <span
                            key={perm}
                            className="text-xs px-2 py-0.5 bg-secondary rounded text-muted-foreground"
                          >
                            {perm.replace("_", " ")}
                          </span>
                        ))}
                        {user.permissions.length > 2 && (
                          <span className="text-xs text-muted-foreground">
                            +{user.permissions.length - 2} more
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-semibold ${
                          user.isActive
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {user.isActive ? "Active" : "Inactive"}
                      </span>
                    </TableCell>
                    <TableCell>
                      {user.lastLogin ? (
                        <span className="text-sm text-muted-foreground">
                          {new Date(user.lastLogin).toLocaleDateString()}
                        </span>
                      ) : (
                        <span className="text-sm text-muted-foreground">Never</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(user)}
                          title="Edit"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        {user.id !== currentUser?.id && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                title="Delete"
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete user?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This will permanently remove{" "}
                                  <span className="font-semibold">{user.email}</span> and their access. This cannot
                                  be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  onClick={() => handleDelete(user.id)}
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

