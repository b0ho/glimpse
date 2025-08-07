// Mock for react-native-encrypted-storage in web environment
const storage = {};

export default {
  setItem: async (key, value) => {
    storage[key] = value;
    localStorage.setItem(key, value);
    return Promise.resolve();
  },
  getItem: async (key) => {
    const value = localStorage.getItem(key) || storage[key];
    return Promise.resolve(value);
  },
  removeItem: async (key) => {
    delete storage[key];
    localStorage.removeItem(key);
    return Promise.resolve();
  },
  clear: async () => {
    Object.keys(storage).forEach(key => delete storage[key]);
    localStorage.clear();
    return Promise.resolve();
  },
};