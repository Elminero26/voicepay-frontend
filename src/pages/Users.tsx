import React, { useEffect, useState } from 'react';
import { Plus, Search, Filter, MoreVertical, Edit2, Trash2, Mail } from 'lucide-react';
import { Card } from '../components/Card';
import { Table, TableRow, TableCell } from '../components/Table';
import { Button } from '../components/Button';
import { Modal } from '../components/Modal';
import { userService } from '../services/api';
import type { User, CreateUserDTO } from '../types';
import { Loader } from '../components/Loader';
import { cn } from '../utils/cn';

export const UsersPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState<CreateUserDTO>({
    name: '',
    email: '',
    role: 'user'
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const data = await userService.getUsers();
      setUsers(data);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const newUser = await userService.createUser(formData);
      setUsers([newUser, ...users]);
      setIsModalOpen(false);
      setFormData({ name: '', email: '', role: 'user' });
    } catch (error) {
      console.error('Error creating user:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <Loader />;

  return (
    <div className="space-y-8 animate-slide-up">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">User Management</h2>
          <p className="text-text-secondary">Manage system administrators and operators.</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus size={18} className="mr-2" />
          Create User
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <Card className="p-0 overflow-hidden">
          {/* Table Filters */}
          <div className="p-6 border-b border-border flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" size={18} />
              <input
                type="text"
                placeholder="Search by name or email..."
                className="w-full bg-secondary border border-border rounded-xl py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
              />
            </div>
            <div className="flex items-center space-x-3">
              <Button variant="outline" size="sm">
                <Filter size={16} className="mr-2" />
                Filters
              </Button>
              <Button variant="outline" size="sm">
                Export
              </Button>
            </div>
          </div>

          <Table headers={['User', 'Role', 'Status', 'Joined Date', 'Actions']}>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell>
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center text-primary font-bold">
                      {user.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-medium">{user.name}</p>
                      <p className="text-xs text-text-secondary">{user.email}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <span className={cn(
                    'px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider',
                    user.role === 'admin' ? 'bg-primary/10 text-primary' : 'bg-secondary text-text-secondary'
                  )}>
                    {user.role}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex items-center">
                    <div className={cn(
                      'w-2 h-2 rounded-full mr-2',
                      user.status === 'active' ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]' : 'bg-text-secondary'
                    )} />
                    <span className="capitalize">{user.status}</span>
                  </div>
                </TableCell>
                <TableCell className="text-text-secondary">{user.createdAt}</TableCell>
                <TableCell>
                  <div className="flex items-center space-x-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Edit2 size={14} />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-red-400 hover:text-red-500">
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </Table>
        </Card>
      </div>

      {/* Create User Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create New User"
      >
        <form onSubmit={handleCreateUser} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-text-secondary">Full Name</label>
            <input
              required
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full bg-secondary border border-border rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
              placeholder="e.g. John Doe"
            />
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
                className="w-full bg-secondary border border-border rounded-xl py-3 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                placeholder="john@example.com"
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-text-secondary">System Role</label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              className="w-full bg-secondary border border-border rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all appearance-none"
            >
              <option value="user">Operator</option>
              <option value="admin">Administrator</option>
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
              Create Account
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
