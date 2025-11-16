import { useState } from 'react';
import { alertAPI } from '../services/api';

export const useMonitorActions = () => {
  const [loadingMonitorId, setLoadingMonitorId] = useState<string | null>(null);
  const [loadingAction, setLoadingAction] = useState<'start' | 'stop' | 'delete' | null>(null);

  const deleteMonitor = async (
    monitorId: string,
    onSuccess?: (message: string) => void,
    onError?: (error: string) => void
  ) => {
    setLoadingMonitorId(monitorId);
    setLoadingAction("delete");
    try {
      await alertAPI.delete(monitorId);
      onSuccess?.("Alert deleted successfully");
    } catch (err: any) {
      onError?.(err.response?.data?.detail || "Failed to delete alert");
    } finally {
      setLoadingMonitorId(null);
      setLoadingAction(null);
    }
  };

  const stopMonitor = async (
    monitorId: string,
    onSuccess?: (message: string) => void,
    onError?: (error: string) => void
  ) => {
    setLoadingMonitorId(monitorId);
    setLoadingAction("stop");
    try {
      await alertAPI.stop(monitorId);
      onSuccess?.("Alert stopped successfully");
    } catch (err: any) {
      onError?.(err.response?.data?.detail || "Failed to stop alert");
    } finally {
      setLoadingMonitorId(null);
      setLoadingAction(null);
    }
  };

  const startMonitor = async (
    monitorId: string,
    onSuccess?: (message: string) => void,
    onError?: (error: string) => void
  ) => {
    setLoadingMonitorId(monitorId);
    setLoadingAction("start");
    try {
      await alertAPI.start(monitorId);
      onSuccess?.("Alert started successfully");
    } catch (err: any) {
      onError?.(err.response?.data?.detail || "Failed to start alert");
    } finally {
      setLoadingMonitorId(null);
      setLoadingAction(null);
    }
  };

  return {
    deleteMonitor,
    stopMonitor,
    startMonitor,
    loadingMonitorId,
    loadingAction,
  };
};
