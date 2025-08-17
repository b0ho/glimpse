/**
 * Common location utilities used across mobile and server
 */

/**
 * Calculate distance between two coordinates using Haversine formula
 * @returns Distance in kilometers
 */
export const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

/**
 * Convert degrees to radians
 */
const toRadians = (degrees: number): number => {
  return degrees * (Math.PI / 180);
};

/**
 * Format distance for display
 */
export const formatDistance = (meters: number): string => {
  if (meters < 1000) {
    return `${Math.round(meters)}m`;
  }
  return `${(meters / 1000).toFixed(1)}km`;
};

/**
 * Check if coordinates are within a certain radius
 */
export const isWithinRadius = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
  radiusKm: number
): boolean => {
  const distance = calculateDistance(lat1, lon1, lat2, lon2);
  return distance <= radiusKm;
};

/**
 * Get bounding box for a coordinate and radius
 * Useful for database queries
 */
export const getBoundingBox = (
  lat: number,
  lon: number,
  radiusKm: number
): {
  minLat: number;
  maxLat: number;
  minLon: number;
  maxLon: number;
} => {
  const R = 6371; // Earth's radius in km
  const latRadian = toRadians(lat);
  
  // Angular distance in radians
  const radDist = radiusKm / R;
  
  const minLat = lat - toDegrees(radDist);
  const maxLat = lat + toDegrees(radDist);
  
  const deltaLon = Math.asin(Math.sin(radDist) / Math.cos(latRadian));
  const minLon = lon - toDegrees(deltaLon);
  const maxLon = lon + toDegrees(deltaLon);
  
  return { minLat, maxLat, minLon, maxLon };
};

/**
 * Convert radians to degrees
 */
const toDegrees = (radians: number): number => {
  return radians * (180 / Math.PI);
};

/**
 * Calculate location-based matching score
 */
export const calculateLocationScore = (
  distance: number,
  commonGroups: number = 0,
  daysSinceActive: number = 0
): number => {
  // Distance score (0-40 points)
  let distanceScore = 0;
  if (distance < 0.5) distanceScore = 40;
  else if (distance < 1) distanceScore = 35;
  else if (distance < 2) distanceScore = 30;
  else if (distance < 5) distanceScore = 20;
  else if (distance < 10) distanceScore = 10;
  else distanceScore = 0;

  // Common groups score (0-30 points)
  const groupScore = Math.min(30, commonGroups * 10);

  // Activity score (0-30 points)
  const activityScore = Math.max(0, 30 - daysSinceActive * 2);

  return distanceScore + groupScore + activityScore;
};