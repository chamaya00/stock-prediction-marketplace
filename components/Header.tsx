'use client';

import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { TrendingUp, LogOut, User } from 'lucide-react';

export default function Header() {
  const { data: session, status } = useSession();

  return (
    <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-10">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition">
          <TrendingUp className="h-8 w-8 text-blue-600" />
          <h1 className="text-2xl font-bold text-gray-900">Stock Predictions</h1>
        </Link>

        <nav className="flex items-center gap-6">
          {status === 'authenticated' ? (
            <>
              <Link href="/dashboard" className="text-gray-700 hover:text-gray-900 font-medium">
                Dashboard
              </Link>
              <Link href="/predictions/create" className="text-gray-700 hover:text-gray-900 font-medium">
                New Prediction
              </Link>
              <Link href="/leaderboard" className="text-gray-700 hover:text-gray-900 font-medium">
                Leaderboard
              </Link>
              <div className="flex items-center gap-3 pl-3 border-l">
                <Link
                  href="/profile"
                  className="flex items-center gap-2 text-gray-700 hover:text-gray-900"
                >
                  <User className="h-5 w-5" />
                  <span>{session.user.name}</span>
                </Link>
                <button
                  onClick={() => signOut({ callbackUrl: '/' })}
                  className="flex items-center gap-2 text-red-600 hover:text-red-700"
                >
                  <LogOut className="h-5 w-5" />
                  Sign Out
                </button>
              </div>
            </>
          ) : (
            <>
              <Link href="/leaderboard" className="text-gray-700 hover:text-gray-900 font-medium">
                Leaderboard
              </Link>
              <Link
                href="/auth/signin"
                className="text-gray-700 hover:text-gray-900 font-medium"
              >
                Sign In
              </Link>
              <Link
                href="/auth/signup"
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
              >
                Sign Up
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
