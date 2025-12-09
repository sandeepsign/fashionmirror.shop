import React, { createContext, useContext, useState, useEffect } from 'react';
const MerchantAuthContext = createContext(undefined);
export const MerchantAuthProvider = ({ children }) => {
    const [merchant, setMerchant] = useState(null);
    const [apiKeys, setApiKeys] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    // Check for existing session on app load
    useEffect(() => {
        checkSession();
    }, []);
    const checkSession = async () => {
        try {
            const response = await fetch('/api/merchants/me', {
                credentials: 'include'
            });
            if (response.ok) {
                const data = await response.json();
                if (data.success && data.merchant) {
                    setMerchant(data.merchant);
                    // Also fetch API keys
                    await fetchApiKeys();
                }
                else {
                    setMerchant(null);
                    setApiKeys(null);
                }
            }
            else {
                setMerchant(null);
                setApiKeys(null);
            }
        }
        catch (error) {
            console.error('Merchant session check failed:', error);
            setMerchant(null);
            setApiKeys(null);
        }
        finally {
            setIsLoading(false);
        }
    };
    const fetchApiKeys = async () => {
        try {
            const response = await fetch('/api/merchants/keys', {
                credentials: 'include'
            });
            if (response.ok) {
                const data = await response.json();
                if (data.success && data.keys) {
                    setApiKeys(data.keys);
                }
            }
        }
        catch (error) {
            console.error('Failed to fetch API keys:', error);
        }
    };
    const login = async (email, password) => {
        try {
            const response = await fetch('/api/merchants/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password }),
                credentials: 'include'
            });
            const data = await response.json();
            if (response.ok && data.success) {
                setMerchant(data.merchant);
                await fetchApiKeys();
                return { success: true };
            }
            else {
                return {
                    success: false,
                    error: data.error?.message || 'Login failed'
                };
            }
        }
        catch (error) {
            console.error('Login error:', error);
            return { success: false, error: 'Network error. Please try again.' };
        }
    };
    const register = async (data) => {
        try {
            const response = await fetch('/api/merchants/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data),
                credentials: 'include'
            });
            const result = await response.json();
            if (response.ok && result.success) {
                setMerchant(result.merchant);
                await fetchApiKeys();
                return { success: true };
            }
            else {
                return {
                    success: false,
                    error: result.error?.message || 'Registration failed'
                };
            }
        }
        catch (error) {
            console.error('Registration error:', error);
            return { success: false, error: 'Network error. Please try again.' };
        }
    };
    const logout = async () => {
        try {
            await fetch('/api/merchants/logout', {
                method: 'POST',
                credentials: 'include'
            });
        }
        catch (error) {
            console.error('Logout request failed:', error);
        }
        finally {
            setMerchant(null);
            setApiKeys(null);
        }
    };
    const refreshMerchant = async () => {
        await checkSession();
    };
    const refreshApiKeys = async () => {
        await fetchApiKeys();
    };
    const isAuthenticated = merchant !== null;
    return (<MerchantAuthContext.Provider value={{
            merchant,
            apiKeys,
            login,
            register,
            logout,
            refreshMerchant,
            refreshApiKeys,
            isAuthenticated,
            isLoading
        }}>
      {children}
    </MerchantAuthContext.Provider>);
};
export const useMerchantAuth = () => {
    const context = useContext(MerchantAuthContext);
    if (context === undefined) {
        throw new Error('useMerchantAuth must be used within a MerchantAuthProvider');
    }
    return context;
};
