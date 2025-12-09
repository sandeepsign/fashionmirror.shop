import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Mail } from "lucide-react";
import { apiClient } from "@/lib/api";
export function LoginForm({ onSuccess, onSwitchToRegister }) {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [verificationError, setVerificationError] = useState("");
    const [resendLoading, setResendLoading] = useState(false);
    const [resendMessage, setResendMessage] = useState("");
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        setVerificationError("");
        setResendMessage("");
        try {
            const response = await fetch("/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password }),
            });
            const data = await response.json();
            if (!response.ok) {
                // Handle verification-specific errors
                if (data.requiresVerification) {
                    setVerificationError(data.error);
                }
                else {
                    throw new Error(data.error || "Login failed");
                }
                return;
            }
            onSuccess(data.user);
        }
        catch (err) {
            setError(err instanceof Error ? err.message : "An error occurred");
        }
        finally {
            setLoading(false);
        }
    };
    const handleResendVerification = async () => {
        if (!email) {
            setError("Please enter your email address first");
            return;
        }
        setResendLoading(true);
        setResendMessage("");
        setError("");
        try {
            const response = await apiClient.resendVerificationEmail(email);
            setResendMessage(response.message);
        }
        catch (err) {
            setError(err instanceof Error ? err.message : "Failed to resend verification email");
        }
        finally {
            setResendLoading(false);
        }
    };
    return (<Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Welcome Back</CardTitle>
        <CardDescription>
          Sign in to your FashionMirror account to continue your fashion journey
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {error && (<Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>)}
          {verificationError && (<Alert className="border-amber-200 bg-amber-50">
              <AlertDescription className="text-amber-700">
                📧 {verificationError}
                <br /><br />
                <strong>💡 Don't see the email?</strong>
                <br />• Check your spam/junk folder
                <br />• Make sure you entered the correct email address
                <br />• Contact support if the email doesn't arrive
                <br /><br />
                <Button variant="outline" size="sm" onClick={handleResendVerification} disabled={resendLoading} className="mt-2 bg-white border-amber-300 text-amber-700 hover:bg-amber-50">
                  {resendLoading ? (<>
                      <Loader2 className="mr-2 h-3 w-3 animate-spin"/>
                      Resending...
                    </>) : (<>
                      <Mail className="mr-2 h-3 w-3"/>
                      Resend Verification Email
                    </>)}
                </Button>
              </AlertDescription>
            </Alert>)}
          {resendMessage && (<Alert className="border-green-200 bg-green-50">
              <AlertDescription className="text-green-700">
                ✅ {resendMessage}
              </AlertDescription>
            </Alert>)}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required/>
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required/>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (<>
                <Loader2 className="mr-2 h-4 w-4 animate-spin"/>
                Signing in...
              </>) : ("Sign In")}
          </Button>
          <div className="text-sm text-center">
            Don't have an account?{" "}
            <button type="button" onClick={onSwitchToRegister} className="text-primary hover:underline">
              Sign up here
            </button>
          </div>
        </CardFooter>
      </form>
    </Card>);
}
