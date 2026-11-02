import { createContext, useContext } from 'react';
export interface AdminSession { id: string; username: string; role: 'viewer' | 'full' }
export const AdminSessionContext = createContext<AdminSession | null>(null);
export const useAdminSession = () => useContext(AdminSessionContext);