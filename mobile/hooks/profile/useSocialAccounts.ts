/**
 * 소셜 계정 관리 커스텀 훅
 */

import { SocialItem, GameItem } from '@/types/profileEdit.types';

export const useSocialAccounts = (
  socialIds: SocialItem[],
  setSocialIds: React.Dispatch<React.SetStateAction<SocialItem[]>>,
  platformIds: SocialItem[],
  setPlatformIds: React.Dispatch<React.SetStateAction<SocialItem[]>>,
  gameIds: GameItem[],
  setGameIds: React.Dispatch<React.SetStateAction<GameItem[]>>
) => {
  // Social ID 관리
  const addSocialId = () => {
    setSocialIds([...socialIds, { platform: '', id: '' }]);
  };
  
  const removeSocialId = (index: number) => {
    setSocialIds(socialIds.filter((_, i) => i !== index));
  };
  
  const updateSocialId = (index: number, field: 'platform' | 'id', value: string) => {
    const updated = [...socialIds];
    updated[index] = { ...updated[index], [field]: value };
    setSocialIds(updated);
  };
  
  // Platform ID 관리
  const addPlatformId = () => {
    setPlatformIds([...platformIds, { platform: '', id: '' }]);
  };
  
  const removePlatformId = (index: number) => {
    setPlatformIds(platformIds.filter((_, i) => i !== index));
  };
  
  const updatePlatformId = (index: number, field: 'platform' | 'id', value: string) => {
    const updated = [...platformIds];
    updated[index] = { ...updated[index], [field]: value };
    setPlatformIds(updated);
  };
  
  // Game ID 관리
  const addGameId = () => {
    setGameIds([...gameIds, { game: '', id: '' }]);
  };
  
  const removeGameId = (index: number) => {
    setGameIds(gameIds.filter((_, i) => i !== index));
  };
  
  const updateGameId = (index: number, field: 'game' | 'id', value: string) => {
    const updated = [...gameIds];
    updated[index] = { ...updated[index], [field]: value };
    setGameIds(updated);
  };
  
  return {
    // Social ID methods
    addSocialId,
    removeSocialId,
    updateSocialId,
    
    // Platform ID methods
    addPlatformId,
    removePlatformId,
    updatePlatformId,
    
    // Game ID methods
    addGameId,
    removeGameId,
    updateGameId,
  };
};