"use client";

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Link from 'next/link';

export default function AdminLoginScreen() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const result = await signIn('credentials', {
        username,
        password,
        redirect: false
      });

      if (result?.error) {
        setError('Invalid username or password');
        setIsLoading(false);
        return;
      }

      // Successful login - we'll check admin status in the page component
      router.refresh();
    } catch (err) {
      console.error('Login error:', err);
      setError('An error occurred during login');
      setIsLoading(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-gray-900 to-black text-gray-300"
    >
      <div className="w-full max-w-md p-8 rounded-lg bg-black/50 backdrop-blur-md border border-gray-800 shadow-lg">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyber-primary to-cyber-secondary">
            Admin Dashboard
          </h1>
          <p className="text-gray-400 mt-2">Login to access administrative functions</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-900/50 border border-red-500 text-red-200 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-400 mb-1" htmlFor="username">
              Username
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full p-3 bg-gray-800 border border-gray-700 rounded focus:outline-none focus:border-cyber-primary"
              disabled={isLoading}
              required
            />
          </div>

          <div className="mb-6">
            <label className="block text-gray-400 mb-1" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 bg-gray-800 border border-gray-700 rounded focus:outline-none focus:border-cyber-primary"
              disabled={isLoading}
              required
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full p-3 bg-cyber-primary/80 hover:bg-cyber-primary text-black font-bold rounded transition-colors disabled:opacity-50"
          >
            {isLoading ? 'Authenticating...' : 'Login'}
          </button>
          
          <div className="text-center mt-6 text-sm text-gray-400">
            <p>Admin access only. Return to <Link href="/" className="text-cyber-primary hover:underline">Homepage</Link></p>
          </div>
        </form>

        <div className="mt-6 text-center text-sm text-gray-500">
          <p>Authorized personnel only</p>
          <p>All access attempts are logged</p>
        </div>
      </div>
    </motion.div>
  );
}
