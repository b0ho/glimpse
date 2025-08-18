/**
 * English Test Data Seeder
 * @description Seeds the database with English test data for i18n testing
 * Usage: npm run seed:english
 */

import { PrismaClient, Gender, GroupType } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// English test users with diverse profiles
const englishUsers = [
  {
    phoneNumber: '+821012345678',
    nickname: 'John_Smith',
    bio: 'Software engineer from San Francisco | Coffee lover ☕',
    age: 28,
    gender: Gender.MALE,
    isVerified: true,
  },
  {
    phoneNumber: '+821087654321',
    nickname: 'Emily_Johnson',
    bio: 'Product designer who loves hiking | Dog mom 🐕',
    age: 26,
    gender: Gender.FEMALE,
    isVerified: true,
  },
  {
    phoneNumber: '+821077777777',
    nickname: 'Michael_Brown',
    bio: 'Tech enthusiast | Startup founder | Always learning',
    age: 32,
    gender: Gender.MALE,
    isVerified: true,
    isPremium: true,
  },
  {
    phoneNumber: '+821044444444',
    nickname: 'Sarah_Davis',
    bio: 'Marketing manager | Yoga instructor | Travel addict ✈️',
    age: 29,
    gender: Gender.FEMALE,
    isVerified: true,
  },
  {
    phoneNumber: '+821055555555',
    nickname: 'David_Wilson',
    bio: 'Photographer 📸 | Capturing Seoul moments',
    age: 27,
    gender: Gender.MALE,
    isVerified: true,
  },
  {
    phoneNumber: '+821066666666',
    nickname: 'Jessica_Miller',
    bio: 'Book lover 📚 | Coffee enthusiast | Weekend explorer',
    age: 25,
    gender: Gender.FEMALE,
    isVerified: true,
    isPremium: true,
  },
  {
    phoneNumber: '+821088888888',
    nickname: 'Robert_Taylor',
    bio: 'Finance professional | Fitness enthusiast 💪',
    age: 30,
    gender: Gender.MALE,
    isVerified: true,
  },
  {
    phoneNumber: '+821099999999',
    nickname: 'Lisa_Anderson',
    bio: 'UX researcher | Plant mom 🌱 | Foodie',
    age: 28,
    gender: Gender.FEMALE,
    isVerified: true,
  },
];

// English test groups
const englishGroups = [
  {
    name: 'Google Korea',
    description: 'Official Google Korea employees group',
    type: GroupType.OFFICIAL,
    isActive: true,
    settings: {
      maxMembers: 500,
      requiresApproval: false,
      allowInvites: true,
      isPrivate: false,
    },
  },
  {
    name: 'Seoul International Book Club',
    description: 'Monthly book discussions in English for expats and locals',
    type: GroupType.CREATED,
    isActive: true,
    settings: {
      maxMembers: 100,
      requiresApproval: false,
      allowInvites: true,
      isPrivate: false,
    },
  },
  {
    name: 'Seoul Hiking Enthusiasts',
    description: 'Weekend hiking adventures around Seoul and beyond',
    type: GroupType.CREATED,
    isActive: true,
    settings: {
      maxMembers: 200,
      requiresApproval: false,
      allowInvites: true,
      isPrivate: false,
    },
  },
  {
    name: 'Seoul Tech Conference 2024',
    description:
      'Annual technology conference - Network with tech professionals',
    type: GroupType.INSTANCE,
    isActive: true,
    settings: {
      maxMembers: 1000,
      requiresApproval: false,
      allowInvites: true,
      isPrivate: false,
      startDate: '2024-03-15',
      endDate: '2024-03-17',
    },
  },
  {
    name: 'Gangnam Coworking Space',
    description: 'Connect with professionals at Gangnam coworking spaces',
    type: GroupType.LOCATION,
    isActive: true,
    settings: {
      maxMembers: 100,
      requiresApproval: false,
      allowInvites: true,
      isPrivate: false,
    },
    location: {
      latitude: 37.4979,
      longitude: 127.0276,
      radius: 500,
      address: 'Gangnam-gu, Seoul',
    },
  },
  {
    name: 'Korean-English Language Exchange',
    description: 'Practice Korean and English with native speakers',
    type: GroupType.CREATED,
    isActive: true,
    settings: {
      maxMembers: 300,
      requiresApproval: false,
      allowInvites: true,
      isPrivate: false,
    },
  },
];

// Sample messages in English
const englishMessages = [
  'Hi! Nice to match with you 😊',
  "Hey there! I saw we're both in the hiking group. Do you have a favorite trail?",
  'Hello! Your profile caught my attention. Would love to chat!',
  'Great to connect! I noticed we work in similar fields.',
  "Hi! I'm also new to Seoul. How are you finding the city?",
  "Hey! I see you're into photography too. What camera do you use?",
  'Hello! Would you like to grab coffee sometime this week?',
  "Nice profile! I'm also a book lover. What are you reading now?",
];

// English company domains for verification
const englishCompanies = [
  {
    companyName: 'Google Korea',
    companyNameKr: '구글 코리아',
    domain: 'google.com',
    isVerified: true,
  },
  {
    companyName: 'Microsoft Korea',
    companyNameKr: '마이크로소프트 코리아',
    domain: 'microsoft.com',
    isVerified: true,
  },
  {
    companyName: 'Amazon Korea',
    companyNameKr: '아마존 코리아',
    domain: 'amazon.com',
    isVerified: true,
  },
  {
    companyName: 'Meta Korea',
    companyNameKr: '메타 코리아',
    domain: 'meta.com',
    isVerified: true,
  },
  {
    companyName: 'Apple Korea',
    companyNameKr: '애플 코리아',
    domain: 'apple.com',
    isVerified: true,
  },
  {
    companyName: 'IBM Korea',
    companyNameKr: 'IBM 코리아',
    domain: 'ibm.com',
    isVerified: true,
  },
  {
    companyName: 'Oracle Korea',
    companyNameKr: '오라클 코리아',
    domain: 'oracle.com',
    isVerified: true,
  },
  {
    companyName: 'SAP Korea',
    companyNameKr: 'SAP 코리아',
    domain: 'sap.com',
    isVerified: true,
  },
  {
    companyName: 'Salesforce Korea',
    companyNameKr: '세일즈포스 코리아',
    domain: 'salesforce.com',
    isVerified: true,
  },
  {
    companyName: 'Adobe Korea',
    companyNameKr: '어도비 코리아',
    domain: 'adobe.com',
    isVerified: true,
  },
];

async function seedEnglishData() {
  console.log('🌱 Starting English test data seeding...');

  try {
    // Create English users
    console.log('Creating English users...');
    for (const userData of englishUsers) {
      const user = await prisma.user.upsert({
        where: { phoneNumber: userData.phoneNumber },
        update: {},
        create: {
          ...userData,
          clerkId: `clerk_${userData.phoneNumber}`,
          lastActive: new Date(),
          credits: userData.isPremium ? 999 : 1,
        },
      });
      console.log(`✅ Created user: ${user.nickname}`);
    }

    // Create English groups
    console.log('\nCreating English groups...');
    for (const groupData of englishGroups) {
      const existingGroup = await prisma.group.findFirst({
        where: { name: groupData.name },
      });

      if (!existingGroup) {
        const group = await prisma.group.create({
          data: groupData as any,
        });
        console.log(`✅ Created group: ${group.name}`);
      } else {
        console.log(`✅ Group already exists: ${existingGroup.name}`);
      }
    }

    // Add users to groups
    console.log('\nAdding users to groups...');
    const users = await prisma.user.findMany({
      where: {
        phoneNumber: {
          in: englishUsers.map((u) => u.phoneNumber),
        },
      },
    });
    const groups = await prisma.group.findMany({
      where: {
        name: {
          in: englishGroups.map((g) => g.name),
        },
      },
    });

    for (const user of users) {
      // Add each user to 2-3 random groups
      const randomGroups = groups.sort(() => 0.5 - Math.random()).slice(0, 3);

      for (const group of randomGroups) {
        await prisma.groupMember.upsert({
          where: {
            userId_groupId: {
              userId: user.id,
              groupId: group.id,
            },
          },
          update: {},
          create: {
            userId: user.id,
            groupId: group.id,
            role: 'MEMBER',
          },
        });
      }
    }
    console.log('✅ Added users to groups');

    // Create some matches between English users
    console.log('\nCreating sample matches...');
    const [user1, user2, user3, user4] = users;

    if (user1 && user2) {
      // Create mutual likes (match)
      await prisma.userLike.create({
        data: {
          fromUserId: user1.id,
          toUserId: user2.id,
          groupId: groups[0].id,
          isSuper: false,
          isMatch: true,
        },
      });
      await prisma.userLike.create({
        data: {
          fromUserId: user2.id,
          toUserId: user1.id,
          groupId: groups[0].id,
          isSuper: false,
          isMatch: true,
        },
      });

      // Create match record
      await prisma.match.create({
        data: {
          user1Id: user1.id,
          user2Id: user2.id,
          groupId: groups[0].id,
          isActive: true,
        },
      });
      console.log(`✅ Created match: ${user1.nickname} ↔ ${user2.nickname}`);
    }

    if (user3 && user4) {
      // Create another match
      await prisma.userLike.create({
        data: {
          fromUserId: user3.id,
          toUserId: user4.id,
          groupId: groups[1].id,
          isSuper: true, // Super like
          isMatch: true,
        },
      });
      await prisma.userLike.create({
        data: {
          fromUserId: user4.id,
          toUserId: user3.id,
          groupId: groups[1].id,
          isSuper: false,
          isMatch: true,
        },
      });

      await prisma.match.create({
        data: {
          user1Id: user3.id,
          user2Id: user4.id,
          groupId: groups[1].id,
          isActive: true,
        },
      });
      console.log(`✅ Created match: ${user3.nickname} ↔ ${user4.nickname}`);
    }

    // Create sample chat messages
    console.log('\nCreating sample chat messages...');
    const matches = await prisma.match.findMany({
      include: { user1: true, user2: true },
    });

    for (const match of matches) {
      // Add some messages
      for (let i = 0; i < 5; i++) {
        const senderId = i % 2 === 0 ? match.user1Id : match.user2Id;
        const message = englishMessages[i % englishMessages.length];

        await prisma.chatMessage.create({
          data: {
            matchId: match.id,
            senderId,
            content: message,
            readAt: new Date(),
          },
        });
      }
      console.log(
        `✅ Created chat for match: ${match.user1.nickname} ↔ ${match.user2.nickname}`,
      );
    }

    // Add company domains
    console.log('\nAdding English company domains...');
    for (const company of englishCompanies) {
      await prisma.companyDomain.upsert({
        where: { domain: company.domain },
        update: {},
        create: company,
      });
    }
    console.log('✅ Added company domains');

    // Create some premium subscriptions
    console.log('\nCreating premium subscriptions...');
    const premiumUsers = users.filter((u) => u.isPremium);
    for (const user of premiumUsers) {
      await prisma.subscription.create({
        data: {
          userId: user.id,
          plan: 'MONTHLY',
          status: 'ACTIVE',
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        },
      });
      console.log(`✅ Created premium subscription for: ${user.nickname}`);
    }

    console.log('\n✨ English test data seeding completed successfully!');
    console.log(`📊 Summary:`);
    console.log(`   - ${englishUsers.length} English users created`);
    console.log(`   - ${englishGroups.length} English groups created`);
    console.log(`   - ${matches.length} matches created`);
    console.log(`   - ${englishCompanies.length} company domains added`);
    console.log(`   - ${premiumUsers.length} premium subscriptions created`);
  } catch (error) {
    console.error('❌ Error seeding English data:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seeder
seedEnglishData().catch((e) => {
  console.error('Failed to seed English data:', e);
  process.exit(1);
});
