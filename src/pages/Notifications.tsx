import React, { useEffect, useState } from 'react';
import { Bell, Search, Filter, Mail, MessageSquare, Smartphone } from 'lucide-react';
import { Card } from '../components/Card';
import { Table, TableRow, TableCell } from '../components/Table';
import { Button } from '../components/Button';
import { notificationService } from '../services/api';
import type { Notification } from '../types';
import { Loader } from '../components/Loader';
import { cn } from '../utils/cn';

export const Notifications: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const data = await notificationService.getNotifications();
      setNotifications(data);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'SMS':
        return <MessageSquare size={16} className="text-blue-500" />;
      case 'EMAIL':
        return <Mail size={16} className="text-purple-500" />;
      case 'PUSH':
        return <Smartphone size={16} className="text-orange-500" />;
      default:
        return <Bell size={16} className="text-text-secondary" />;
    }
  };

  if (loading) return <Loader />;

  return (
    <div className="space-y-8 animate-slide-up">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Notification History</h2>
          <p className="text-text-secondary">View all automated messages and alerts sent to users.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <Card className="p-0 overflow-hidden">
          {/* Table Filters */}
          <div className="p-6 border-b border-border flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" size={18} />
              <input
                type="text"
                placeholder="Search by recipient or message..."
                className="w-full bg-secondary border border-border rounded-xl py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
              />
            </div>
            <div className="flex items-center space-x-3">
              <Button variant="outline" size="sm">
                <Filter size={16} className="mr-2" />
                Filters
              </Button>
            </div>
          </div>

          <Table headers={['Type', 'Recipient', 'Message', 'Status', 'Time']}>
            {notifications.map((notification) => (
              <TableRow key={notification.id}>
                <TableCell>
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
                      {getTypeIcon(notification.type)}
                    </div>
                    <span className="font-medium text-xs">{notification.type}</span>
                  </div>
                </TableCell>
                <TableCell className="font-medium">{notification.recipient}</TableCell>
                <TableCell className="text-text-secondary max-w-xs truncate" title={notification.message}>
                  {notification.message}
                </TableCell>
                <TableCell>
                  <span className={cn(
                    'px-2 py-1 rounded-md text-xs font-medium border',
                    notification.status === 'SENT' ? 'bg-green-500/10 text-green-500 border-green-500/20' :
                    notification.status === 'FAILED' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                    'bg-amber-500/10 text-amber-500 border-amber-500/20'
                  )}>
                    {notification.status}
                  </span>
                </TableCell>
                <TableCell className="text-text-secondary">
                  {new Date(notification.timestamp).toLocaleString()}
                </TableCell>
              </TableRow>
            ))}
            {notifications.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-text-secondary">
                  No notifications found.
                </TableCell>
              </TableRow>
            )}
          </Table>
        </Card>
      </div>
    </div>
  );
};
