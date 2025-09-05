import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function upgradeToPremium() {
  try {
    // Update the dev user to Premium
    const user = await prisma.user.update({
      where: { id: 'dev_user_quick' },
      data: {
        isPremium: true,
        premiumLevel: 'UPPER',
        premiumUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 year from now
      }
    });
    
    console.log('✅ User upgraded to Premium:', {
      id: user.id,
      nickname: user.nickname,
      isPremium: user.isPremium,
      premiumLevel: user.premiumLevel,
      premiumUntil: user.premiumUntil
    });
    
    // Clear any cooldown restrictions
    await prisma.interestSearch.deleteMany({
      where: { 
        userId: 'dev_user_quick',
        status: 'EXPIRED'
      }
    });
    
    console.log('✅ Cleared expired searches');
    
  } catch (error) {
    console.error('❌ Failed to upgrade user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

upgradeToPremium();