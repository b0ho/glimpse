// Mock Encrypted Storage for web platform using localStorage
const EncryptedStorage = {
  setItem: async (key, value) => {
    try {
      localStorage.setItem(key, value);
      return true;
    } catch (error) {
      console.error('EncryptedStorage setItem error:', error);
      return false;
    }
  },
  
  getItem: async (key) => {
    try {
      return localStorage.getItem(key);
    } catch (error) {
      console.error('EncryptedStorage getItem error:', error);
      return null;
    }
  },
  
  removeItem: async (key) => {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error('EncryptedStorage removeItem error:', error);
      return false;
    }
  },
  
  clear: async () => {
    try {
      localStorage.clear();
      return true;
    } catch (error) {
      console.error('EncryptedStorage clear error:', error);
      return false;
    }
  },
};

export default EncryptedStorage;