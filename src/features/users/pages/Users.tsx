import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useDebounce } from '../../../hooks/useDebounce';
import { Plus, Search, Edit2, Trash2, Mail } from 'lucide-react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Card } from '../../../components/Card';
import { Button } from '../../../components/Button';
import { Modal } from '../../../components/Modal';
import { userService } from '../../../services/api';
import type { User, CreateUserDTO } from '../../../types';
import { Loader } from '../../../components/Loader';
import { cn } from '../../../utils/cn';

export const UsersPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState<CreateUserDTO>({
    name: '',
    email: '',
    phoneNumber: '',
    role: 'user'
  });

  // Raw input value — updates on every keystroke (bound to the <input>)
  const [searchInput, setSearchInput] = useState('');
  // Debounced value — updates only after 300ms of inactivity, used by the filter
  const debouncedSearch = useDebounce(searchInput, 300);
  const [filterRole, setFilterRole] = useState<'all' | 'admin' | 'user'>('all');

  const fetchUsers = async () => {
    try {
      const data = await userService.getUsers();
      if (data.length < 50) {
        const expandedUsers: User[] = [...data];
        const firstNames = ['John', 'Jane', 'Michael', 'Emily', 'David', 'Sarah', 'James', 'Jessica', 'Robert', 'Karen', 'William', 'Ashley', 'Joseph', 'Amanda', 'Charles', 'Daniel', 'Elizabeth', 'Matthew', 'Patricia', 'Andrew'];
        const lastNames = ['Doe', 'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Miller', 'Davis', 'Garcia', 'Rodriguez', 'Wilson', 'Martinez', 'Anderson', 'Taylor', 'Thomas', 'Hernandez', 'Moore', 'Martin', 'Jackson', 'Thompson'];
        const roles = ['admin', 'user'] as const;
        const statuses = ['active', 'inactive'] as const;
        
        for (let i = 1; i <= 200; i++) {
          const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
          const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
          const role = roles[Math.floor(Math.random() * roles.length)];
          const status = statuses[Math.floor(Math.random() * statuses.length)];
          const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}@example.com`;
          const phoneNumber = `+34 6${Math.floor(100 + Math.random() * 900)} ${Math.floor(100 + Math.random() * 900)} ${Math.floor(100 + Math.random() * 900)}`;
          
          expandedUsers.push({
            id: `v_user_${i}`,
            name: `${firstName} ${lastName}`,
            email,
            phoneNumber,
            role,
            status,
            createdAt: new Date().toLocaleDateString(),
          });
        }
        setUsers(expandedUsers);
      } else {
        setUsers(data);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleOpenCreate = () => {
    setEditingUser(null);
    setFormData({ name: '', email: '', phoneNumber: '', role: 'user' });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (user: User) => {
    setEditingUser(user);
    setFormData({ 
      name: user.name, 
      email: user.email, 
      phoneNumber: user.phoneNumber || '',
      role: user.role 
    });
    setIsModalOpen(true);
  };

  const handleDeleteUser = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await userService.deleteUser(id);
        setUsers(users.filter(u => u.id !== id));
      } catch (error) {
        console.error('Error deleting user:', error);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (editingUser) {
        const updatedUser = await userService.updateUser(editingUser.id, formData);
        setUsers(users.map(u => u.id === editingUser.id ? updatedUser : u));
      } else {
        const newUser = await userService.createUser(formData);
        setUsers([newUser, ...users]);
      }
      setIsModalOpen(false);
      setFormData({ name: '', email: '', phoneNumber: '', role: 'user' });
    } catch (error) {
      console.error('Error saving user:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      // Uses debounced value to avoid re-filtering on every keystroke
      const nameMatch = (user.name || '').toLowerCase().includes(debouncedSearch.toLowerCase());
      const emailMatch = (user.email || '').toLowerCase().includes(debouncedSearch.toLowerCase());
      const phoneMatch = (user.phoneNumber || '').includes(debouncedSearch);
      const matchesSearch = nameMatch || emailMatch || phoneMatch;

      const matchesRole = filterRole === 'all' || user.role === filterRole;

      return matchesSearch && matchesRole;
    });
  }, [users, debouncedSearch, filterRole]);

  const parentRef = useRef<HTMLDivElement>(null);

  const rowVirtualizer = useVirtualizer({
    count: filteredUsers.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 72,
    overscan: 10,
  });

  const handleExportCSV = () => {
    if (filteredUsers.length === 0) return;
    const headers = ['ID', 'Name', 'Email', 'Phone Number', 'Role', 'Status', 'Created At'];
    const rows = filteredUsers.map(u => [
      u.id,
      u.name,
      u.email,
      u.phoneNumber || '-',
      u.role.toUpperCase(),
      (u.status || 'active').toUpperCase(),
      u.createdAt || '-'
    ]);
    const csvContent = "\uFEFF" + [headers.join(','), ...rows.map(e => e.map(val => `"${val}"`).join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `voicepay_users_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) return <Loader variant="table" />;

  return (
    <div className="space-y-8 animate-slide-up">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">User Management</h2>
          <p className="text-text-secondary">Manage customers, administrators and operators.</p>
        </div>
        <Button onClick={handleOpenCreate}>
          <Plus size={18} className="mr-2" />
          Create User
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <Card className="p-0 overflow-hidden bg-secondary/5 border-border shadow-2xl">
          {/* Table Filters */}
          <div className="p-6 border-b border-border flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" size={18} />
              <input
                type="text"
                placeholder="Search by name, email or phone..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full bg-secondary border border-border rounded-xl py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all text-white"
              />
            </div>
            <div className="flex flex-wrap items-center gap-3">
              {/* Role Filter Toggles */}
              <div className="flex items-center space-x-1.5 bg-black/20 p-1 rounded-xl border border-border">
                <span className="text-[10px] font-bold uppercase px-2 text-text-secondary tracking-widest">Role:</span>
                {(['all', 'admin', 'user'] as const).map((role) => (
                  <button 
                    key={role}
                    type="button"
                    onClick={() => setFilterRole(role)}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-xs font-bold transition-all capitalize",
                      filterRole === role 
                        ? "bg-primary text-white shadow-md shadow-primary/10" 
                        : "text-text-secondary hover:text-text-primary"
                    )}
                  >
                    {role === 'all' ? 'All' : role === 'admin' ? 'Admin' : 'Customer'}
                  </button>
                ))}
              </div>
              <Button variant="outline" size="sm" onClick={handleExportCSV}>
                Export
              </Button>
            </div>
          </div>

          {/* Custom Virtualized Grid Table */}
          <div className="w-full overflow-x-auto custom-scrollbar bg-black/10">
            <div className="min-w-[800px]">
              {/* Grid Header */}
              <div className="grid grid-cols-[2.5fr_1.5fr_1.2fr_1.2fr_100px] gap-4 py-4 px-6 border-b border-border text-xs font-semibold uppercase tracking-wider text-text-secondary items-center">
                <div>User</div>
                <div>Phone</div>
                <div>Role</div>
                <div>Status</div>
                <div className="text-right pr-4">Actions</div>
              </div>

              {/* Scrollable Container */}
              <div 
                ref={parentRef}
                className="overflow-y-auto max-h-[550px] relative custom-scrollbar"
              >
                <div
                  style={{
                    height: `${rowVirtualizer.getTotalSize()}px`,
                    width: '100%',
                    position: 'relative',
                  }}
                >
                  {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                    const user = filteredUsers[virtualRow.index];
                    if (!user) return null;
                    return (
                      <div
                        key={user.id}
                        data-index={virtualRow.index}
                        ref={rowVirtualizer.measureElement}
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: '100%',
                          height: `${virtualRow.size}px`,
                          transform: `translateY(${virtualRow.start}px)`,
                        }}
                        className="grid grid-cols-[2.5fr_1.5fr_1.2fr_1.2fr_100px] gap-4 px-6 items-center border-b border-border/50 hover:bg-white/5 transition-colors group"
                      >
                        {/* Column 1: User details */}
                        <div className="flex items-center space-x-3 min-w-0">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center text-primary font-bold shrink-0">
                            {(user.name || 'U').charAt(0)}
                          </div>
                          <div className="truncate">
                            <p className="font-medium text-white group-hover:text-primary transition-colors truncate">{user.name}</p>
                            <p className="text-xs text-text-secondary truncate">{user.email}</p>
                          </div>
                        </div>

                        {/* Column 2: Phone */}
                        <div className="text-sm font-mono text-primary truncate">
                          {user.phoneNumber || 'N/A'}
                        </div>

                        {/* Column 3: Role */}
                        <div>
                          <span className={cn(
                            'px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider inline-block',
                            user.role === 'admin' ? 'bg-primary/10 text-primary' : 'bg-secondary text-text-secondary'
                          )}>
                            {user.role}
                          </span>
                        </div>

                        {/* Column 4: Status */}
                        <div className="flex items-center">
                          <div className={cn(
                            'w-2 h-2 rounded-full mr-2 shrink-0',
                            user.status === 'active' ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]' : 'bg-text-secondary'
                          )} />
                          <span className="capitalize text-sm text-text-primary">{user.status || 'active'}</span>
                        </div>

                        {/* Column 5: Actions */}
                        <div className="flex items-center justify-end space-x-1 pr-2">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleOpenEdit(user)}>
                            <Edit2 size={14} />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-red-400 hover:text-red-500" onClick={() => handleDeleteUser(user.id)}>
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Empty State */}
                {filteredUsers.length === 0 && (
                  <div className="text-center py-20">
                    <div className="flex flex-col items-center opacity-40">
                      <div className="p-4 bg-secondary rounded-full mb-4">
                        <Search size={32} className="text-text-secondary" />
                      </div>
                      <p className="text-sm font-bold tracking-widest uppercase">No users found</p>
                      <button 
                        type="button"
                        onClick={() => { setSearchInput(''); setFilterRole('all'); }}
                        className="text-primary text-xs font-bold uppercase mt-3 tracking-widest hover:underline"
                      >
                        Reset Filters
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Footer stats */}
          {filteredUsers.length > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-6 border-t border-border bg-black/10">
              <span className="text-xs text-text-secondary font-semibold">
                Showing <span className="text-white">{filteredUsers.length}</span> users in total. Use scroll to navigate.
              </span>
            </div>
          )}
        </Card>
      </div>

      {/* Create User Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingUser ? 'Edit User' : 'Create New User'}
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-text-secondary">Full Name</label>
            <input
              required
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full bg-secondary border border-border rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all text-white"
              placeholder="e.g. Cristian"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-text-secondary">Phone Number (with +)</label>
            <div className="relative">
              <input
                required
                type="text"
                value={formData.phoneNumber}
                onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                className="w-full bg-secondary border border-border rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all text-white"
                placeholder="+34600000000"
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-text-secondary">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary" size={18} />
              <input
                required
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full bg-secondary border border-border rounded-xl py-3 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all text-white"
                placeholder="richard@example.com"
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-text-secondary">System Role</label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value as 'admin' | 'user' })}
              className="w-full bg-secondary border border-border rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all appearance-none text-white cursor-pointer"
            >
              <option value="user" className="bg-secondary text-white">Customer / Operator</option>
              <option value="admin" className="bg-secondary text-white">Administrator</option>
            </select>
          </div>
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1"
              isLoading={isSubmitting}
            >
              {editingUser ? 'Save Changes' : 'Create Account'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
