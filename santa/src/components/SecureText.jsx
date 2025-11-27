import React from 'react';
import { SecurityUtils } from '../utils/security';

export const SecureText = ({ children, className = '' }) => {
  if (!children) return null;
  
  const sanitizedText = SecurityUtils.sanitize(children.toString());
  
  return (
    <span className={className}>
      {sanitizedText}
    </span>
  );
};

export const useSecureStorage = () => {
  const setSecureItem = (key, data) => {
    try {
      // En production, vous devriez chiffrer ces données
      const jsonData = JSON.stringify(data);
      localStorage.setItem(key, jsonData);
    } catch (error) {
    }
  };
  
  const getSecureItem = (key) => {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      localStorage.removeItem(key);
      return null;
    }
  };
  
  return { setSecureItem, getSecureItem };
};