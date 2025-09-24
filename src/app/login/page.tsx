'use client';

import React from 'react';
import Link from 'next/link';

export default function Login() {
  const login = () => {
    // Redirect to Auth0 Universal Login
    window.location.href = '/api/auth/login?returnTo=%2Fdashboard';
  };

  const loginEmail = () => {
    // If you have a Database connection (e.g., 'Username-Password-Authentication'), this preselects it
    const params = new URLSearchParams({
      returnTo: '/dashboard',
      connection: 'Username-Password-Authentication',
    });
    window.location.href = `/api/auth/login?${params.toString()}`;
  };

  const loginPhone = () => {
    // If you enabled Passwordless SMS connection named 'sms', this preselects it
    const params = new URLSearchParams({
      returnTo: '/dashboard',
      connection: 'sms',
      screen_hint: 'signup',
    });
    window.location.href = `/api/auth/login?${params.toString()}`;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign in to your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Or{' '}
            <Link href="/" className="font-medium text-indigo-600 hover:text-indigo-500">
              go back to home
            </Link>
          </p>
        </div>
        <div className="mt-8 space-y-3">
          <button
            onClick={loginEmail}
            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Continue with Email / Password
          </button>
          <button
            onClick={loginPhone}
            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            Continue with Phone (SMS)
          </button>
          <div className="text-center text-sm text-gray-600">or</div>
          <button
            onClick={login}
            className="group relative w-full flex justify-center py-2 px-4 border border-gray-300 text-sm font-medium rounded-md text-gray-800 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-300"
          >
            Choose on Auth0 Hosted Login
          </button>
        </div>
      </div>
    </div>
  );
}
