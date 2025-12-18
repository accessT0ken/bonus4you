"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { getCurrentUser, updateMyPassword, type User } from "@/lib/user-data"
import { useToast } from "@/hooks/use-toast"

export default function AccountPage() {
  const { toast } = useToast()
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    getCurrentUser()
      .then((user) => {
        setCurrentUser(user)
      })
      .finally(() => setIsLoading(false))
  }, [])

  const handleChangePassword = async () => {
    if (!password || !confirmPassword) {
      toast({
        variant: "warning",
        title: "Validation Error",
        description: "Please fill in both password fields.",
      })
      return
    }

    if (password.length < 6) {
      toast({
        variant: "warning",
        title: "Validation Error",
        description: "Password must be at least 6 characters long.",
      })
      return
    }

    if (password !== confirmPassword) {
      toast({
        variant: "warning",
        title: "Validation Error",
        description: "Passwords do not match.",
      })
      return
    }

    try {
      setIsSaving(true)
      const success = await updateMyPassword(password)

      if (success) {
        toast({
          variant: "success",
          title: "Password Updated",
          description: "Your password has been successfully changed.",
        })
        setPassword("")
        setConfirmPassword("")
      } else {
        toast({
          variant: "destructive",
          title: "Update Failed",
          description: "Failed to update password. Please try again.",
        })
      }
    } catch (error: any) {
      console.error("Failed to update password:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: error?.message || "Failed to update password. Please try again.",
      })
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-6 w-40 rounded bg-muted animate-pulse" />
        <div className="h-32 w-full rounded bg-muted animate-pulse" />
      </div>
    )
  }

  if (!currentUser) {
    return (
      <div className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight">Account</h1>
        <p className="text-muted-foreground">Unable to load your account details.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Account</h1>
        <p className="text-muted-foreground">Manage your admin account and change your password.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>Basic information about your admin account.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1">
              <Label>Email</Label>
              <Input value={currentUser.email} disabled />
            </div>
            <div className="space-y-1">
              <Label>Role</Label>
              <Input value={currentUser.role} disabled />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Change Password</CardTitle>
          <CardDescription>
            Set a new password for your admin account. Make sure it&apos;s something strong.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="new-password">New Password</Label>
              <Input
                id="new-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter new password"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm New Password</Label>
              <Input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repeat new password"
              />
            </div>
          </div>

          <Button onClick={handleChangePassword} disabled={isSaving}>
            {isSaving ? "Saving..." : "Update Password"}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}


