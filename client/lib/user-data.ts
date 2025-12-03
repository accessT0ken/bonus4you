// User data structure and management
export type UserRole = "admin" | "editor" | "viewer"
export type Permission = "manage_users" | "manage_casinos" | "edit_reviews" | "view_stats" | "publish_content"

export interface User {
  id: string
  email: string
  name: string
  role: UserRole
  permissions: Permission[]
  createdAt: string
  lastLogin?: string
  isActive: boolean
}

// Role permissions mapping
export const rolePermissions: Record<UserRole, Permission[]> = {
  admin: ["manage_users", "manage_casinos", "edit_reviews", "view_stats", "publish_content"],
  editor: ["manage_casinos", "edit_reviews", "view_stats", "publish_content"],
  viewer: ["view_stats"],
}

// Default users
export const defaultUsers: User[] = [
  {
    id: "1",
    email: "admin@bonus4you.com",
    name: "Admin User",
    role: "admin",
    permissions: rolePermissions.admin,
    createdAt: "2025-01-01",
    lastLogin: new Date().toISOString(),
    isActive: true,
  },
  {
    id: "2",
    email: "editor@bonus4you.com",
    name: "Editor User",
    role: "editor",
    permissions: rolePermissions.editor,
    createdAt: "2025-01-05",
    isActive: true,
  },
]

// Get users from localStorage or return defaults
export function getUsers(): User[] {
  if (typeof window === "undefined") return defaultUsers
  const stored = localStorage.getItem("users")
  if (stored) {
    try {
      return JSON.parse(stored)
    } catch {
      return defaultUsers
    }
  }
  // Initialize with defaults
  localStorage.setItem("users", JSON.stringify(defaultUsers))
  return defaultUsers
}

// Save users to localStorage
export function saveUsers(users: User[]) {
  if (typeof window === "undefined") return
  localStorage.setItem("users", JSON.stringify(users))
}

// Get user by email
export function getUserByEmail(email: string): User | undefined {
  const users = getUsers()
  return users.find((u) => u.email === email)
}

// Create new user
export function createUser(user: Omit<User, "id" | "createdAt">): User {
  const users = getUsers()
  const newUser: User = {
    ...user,
    id: Date.now().toString(),
    createdAt: new Date().toISOString().split("T")[0],
    permissions: rolePermissions[user.role],
  }
  users.push(newUser)
  saveUsers(users)
  return newUser
}

// Update user
export function updateUser(userId: string, updates: Partial<User>): boolean {
  const users = getUsers()
  const index = users.findIndex((u) => u.id === userId)
  if (index !== -1) {
    users[index] = {
      ...users[index],
      ...updates,
      // Update permissions based on role if role changed
      permissions: updates.role ? rolePermissions[updates.role] : users[index].permissions,
    }
    saveUsers(users)
    return true
  }
  return false
}

// Delete user
export function deleteUser(userId: string): boolean {
  const users = getUsers()
  const filtered = users.filter((u) => u.id !== userId)
  if (filtered.length < users.length) {
    saveUsers(filtered)
    return true
  }
  return false
}

// Check if user has permission
export function hasPermission(user: User | null, permission: Permission): boolean {
  if (!user || !user.isActive) return false
  return user.permissions.includes(permission)
}

// Get current user from auth
export function getCurrentUser(): User | null {
  if (typeof window === "undefined") return null
  const email = localStorage.getItem("admin_email")
  if (email) {
    return getUserByEmail(email) || null
  }
  return null
}

