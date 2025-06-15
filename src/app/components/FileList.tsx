import { useState, useEffect } from 'react';
import type { KaizenReport } from '@/types';
import { Eye, Download, Trash2 } from 'lucide-react';
import { useSession } from 'next-auth/react';

interface Props {
  files: KaizenReport[];
  onDelete?: (id: number) => void;
}

export default function FileList({ files, onDelete }: Props) {
  const { data: session } = useSession();
  const [loading, setLoading] = useState<{ [key: string]: boolean }>({});
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    if (session?.user?.role) {
      setUserRole(session.user.role);
    }
  }, [session]);

  const handleDownload = async (fileId: string, fileName: string) => {
    try {
      setLoading({ ...loading, [fileId]: true });
      // Using the correct property names from your database
      const response = await fetch(`/api/download?fileId=${fileId}&fileName=${encodeURIComponent(fileName)}`);
      
      if (!response.ok) {
        throw new Error(`Download failed: ${response.statusText}`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      return true;
    } catch (error) {
      console.error('Download failed:', error);
      alert('Failed to download file. Please try again.');
      return false;
    } finally {
      setLoading({ ...loading, [fileId]: false });
    }
  };

  const handleView = async (fileId: string) => {
    try {
      setLoading({ ...loading, [`view_${fileId}`]: true });
      const response = await fetch(`/api/view?fileId=${fileId}`);
      
      if (!response.ok) {
        throw new Error('Failed to get view link');
      }

      const data = await response.json();
      if (data.success && data.viewLink) {
        window.open(data.viewLink, '_blank');
      } else {
        throw new Error('View link not available');
      }
    } catch (error) {
      console.error('View failed:', error);
      alert('Failed to view file. Please try again.');
    } finally {
      setLoading({ ...loading, [`view_${fileId}`]: false });
    }
  };

  const handleDelete = async (id: number, fileId: string) => {
    // Check if user is admin before allowing deletion
    if (userRole !== 'admin') {
      alert('You do not have permission to delete this file. Only admins can delete files.');
      return;
    }

    if (!confirm('Are you sure you want to delete this file? This action cannot be undone.')) {
      return;
    }

    try {
      setDeletingId(id);
      const response = await fetch(`/api/delete?fileId=${fileId}&id=${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Delete failed');
      }

      const data = await response.json();
      if (data.success) {
        onDelete?.(id);
      } else {
        throw new Error(data.error || 'Delete failed');
      }
    } catch (error) {
      console.error('Delete failed:', error);
      alert('Failed to delete file. Please try again.');
    } finally {
      setDeletingId(null);
    }
  };

  // Improved date formatting function
  const formatDate = (dateString: string) => {
    if (!dateString) return 'No date';
    
    try {
      // Try parsing as ISO date string
      const date = new Date(dateString);
      
      // Check if date is valid
      if (!isNaN(date.getTime())) {
        return date.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        });
      }
      
      // Try parsing as YYYY-MM-DD format
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
        const [year, month, day] = dateString.split('-').map(Number);
        const manualDate = new Date(year, month - 1, day);
        
        if (!isNaN(manualDate.getTime())) {
          return manualDate.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
          });
        }
      }
      
      // If we can't parse it, return the original string
      return dateString;
    } catch (error) {
      console.error('Error formatting date:', error, dateString);
      return dateString; // Return the original string if parsing fails
    }
  };

  if (files.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No files found matching your search criteria
      </div>
    );
  }

  return (
    <div className="mt-8 overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead>
          <tr>
            <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              File Name
            </th>
            <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Theme
            </th>
            <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Dept
            </th>
            <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Upload Date
            </th>
            <th className="px-6 py-3 bg-gray-50 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {files.map((file) => (
            <tr key={file.id}>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                {file.file_name}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {file.theme}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {file.dept}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {formatDate(file.upload_date)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm flex justify-center space-x-4">
                <button
                  onClick={() => handleView(file.drive_file_id)}
                  disabled={loading[`view_${file.drive_file_id}`]}
                  className="text-blue-600 hover:text-blue-900 disabled:opacity-50"
                  title="View"
                >
                  {loading[`view_${file.drive_file_id}`] ? (
                    'Loading...'
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
                <button
                  onClick={() => handleDownload(file.drive_file_id, file.file_name)}
                  disabled={loading[file.drive_file_id]}
                  className="text-green-600 hover:text-green-900 disabled:opacity-50"
                  title="Download"
                >
                  {loading[file.drive_file_id] ? (
                    'Loading...'
                  ) : (
                    <Download className="w-5 h-5" />
                  )}
                </button>
                {/* Only show delete button if user is admin */}
                {userRole === 'admin' && (
                  <button
                    onClick={() => handleDelete(file.id, file.drive_file_id)}
                    disabled={deletingId === file.id}
                    className="text-red-600 hover:text-red-900 disabled:opacity-50"
                    title="Delete"
                  >
                    {deletingId === file.id ? (
                      'Deleting...'
                    ) : (
                      <Trash2 className="w-5 h-5" />
                    )}
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
