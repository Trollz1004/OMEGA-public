import React from 'react';

function Profiles() {
  const profiles = [
    { id: 1, userId: 1, displayName: 'Sarah J.', age: 28, gender: 'female', location: 'New York', photoCount: 5, completeness: 95 },
    { id: 2, userId: 2, displayName: 'Michael C.', age: 32, gender: 'male', location: 'Los Angeles', photoCount: 3, completeness: 80 },
    { id: 3, userId: 3, displayName: 'Emily D.', age: 25, gender: 'female', location: 'Chicago', photoCount: 4, completeness: 90 },
    { id: 4, userId: 4, displayName: 'James W.', age: 29, gender: 'male', location: 'Miami', photoCount: 2, completeness: 65 },
    { id: 5, userId: 5, displayName: 'Lisa A.', age: 31, gender: 'female', location: 'Seattle', photoCount: 6, completeness: 100 }
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Profile Management</h1>
        <div className="flex gap-4">
          <button className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-4 rounded-lg">
            Incomplete Profiles
          </button>
          <button className="bg-pink-600 hover:bg-pink-700 text-white font-medium py-2 px-4 rounded-lg">
            Export Data
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-sm font-medium text-gray-500">Total Profiles</h3>
          <p className="text-2xl font-bold text-gray-900 mt-2">14,892</p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-sm font-medium text-gray-500">Complete Profiles</h3>
          <p className="text-2xl font-bold text-green-600 mt-2">12,341</p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-sm font-medium text-gray-500">Avg. Photos</h3>
          <p className="text-2xl font-bold text-pink-600 mt-2">4.2</p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-sm font-medium text-gray-500">Pending Review</h3>
          <p className="text-2xl font-bold text-yellow-600 mt-2">127</p>
        </div>
      </div>

      {/* Profiles Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Profile</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Age/Gender</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Photos</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Completeness</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {profiles.map((profile) => (
              <tr key={profile.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="w-10 h-10 rounded-full bg-pink-200 flex items-center justify-center text-pink-600 font-semibold">
                      {profile.displayName.charAt(0)}
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">{profile.displayName}</div>
                      <div className="text-sm text-gray-500">ID: {profile.userId}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {profile.age} / {profile.gender}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {profile.location}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {profile.photoCount} photos
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="w-full bg-gray-200 rounded-full h-2 mr-2" style={{ width: '100px' }}>
                      <div
                        className={`h-2 rounded-full ${profile.completeness >= 80 ? 'bg-green-500' : profile.completeness >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`}
                        style={{ width: `${profile.completeness}%` }}
                      ></div>
                    </div>
                    <span className="text-sm text-gray-600">{profile.completeness}%</span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <button className="text-pink-600 hover:text-pink-900 mr-3">View</button>
                  <button className="text-gray-600 hover:text-gray-900">Edit</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Profiles;
