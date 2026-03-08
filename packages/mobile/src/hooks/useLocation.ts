import { useState, useCallback, useEffect } from 'react';
import { LocationService } from '../services/LocationService';
import { getAccuracyLevel } from '../utils/validation';
import type { LocationData } from '../types/models.types';

export function useLocation() {
  const [location, setLocation] = useState<LocationData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);

  const requestPermission = useCallback(async () => {
    const granted = await LocationService.requestPermission();
    setHasPermission(granted);
    return granted;
  }, []);

  const getCurrentLocation = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (!hasPermission) {
        const granted = await requestPermission();
        if (!granted) {
          setError('위치 권한이 거부되었습니다.');
          setLoading(false);
          return null;
        }
      }
      const loc = await LocationService.getCurrentLocation();
      setLocation(loc);
      return loc;
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'GPS 위치를 가져올 수 없습니다.';
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  }, [hasPermission, requestPermission]);

  const accuracyLevel = location
    ? getAccuracyLevel(location.accuracy)
    : null;

  useEffect(() => {
    requestPermission();
  }, [requestPermission]);

  return {
    location,
    error,
    loading,
    hasPermission,
    accuracyLevel,
    requestPermission,
    getCurrentLocation,
  };
}
