'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
// import { useSearchParams } from 'next/navigation';

// Types
interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: string;
  status: 'active' | 'inactive' | 'pending';
  lastActive: string;
  location?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

interface LocationData {
  id: string;
  userId: string;
  address: string;
  city: string;
  country: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  lastUpdated: string;
}

interface TabOption {
  value: string;
  label: string;
  count?: number;
}

export default function UsersLocationsPage() {
  // const searchParams = useSearchParams();
  const [users, setUsers] = useState<User[]>([]);
  const [locations, setLocations] = useState<LocationData[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showLocationModal, setShowLocationModal] = useState(false);

  // Tab options
  const tabs: TabOption[] = [
    { value: 'all', label: 'All Users' },
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
    { value: 'pending', label: 'Pending' },
  ];

  // Fetch users and locations data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Replace with your actual API calls
        const usersResponse = await fetch('/api/users');
        const usersData = await usersResponse.json();
        setUsers(usersData);

        const locationsResponse = await fetch('/api/locations');
        const locationsData = await locationsResponse.json();
        setLocations(locationsData);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Filter users based on active tab and search term
  const filteredUsers = users.filter(user => {
    const matchesTab = activeTab === 'all' || user.status === activeTab;
    const matchesSearch = 
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.location && user.location.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesTab && matchesSearch;
  });

  // Get user location
  const getUserLocation = (userId: string): LocationData | undefined => {
    return locations.find(loc => loc.userId === userId);
  };

  // Handle form submission (fixed: replaced 'any' with React.FormEvent)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Your form submission logic here
    const formData = new FormData(e.target as HTMLFormElement);
    // Process form data
    console.log('Form submitted:', Object.fromEntries(formData));
  };

  // Handle tab change (fixed: replaced 'any' with string)
  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };

  // Handle user selection for location modal
  const handleViewLocation = (user: User) => {
    setSelectedUser(user);
    setShowLocationModal(true);
  };

  // Export locations data
  const exportLocations = () => {
    const dataToExport = filteredUsers.map(user => ({
      name: user.name,
      email: user.email,
      location: user.location || 'Not specified',
      status: user.status,
      lastActive: user.lastActive,
    }));
    
    const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `users_locations_${new Date().toISOString()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading users and locations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Users & Locations</h1>
        <p className="text-gray-600 mt-2">Manage user locations and track their activity</p>
      </div>

      {/* Search and Filter Bar */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4 justify-between">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search by name, email, or location..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <button
          onClick={exportLocations}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          Export Data
        </button>
      </div>

      {/* Tabs - Fixed handleTabChange type */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.value}
              onClick={() => handleTabChange(tab.value)}
              className={`
                py-2 px-1 border-b-2 font-medium text-sm
                ${activeTab === tab.value
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
            >
              {tab.label}
              {tab.count !== undefined && (
                <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-600">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Location
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Active
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.map((user) => {
                const userLocation = getUserLocation(user.id);
                return (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 relative">
                          {/* Fixed: Replaced img with Next.js Image component */}
                          <Image
                            src={user.avatar || '/default-avatar.png'}
                            alt={user.name}
                            width={40}
                            height={40}
                            className="rounded-full object-cover"
                          />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {user.name}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{user.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {userLocation ? (
                          <div>
                            <div>{userLocation.city}, {userLocation.country}</div>
                            <div className="text-xs text-gray-500">
                              Lat: {userLocation.coordinates.lat}, Lng: {userLocation.coordinates.lng}
                            </div>
                          </div>
                        ) : (
                          <span className="text-gray-400">No location data</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`
                        px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                        ${user.status === 'active' ? 'bg-green-100 text-green-800' : ''}
                        ${user.status === 'inactive' ? 'bg-red-100 text-red-800' : ''}
                        ${user.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : ''}
                      `}>
                        {user.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(user.lastActive).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleViewLocation(user)}
                        className="text-blue-600 hover:text-blue-900 mr-3"
                      >
                        View Location
                      </button>
                      <button
                        onClick={() => handleSubmit}
                        className="text-gray-600 hover:text-gray-900"
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* No Results */}
      {filteredUsers.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No users found matching your criteria.</p>
        </div>
      )}

      {/* Location Modal */}
      {showLocationModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">
                User Location Details
              </h2>
              <button
                onClick={() => setShowLocationModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <span className="text-2xl">&times;</span>
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <Image
                  src={selectedUser.avatar || '/default-avatar.png'}
                  alt={selectedUser.name}
                  width={48}
                  height={48}
                  className="rounded-full"
                />
                <div>
                  <h3 className="font-semibold text-gray-900">{selectedUser.name}</h3>
                  <p className="text-sm text-gray-500">{selectedUser.email}</p>
                </div>
              </div>
              
              {getUserLocation(selectedUser.id) ? (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">Location Information</h4>
                  <div className="space-y-2 text-sm">
                    <p><span className="font-medium">Address:</span> {getUserLocation(selectedUser.id)?.address}</p>
                    <p><span className="font-medium">City:</span> {getUserLocation(selectedUser.id)?.city}</p>
                    <p><span className="font-medium">Country:</span> {getUserLocation(selectedUser.id)?.country}</p>
                    <p><span className="font-medium">Coordinates:</span> {getUserLocation(selectedUser.id)?.coordinates.lat}, {getUserLocation(selectedUser.id)?.coordinates.lng}</p>
                    <p><span className="font-medium">Last Updated:</span> {new Date(getUserLocation(selectedUser.id)?.lastUpdated || '').toLocaleString()}</p>
                  </div>
                </div>
              ) : (
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <p className="text-yellow-800">No location data available for this user.</p>
                </div>
              )}
            </div>
            
            <div className="mt-6">
              <button
                onClick={() => setShowLocationModal(false)}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}