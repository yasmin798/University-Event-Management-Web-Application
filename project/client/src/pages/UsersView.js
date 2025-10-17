import React, { useEffect, useState } from "react";
import axios from 'axios'; // uncomment after testing ui
//import { getUsers } from "../testData/mockAPI"; // remove after ui testing
import "./UsersView.css";

const UsersView = () => {
  const [users, setUsers] = useState([]);
  const [error, setError] = useState("");

  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [roleFilter, setRoleFilter] = useState("all");
 

 useEffect(() => {
    const fetchUsers = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setError('Please log in as admin to view users.');
          return;
        }
        const res = await axios.get('http://localhost:3000/api/admin/users', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUsers(res.data);
      } catch (err) {
        setError(err.response?.data.error || 'Failed to load users. Ensure you are logged in as admin.');
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []); // uncomment after testing ui


  /*  useEffect(() => {
    setLoading(true);
    getUsers()
      .then((data) => {
        setUsers(data);
        setError("");
      })
      .catch(() => setError("Failed to load users data"))
      .finally(() => setLoading(false));
  }, []); // remove after testing ui */
   const RoleDistribution = ({ users }) => {
    const roleCounts = users.reduce((acc, user) => {
      acc[user.role] = (acc[user.role] || 0) + 1;
      return acc;
    }, {});

    const getRoleColor = (role) => {
      const colors = {
        admin: '#f59e0b',
        student: '#3b82f6', 
        staff: '#10b981',
        professor: '#ef4444',
        ta: '#8b5cf6'
      };
      return colors[role] || '#6b7280';
    };

    return (
      <div className="chart-container">
        <h3 className="chart-title">User Role Distribution</h3>
        <div className="role-chart">
          {Object.entries(roleCounts).map(([role, count]) => (
            <div key={role} className="chart-item">
              <div className="chart-bar-container">
                <div 
                  className="chart-bar"
                  style={{ 
                    width: `${(count / users.length) * 100}%`,
                    backgroundColor: getRoleColor(role)
                  }}
                ></div>
              </div>
              <div className="chart-label">
                <span className="role-name">{role}</span>
                <span className="role-count">({count})</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };


  // Role Distribution Chart Component
 /*  const RoleDistribution = ({ users }) => {
    const roleCounts = users.reduce((acc, user) => {
      acc[user.role] = (acc[user.role] || 0) + 1;
      return acc;
    }, {});
    return (
      <div className="chart-container">
        <h3 className="chart-title">User Role Distribution</h3>
        <div className="role-chart">
          {Object.entries(roleCounts).map(([role, count]) => (
            <div key={role} className="chart-item">
              <div className="chart-bar-container">
                <div 
                  className="chart-bar"
                  style={{ 
                    width: `${(count / users.length) * 100}%`,
                    backgroundColor: getRoleColor(role)
                  }}
                ></div>
              </div>
              <div className="chart-label">
                <span className="role-name">{role}</span>
                <span className="role-count">({count})</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };
 */
const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.roleSpecificId.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || user.status === statusFilter;
    const matchesRole = roleFilter === "all" || user.role === roleFilter;
    
    return matchesSearch && matchesStatus && matchesRole;
  });
   
  
  if (error) return (
     <div className="admin-error-container">
      <div className="admin-error-message">
        <div className="error-icon">⚠️</div>
        <h3>Unable to Load Users</h3>
        <p>{error}</p>
        <button 
          className="admin-retry-btn"
          onClick={() => window.location.reload()}
        >
          Try Again
        </button>
      </div>
    </div>
  );

  
   return (
    <div className="admin-container">
      <div className="admin-header">
        <div className="admin-title-section">
          <h1 className="admin-title">User Management</h1>
          <p className="admin-subtitle">View all system users and their details</p>
        </div>
        <div className="admin-stats">
          <div className="stat-card">
            <div className="stat-number">{users.length}</div>
            <div className="stat-label">Total Users</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{users.filter(u => u.status === 'active').length}</div>
            <div className="stat-label">Active</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{users.filter(u => u.status === 'blocked').length}</div>
            <div className="stat-label">Blocked</div>
          </div>
        </div>
      </div>
<div className="admin-content">
        {/* Role Distribution Chart - Added this section */}
        {!loading && users.length > 0 && (
          <RoleDistribution users={users} />
        )}
      <div className="admin-controls">
        <div className="search-box">
          <input
            type="text"
            placeholder="Search users by name, email, or ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          <span className="search-icon">🔍</span>
        </div>
        
        <div className="filter-group">
          <select 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="blocked">Blocked</option>
          </select>
          
          <select 
            value={roleFilter} 
            onChange={(e) => setRoleFilter(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Roles</option>
            <option value="student">Student</option>
            <option value="staff">Staff</option>
            <option value="ta">Teaching Assistant</option>
            <option value="professor">Professor</option>
            <option value="admin">Admin</option>
          </select>
        </div>
      

       {loading ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading users...</p>
          </div>
        ) : (
          <>
            <div className="table-container">
              <table className="admin-table">
                <thead className="admin-thead">
                  <tr>
                    <th className="admin-th">USER</th>
                    <th className="admin-th">EMAIL</th>
                    <th className="admin-th">ROLE</th>
                    <th className="admin-th">ID</th>
                    <th className="admin-th">STATUS</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr key={user._id} className="admin-row">
                      <td className="admin-td">
                        <div className="user-info">
                          <div className="user-avatar">
                            {user.firstName[0]}{user.lastName[0]}
                          </div>
                          <div className="user-details">
                            <div className="user-name">{user.firstName} {user.lastName}</div>
                          </div>
                        </div>
                      </td>
                      <td className="admin-td">
                        <div className="user-email">{user.email}</div>
                      </td>
                      <td className="admin-td">
                        <span className={`role-tag role-${user.role}`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="admin-td">
                        <code className="user-id">{user.roleSpecificId}</code>
                      </td>
                      <td className="admin-td">
                        <span className={`status-badge status-${user.status}`}>
                          {user.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {filteredUsers.length === 0 && (
              <div className="no-results">
                <div className="no-results-icon">👥</div>
                <h3>No users found</h3>
                <p>Try adjusting your search or filters</p>
              </div>
            )}
            
            <div className="table-footer">
              <div className="results-count">
                Showing {filteredUsers.length} of {users.length} users
              </div>
            </div>
          </>
        )}
      </div>
    </div></div>
  );
};


export default UsersView;
