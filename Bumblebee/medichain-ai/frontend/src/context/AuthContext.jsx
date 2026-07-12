import { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../services/api';
import { connectCardanoWallet, signChallenge } from '../services/cardano';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = !!token && !!user;

  useEffect(() => {
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        // Check token not expired
        if (payload.exp && payload.exp * 1000 < Date.now()) {
          logout();
        } else {
          setUser({
            id: payload.sub,
            role: payload.role,
            walletAddress: payload.walletAddress,
          });
        }
      } catch {
        logout();
      }
    }
    setIsLoading(false);
  }, [token]);

  const connectWallet = async (walletAddress, signature, key, requestedRole) => {
    const data = await authApi.connectWallet({ walletAddress, signature, key, requestedRole });
    localStorage.setItem('token', data.token);
    localStorage.setItem('refreshToken', data.refreshToken);
    setToken(data.token);
    setUser({
      id: data.userId,
      role: data.role,
      walletAddress,
    });
    return data;
  };

  // Real Cardano wallet connect using CIP-30 + Blockfrost (Track 1)
  const connectCardanoWalletReal = async (walletName) => {
    const { address, walletApi } = await connectCardanoWallet(walletName);
    const challenge = `MediChain AI Login: ${Date.now()}`;
    const { signature, key } = await signChallenge(address, challenge);
    return connectWallet(address, signature, key);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, isAuthenticated, isLoading, connectWallet, connectCardanoWalletReal, logout }}>
      {!isLoading && children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
};
