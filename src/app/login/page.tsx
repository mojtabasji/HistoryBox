'use client';

import React from 'react';
import Link from 'next/link';

export default function Login() {
  const login = () => {
    // Redirect to Auth0 Universal Login
    window.location.href = '/api/auth/login?returnTo=%2Fdashboard';
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
        <div className="mt-8 space-y-6">
          <button
            onClick={login}
            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Continue with Auth0
          </button>
        </div>
      </div>
    </div>
  );
}
