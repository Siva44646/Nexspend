import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from '@/hooks/use-toast'
import { User, Mail, Moon, Sun, Globe, LogOut } from 'lucide-react'

export default function Profile() {
  const { user, signOut } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [profile, setProfile] = useState({
    full_name: '',
    currency: 'USD',
    language: 'en',
    theme: 'system'
  })

  useEffect(() => {
    if (user) {
      getProfile()
    }
  }, [user])

  async function getProfile() {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('full_name, currency, language, theme')
        .eq('id', user?.id)
        .single()

      if (error) throw error
      if (data) {
        setProfile({
          full_name: data.full_name || '',
          currency: data.currency || 'USD',
          language: data.language || 'en',
          theme: data.theme || 'system'
        })
        
        // Apply theme
        if (data.theme === 'dark' || (data.theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
          document.documentElement.classList.add('dark')
        } else {
          document.documentElement.classList.remove('dark')
        }
      }
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' })
    }
  }

  async function updateProfile(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: profile.full_name,
          currency: profile.currency,
          language: profile.language,
          theme: profile.theme,
          updated_at: new Date().toISOString()
        })
        .eq('id', user?.id)

      if (error) throw error
      toast({ title: 'Success', description: 'Profile updated successfully' })
      
      // Apply theme immediately
      if (profile.theme === 'dark' || (profile.theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        document.documentElement.classList.add('dark')
      } else {
        document.documentElement.classList.remove('dark')
      }
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Profile & Settings</h2>
        <p className="text-muted-foreground">Manage your account preferences and settings.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="col-span-1 border-none shadow-md bg-white/50 dark:bg-zinc-900/50 backdrop-blur-xl">
          <CardHeader>
            <CardTitle>Account Info</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-col items-center justify-center space-y-4">
              <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-3xl font-bold text-white shadow-lg">
                {profile.full_name ? profile.full_name.charAt(0).toUpperCase() : user?.email?.charAt(0).toUpperCase()}
              </div>
              <div className="text-center">
                <h3 className="font-semibold text-lg">{profile.full_name || 'User'}</h3>
                <p className="text-sm text-muted-foreground flex items-center justify-center gap-1">
                  <Mail className="h-3 w-3" /> {user?.email}
                </p>
              </div>
            </div>

            <Button variant="outline" className="w-full text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/20" onClick={() => signOut()}>
              <LogOut className="mr-2 h-4 w-4" /> Sign Out
            </Button>
          </CardContent>
        </Card>

        <Card className="col-span-2 border-none shadow-md bg-white/50 dark:bg-zinc-900/50 backdrop-blur-xl">
          <CardHeader>
            <CardTitle>Settings</CardTitle>
            <CardDescription>Update your personal information and app preferences.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={updateProfile} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input 
                    id="fullName" 
                    value={profile.full_name} 
                    onChange={e => setProfile({...profile, full_name: e.target.value})} 
                    className="pl-9"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Currency</Label>
                  <Select value={profile.currency} onValueChange={v => setProfile({...profile, currency: v})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD ($)</SelectItem>
                      <SelectItem value="EUR">EUR (€)</SelectItem>
                      <SelectItem value="GBP">GBP (£)</SelectItem>
                      <SelectItem value="INR">INR (₹)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Language</Label>
                  <Select value={profile.language} onValueChange={v => setProfile({...profile, language: v})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="es">Español</SelectItem>
                      <SelectItem value="fr">Français</SelectItem>
                      <SelectItem value="de">Deutsch</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Theme Preference</Label>
                <Select value={profile.theme} onValueChange={v => setProfile({...profile, theme: v})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light"><span className="flex items-center gap-2"><Sun className="h-4 w-4"/> Light</span></SelectItem>
                    <SelectItem value="dark"><span className="flex items-center gap-2"><Moon className="h-4 w-4"/> Dark</span></SelectItem>
                    <SelectItem value="system"><span className="flex items-center gap-2"><Globe className="h-4 w-4"/> System</span></SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button type="submit" className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white" disabled={loading}>
                {loading ? 'Saving...' : 'Save Changes'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
