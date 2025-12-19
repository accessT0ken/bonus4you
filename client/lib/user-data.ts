export type UserRole = "moderator" | "admin" | "owner"
export type Permission = "manage_users" | "manage_casinos" | "edit_reviews" | "view_stats" | "publish_content" | "manage_system"

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

export interface NewUserInput {
  email: string
  name: string
  role: UserRole
  password: string
}

export const rolePermissions: Record<UserRole, Permission[]> = {
  moderator: ["manage_casinos", "edit_reviews", "view_stats", "publish_content"],
  admin: ["manage_users", "manage_casinos", "edit_reviews", "view_stats", "publish_content"],
  owner: ["manage_users", "manage_casinos", "edit_reviews", "view_stats", "publish_content", "manage_system"],
}

function transformApiUser(apiUser: any): User {
  let permissions: Permission[] = []
  if (apiUser.permissions) {
    if (typeof apiUser.permissions === 'string') {
      try {
        permissions = JSON.parse(apiUser.permissions)
      } catch (e) {
        console.error('Failed to parse permissions:', e)
        permissions = []
      }
    } else if (Array.isArray(apiUser.permissions)) {
      permissions = apiUser.permissions
    }
  }
  
  return {
    id: String(apiUser.id),
    email: apiUser.email,
    name: apiUser.name,
    role: apiUser.role,
    permissions,
    createdAt: apiUser.created_at || apiUser.createdAt,
    lastLogin: apiUser.last_login || apiUser.lastLogin,
    isActive: apiUser.isActive !== undefined ? apiUser.isActive : (apiUser.is_active === 1),
  }
}

export async function getUsers(): Promise<User[]> {
  if (typeof window === "undefined") {
    return []
  }

  try {
    const { usersApi } = await import('./api-client')
    let allUsers: User[] = []
    let page = 1
    const limit = 100 // Max allowed by API
    
    while (true) {
      const response = await usersApi.getAll({ page, limit })
      
      if (response.data && Array.isArray(response.data)) {
        const users = response.data.map(transformApiUser)
        allUsers = [...allUsers, ...users]
        
        if (users.length < limit) {
          break
        }
        page++
      } else {
        break
      }
      
      if (page > 100) {
        break
      }
    }
    
    return allUsers
  } catch (error) {
    console.error('Failed to fetch users:', error)
    return []
  }
}

export async function getUserByEmail(email: string): Promise<User | undefined> {
  const users = await getUsers()
  return users.find((u) => u.email === email)
}

export async function createUser(user: NewUserInput): Promise<User> {
  if (typeof window === "undefined") {
    throw new Error('Cannot create user on server side')
  }

  try {
    const { usersApi } = await import('./api-client')
    const response = await usersApi.create({
      email: user.email,
      name: user.name,
      password: user.password,
      role: user.role,
    })
    
    if (response.data) {
      return transformApiUser(response.data)
    }
    
    throw new Error('Failed to create user')
  } catch (error) {
    console.error('Failed to create user:', error)
    throw error
  }
}

export async function updateUser(userId: string, updates: Partial<User> & { password?: string }): Promise<boolean> {
  if (typeof window === "undefined") {
    return false
  }

  try {
    const { usersApi } = await import('./api-client')
    
    const apiUpdates: any = {}
    if (updates.name !== undefined) apiUpdates.name = updates.name
    if (updates.role !== undefined) apiUpdates.role = updates.role
    if (updates.isActive !== undefined) apiUpdates.isActive = updates.isActive
    if (updates.password !== undefined) apiUpdates.password = updates.password

    await usersApi.update(userId, apiUpdates)
    return true
  } catch (error) {
    console.error('Failed to update user:', error)
    return false
  }
}

export async function updateMyPassword(password: string): Promise<boolean> {
  if (typeof window === "undefined") {
    return false
  }

  try {
    const { usersApi } = await import('./api-client')
    await usersApi.updateMePassword(password)
    return true
  } catch (error) {
    console.error('Failed to update own password:', error)
    return false
  }
}

export async function deleteUser(userId: string): Promise<boolean> {
  if (typeof window === "undefined") {
    return false
  }

  try {
    const { usersApi } = await import('./api-client')
    await usersApi.delete(userId)
    return true
  } catch (error) {
    console.error('Failed to delete user:', error)
    return false
  }
}

export function hasPermission(user: User | null, permission: Permission): boolean {
  if (!user || !user.isActive) {
    return false
  }
  
  if (user.role === 'owner') {
    return true
  }
  
  return user.permissions.includes(permission)
}

export async function getCurrentUser(): Promise<User | null> {
  if (typeof window === "undefined") {
    return null
  }

  const token = localStorage.getItem('auth_token')
  const userEmail = localStorage.getItem('admin_email')
  
  if (!token || !userEmail) {
    return null
  }

  try {
    return await getUserByEmail(userEmail)
  } catch (error) {
    console.error('Failed to get current user:', error)
    return null
  }
}

export async function loginUser(email: string, password: string): Promise<{ user: User; token: string }> {
  if (typeof window === "undefined") {
    throw new Error('Cannot login on server side')
  }

  try {
    const { usersApi } = await import('./api-client')
    const response = await usersApi.login(email, password)
    
    if (response.data && response.data.user && response.data.token) {
      const user = transformApiUser(response.data.user)
      
      localStorage.setItem('auth_token', response.data.token)
      localStorage.setItem('admin_email', user.email)
      
      return {
        user,
        token: response.data.token,
      }
    }
    
    throw new Error('Login failed')
  } catch (error) {
    console.error('Failed to login:', error)
    throw error
  }
}

export function logoutUser(): void {
  if (typeof window === "undefined") {
    return
  }
  
  localStorage.removeItem('auth_token')
  localStorage.removeItem('admin_email')
}
