'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import UploadForm from '../components/UploadForm';
import SearchFilters from '../components/SearchFilters';
import FileList from '../components/FileList';
import Analytics from '../components/Analytics';
import { createClient } from '@/utils/supabase/client';
import type { KaizenReport, SearchFilters as SearchFiltersType } from '@/types';
import Image from 'next/image';

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [files, setFiles] = useState<KaizenReport[]>([]);
  const [activeTab, setActiveTab] = useState<'analytics' | 'upload' | 'search'>('analytics');
  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [todos, setTodos] = useState<{ id: number; title: string; completed: boolean }[]>([]);

  const supabase = createClient();

  // Redirect if unauthenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/');
    }
  }, [status, router]);

  // Fetch todos from Supabase
  useEffect(() => {
    async function fetchTodos() {
      const { data, error } = await supabase.from('todos').select();
      if (error) {
        console.error('Error fetching todos:', error);
      } else {
        setTodos(data || []);
      }
    }
    fetchTodos();
  }, [supabase]); // ✅ Added supabase to dependency array

  const handleSearch = async (filters: SearchFiltersType) => {
    const queryParams = new URLSearchParams();
    if (filters.theme) queryParams.append('theme', filters.theme);
    if (filters.dept) queryParams.append('dept', filters.dept);
    if (filters.upload_date) queryParams.append('upload_date', filters.upload_date);

    const res = await fetch(`/api/search?${queryParams.toString()}`);
    const data = await res.json();

    if (data.success) {
      setFiles(data.results);
    } else {
      console.error('Search failed:', data.error);
    }
  };

  const handleDelete = (deletedId: number) => {
    setFiles(prev => prev.filter(file => file.id !== deletedId));
  };

  const handleLogout = async () => {
    await signOut({ redirect: false });
    router.push('/');
  };

  if (status === 'loading' || status === 'unauthenticated') {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <>
      <header className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 py-4">
          <div className="flex justify-between items-center">
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <Image
                src="/mask_logo.png"
                alt="Kaizen Bank Logo"
                width={48}
                height={48}
                className="rounded-xl shadow-sm"
              />
              <span className="text-2xl font-bold text-blue-700">Mask Kaizen Bank</span>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-6">
              {['analytics', 'upload', 'search'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab as typeof activeTab)}
                  className={`text-gray-700 font-medium transition-all duration-300 px-4 py-2 rounded-lg ${
                    activeTab === tab ? 'bg-blue-600 text-white shadow-md' : 'hover:bg-gray-100'
                  }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
              <div className="flex items-center ml-4">
                <span className="text-sm text-gray-700 mr-4">{session?.user?.email}</span>
                <button
                  onClick={handleLogout}
                  className="text-red-600 hover:text-red-800 text-sm font-medium"
                >
                  Logout
                </button>
              </div>
            </nav>

            {/* Mobile Menu Toggle */}
            <div className="md:hidden">
              <button
                onClick={() => setMobileMenuOpen(!isMobileMenuOpen)}
                className="text-gray-800 focus:outline-none"
              >
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  {isMobileMenuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-white shadow-md rounded-lg">
            <div className="flex flex-col py-3">
              {['analytics', 'upload', 'search'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => {
                    setActiveTab(tab as typeof activeTab);
                    setMobileMenuOpen(false);
                  }}
                  className={`px-6 py-3 text-lg font-medium text-center ${
                    activeTab === tab ? 'text-blue-600 bg-gray-100' : 'text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
              <button
                onClick={handleLogout}
                className="px-6 py-3 text-lg font-medium text-center text-red-600"
              >
                Logout
              </button>
            </div>
          </div>
        )}
      </header>

      <main className="min-h-screen bg-gray-100 py-12 px-6 lg:px-10">
        <div className="max-w-7xl mx-auto">
          {todos.length > 0 && (
            <section className="bg-white rounded-lg shadow-md p-8 mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-6">Todos from Supabase</h2>
              <ul className="list-disc pl-6">
                {todos.map((todo) => (
                  <li key={todo.id} className="mb-2">
                    {JSON.stringify(todo)}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {activeTab === 'analytics' && (
            <section className="bg-white rounded-lg shadow-md p-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-6">Analytics Dashboard</h2>
              <Analytics />
            </section>
          )}

          {activeTab === 'upload' && (
            <section className="bg-white rounded-lg shadow-md p-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-6">Upload Reports</h2>
              <UploadForm />
            </section>
          )}

          {activeTab === 'search' && (
            <section className="bg-white rounded-lg shadow-md p-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-6">Search Reports</h2>
              <SearchFilters onSearch={handleSearch} />
              <FileList files={files} onDelete={handleDelete} />
            </section>
          )}
        </div>
      </main>
    </>
  );
}
