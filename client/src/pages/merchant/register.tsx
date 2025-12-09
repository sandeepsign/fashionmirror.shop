import { useState } from 'react';
import { useLocation } from 'wouter';
import { useMerchantAuth } from '@/contexts/MerchantAuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Eye, EyeOff, CheckCircle } from 'lucide-react';

export default function MerchantRegister() {
  const [, setLocation] = useLocation();
  const { register, isAuthenticated, isLoading: authLoading } = useMerchantAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Redirect if already authenticated
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  if (isAuthenticated) {
    setLocation('/merchant/dashboard');
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (name.trim().length < 2) {
      setError('Business name must be at least 2 characters');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);

    const result = await register({
      name: name.trim(),
      email,
      password,
      websiteUrl: websiteUrl.trim() || undefined
    });

    if (result.success) {
      setLocation('/merchant/dashboard');
    } else {
      setError(result.error || 'Registration failed');
    }

    setIsLoading(false);
  };

  const features = [
    'Virtual try-on for your e-commerce store',
    '100 free try-ons per month',
    'Easy JavaScript widget integration',
    'Real-time analytics dashboard'
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Features Panel */}
        <div className="hidden md:flex flex-col justify-center p-8">
          <div className="mb-6">
            <svg className="w-32 h-auto text-white" viewBox="0 0 800 210" xmlns="http://www.w3.org/2000/svg">
              <text x="40" y="145"
                    fill="currentColor"
                    fontFamily="Comic Sans MS, Comic Sans, cursive"
                    fontStyle="italic"
                    fontWeight="700"
                    fontSize="130"
                    letterSpacing="-3">
                Mirror
              </text>
              <rect x="455" y="128" width="14" height="14"
                    fill="currentColor"
                    transform="rotate(45 462 135)" />
              <text x="482" y="145"
                    fill="currentColor"
                    fontFamily="Inter, Arial, sans-serif"
                    fontWeight="600"
                    fontSize="90">
                me
              </text>
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-white mb-4">
            Boost conversions with virtual try-on
          </h2>
          <p className="text-slate-400 mb-6">
            Let your customers see how clothes look on them before buying. Reduce returns and increase customer satisfaction.
          </p>
          <ul className="space-y-3">
            {features.map((feature, index) => (
              <li key={index} className="flex items-center gap-3 text-slate-300">
                <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Registration Form */}
        <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
          <CardHeader className="text-center md:text-left">
            <div className="md:hidden mx-auto mb-4">
              <svg className="w-16 h-auto text-white" viewBox="0 0 800 210" xmlns="http://www.w3.org/2000/svg">
                <text x="40" y="145"
                      fill="currentColor"
                      fontFamily="Comic Sans MS, Comic Sans, cursive"
                      fontStyle="italic"
                      fontWeight="700"
                      fontSize="130"
                      letterSpacing="-3">
                  Mirror
                </text>
                <rect x="455" y="128" width="14" height="14"
                      fill="currentColor"
                      transform="rotate(45 462 135)" />
                <text x="482" y="145"
                      fill="currentColor"
                      fontFamily="Inter, Arial, sans-serif"
                      fontWeight="600"
                      fontSize="90">
                  me
                </text>
              </svg>
            </div>
            <CardTitle className="text-xl text-white">Create Your Account</CardTitle>
            <CardDescription className="text-slate-400">
              Start your free trial - no credit card required
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert variant="destructive" className="bg-red-900/50 border-red-800 text-red-200">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="name" className="text-slate-200">Business Name</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Your store name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500 focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-200">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500 focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="websiteUrl" className="text-slate-200">Website URL (optional)</Label>
                <Input
                  id="websiteUrl"
                  type="url"
                  placeholder="https://yourstore.com"
                  value={websiteUrl}
                  onChange={(e) => setWebsiteUrl(e.target.value)}
                  className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500 focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-slate-200">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="At least 8 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={8}
                    className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500 focus:border-indigo-500 focus:ring-indigo-500 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-slate-200">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Repeat your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500 focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating account...
                  </>
                ) : (
                  'Create Account'
                )}
              </Button>
            </form>

            <div className="mt-6 text-center text-sm text-slate-400">
              Already have an account?{' '}
              <a
                href="/merchant/login"
                onClick={(e) => {
                  e.preventDefault();
                  setLocation('/merchant/login');
                }}
                className="text-indigo-400 hover:text-indigo-300 font-medium"
              >
                Sign in
              </a>
            </div>

            <div className="mt-4 text-center">
              <a
                href="/"
                onClick={(e) => {
                  e.preventDefault();
                  setLocation('/');
                }}
                className="text-sm text-slate-500 hover:text-slate-400"
              >
                Back to home
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
