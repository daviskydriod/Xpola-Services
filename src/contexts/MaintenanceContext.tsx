// FILE PATH: src/contexts/MaintenanceContext.tsx
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { publicMaintenanceApi } from '@/lib/api';

interface MaintenanceState {
  maintenance: boolean; message: string;
  estimatedBack: string | null; loading: boolean;
}
interface MaintenanceContextValue extends MaintenanceState {
  refresh: () => Promise<void>;
}
const MaintenanceContext = createContext<MaintenanceContextValue | null>(null);
export const useMaintenance = () => {
  const ctx = useContext(MaintenanceContext);
  if (!ctx) throw new Error('useMaintenance must be used within MaintenanceProvider');
  return ctx;
};
export const MaintenanceProvider = ({ children }: { children: ReactNode }) => {
  const [state, setState] = useState<MaintenanceState>({
    maintenance: false,
    message: "We're performing scheduled maintenance. We'll be back shortly!",
    estimatedBack: null, loading: true,
  });
  const refresh = async () => {
    try {
      const data = await publicMaintenanceApi.getStatus();
      setState(current => ({
        maintenance: Boolean(data.maintenance ?? data.enabled),
        message: data.message ?? current.message,
        estimatedBack: data.estimatedBack ?? null,
        loading: false,
      }));
    } catch { setState(s => ({ ...s, loading: false })); }
  };
  useEffect(() => {
    void refresh();
    const interval = window.setInterval(() => { void refresh(); }, 30000);
    return () => window.clearInterval(interval);
  }, []);
  return <MaintenanceContext.Provider value={{ ...state, refresh }}>{children}</MaintenanceContext.Provider>;
};
