import { useEffect, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { setCurrentUser } from './reducer';
import * as authClient from './client';

export const useAuthInit = () => {
  const dispatch = useDispatch();
  const hasInitialized = useRef(false);

  useEffect(() => {
    // Only run once on app initialization
    if (hasInitialized.current) return;
    
    const initAuth = async () => {
      try {
        console.log('Initializing authentication...');
        const authStatus = await authClient.checkAuth();
        if (authStatus.authenticated && authStatus.user) {
          console.log('Server session found:', authStatus.user);
          dispatch(setCurrentUser(authStatus.user));
        } else {
          console.log('No active server session found');
          dispatch(setCurrentUser(null));
        }
      } catch (error) {
        console.error('Auth initialization failed:', error);
        dispatch(setCurrentUser(null));
      } finally {
        hasInitialized.current = true;
      }
    };

    // Small delay to ensure Redux-persist has rehydrated
    const timer = setTimeout(initAuth, 100);
    return () => clearTimeout(timer);
  }, [dispatch]); // Only depend on dispatch, which is stable
}; 