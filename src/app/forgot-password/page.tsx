'use client';

import React from 'react';
import Link from 'next/link';

export default function ForgotPassword() {
  const goToLogin = () => {
    // Auth0 Universal Login includes "Forgot password" link
    window.location.href = '/api/auth/login';
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            بازیابی رمز عبور
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            یا{' '}
            <Link href="/login" className="font-medium text-indigo-600 hover:text-indigo-500">
              بازگشت به ورود
            </Link>
          </p>
        </div>
        <div className="mt-8 space-y-6">
          <button
            onClick={goToLogin}
            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            باز کردن صفحه بازیابی Auth0
          </button>
        </div>
      </div>
    </div>
  );
}
