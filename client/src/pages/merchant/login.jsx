import { useState } from 'react';
import { useLocation } from 'wouter';
import { useMerchantAuth } from '@/contexts/MerchantAuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Eye, EyeOff } from 'lucide-react';
export default function MerchantLogin() {
    const [, setLocation] = useLocation();
    const { login, isAuthenticated, isLoading: authLoading } = useMerchantAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    // Redirect if already authenticated
    if (authLoading) {
        return (<div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500"/>
      </div>);
    }
    if (isAuthenticated) {
        setLocation('/merchant/dashboard');
        return null;
    }
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        const result = await login(email, password);
        if (result.success) {
            setLocation('/merchant/dashboard');
        }
        else {
            setError(result.error || 'Login failed');
        }
        setIsLoading(false);
    };
    return (<div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      <Card className="w-full max-w-md bg-slate-800/50 border-slate-700 backdrop-blur-sm">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4">
            <svg className="w-16 h-auto text-white" viewBox="0 0 800 210" xmlns="http://www.w3.org/2000/svg">
              <text x="40" y="145" fill="currentColor" fontFamily="Comic Sans MS, Comic Sans, cursive" fontStyle="italic" fontWeight="700" fontSize="130" letterSpacing="-3">
                Mirror
              </text>
              <rect x="455" y="128" width="14" height="14" fill="currentColor" transform="rotate(45 462 135)"/>
              <text x="482" y="145" fill="currentColor" fontFamily="Inter, Arial, sans-serif" fontWeight="600" fontSize="90">
                me
              </text>
            </svg>
          </div>
          <CardTitle className="text-2xl text-white">Merchant Portal</CardTitle>
          <CardDescription className="text-slate-400">
            Sign in to manage your virtual try-on integration
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (<Alert variant="destructive" className="bg-red-900/50 border-red-800 text-red-200">
                <AlertDescription>{error}</AlertDescription>
              </Alert>)}

            <div className="space-y-2">
              <Label htmlFor="email" className="text-slate-200">Email</Label>
              <Input id="email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500 focus:border-indigo-500 focus:ring-indigo-500"/>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-slate-200">Password</Label>
              <div className="relative">
                <Input id="password" type={showPassword ? 'text' : 'password'} placeholder="Enter your password" value={password} onChange={(e) => setPassword(e.target.value)} required className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500 focus:border-indigo-500 focus:ring-indigo-500 pr-10"/>
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300">
                  {showPassword ? <EyeOff className="h-4 w-4"/> : <Eye className="h-4 w-4"/>}
                </button>
              </div>
            </div>

            <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white" disabled={isLoading}>
              {isLoading ? (<>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin"/>
                  Signing in...
                </>) : ('Sign In')}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-slate-400">
            Don't have an account?{' '}
            <a href="/merchant/register" onClick={(e) => {
            e.preventDefault();
            setLocation('/merchant/register');
        }} className="text-indigo-400 hover:text-indigo-300 font-medium">
              Create one
            </a>
          </div>

          <div className="mt-4 text-center">
            <a href="/" onClick={(e) => {
            e.preventDefault();
            setLocation('/');
        }} className="text-sm text-slate-500 hover:text-slate-400">
              Back to home
            </a>
          </div>
        </CardContent>
      </Card>
    </div>);
}
