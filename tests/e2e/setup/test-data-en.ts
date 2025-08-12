/**
 * English Test Data for E2E Testing
 * @description Test data with English names and content for testing internationalization
 */

export const testUsersEn = {
  // Regular users
  newUser: { 
    phone: '01012345678', 
    code: '123456',
    nickname: 'John_Smith',
    bio: 'Software engineer from San Francisco'
  },
  existingUser: { 
    phone: '01087654321', 
    code: '654321',
    nickname: 'Emily_Johnson',
    bio: 'Product designer who loves hiking'
  },
  premiumUser: { 
    phone: '01077777777', 
    code: '777777',
    nickname: 'Michael_Brown',
    bio: 'Premium member | Tech enthusiast'
  },
  
  // Group testing
  groupUser: { 
    phone: '01044444444', 
    code: '444444',
    nickname: 'Sarah_Davis',
    bio: 'Community manager at startup'
  },
  
  // Matching testing
  matchingUserA: { 
    phone: '01055555555', 
    code: '555555',
    nickname: 'David_Wilson',
    bio: 'Looking for interesting people'
  },
  matchingUserB: { 
    phone: '01066666666', 
    code: '666666',
    nickname: 'Jessica_Miller',
    bio: 'Coffee lover ☕ Book reader 📚'
  },
  
  // Chat testing
  chatUserA: { 
    phone: '01088888888', 
    code: '888888',
    nickname: 'Robert_Taylor',
    bio: 'Always up for a good conversation'
  },
  chatUserB: { 
    phone: '01099999999', 
    code: '999999',
    nickname: 'Lisa_Anderson',
    bio: 'Travel enthusiast ✈️'
  },
  
  // Payment testing
  paymentUser: { 
    phone: '01012121212', 
    code: '121212',
    nickname: 'James_Thomas',
    bio: 'Testing payment features'
  },
  expiringUser: { 
    phone: '01013131313', 
    code: '131313',
    nickname: 'Patricia_Jackson',
    bio: 'Premium expiring soon'
  },
  
  // Company verification testing
  companyUser: { 
    phone: '01012341234', 
    code: '123412',
    nickname: 'Christopher_White',
    bio: 'Working at Google Korea',
    email: 'chris.white@google.com'
  },
  
  // Location group testing
  locationUser: { 
    phone: '01056565656', 
    code: '565656',
    nickname: 'Daniel_Harris',
    bio: 'Exploring Seoul neighborhoods'
  },
  locationPremium: { 
    phone: '01067676767', 
    code: '676767',
    nickname: 'Jennifer_Martin',
    bio: 'Premium | Location-based matching'
  },
  
  // Story testing
  storyUser: { 
    phone: '01078787878', 
    code: '787878',
    nickname: 'William_Garcia',
    bio: 'Sharing daily moments'
  },
  storyUserB: { 
    phone: '01089898989', 
    code: '898989',
    nickname: 'Elizabeth_Martinez',
    bio: 'Photography enthusiast 📸'
  },
  storyPremium: { 
    phone: '01090909090', 
    code: '909090',
    nickname: 'Matthew_Robinson',
    bio: 'Premium | Story creator'
  },
  
  // Friend system testing
  friendUserA: { 
    phone: '01023232323', 
    code: '232323',
    nickname: 'Ashley_Clark',
    bio: 'Looking for friends in Seoul'
  },
  friendUserB: { 
    phone: '01034343434', 
    code: '343434',
    nickname: 'Joshua_Rodriguez',
    bio: 'New to the city, making connections'
  },
};

export const testGroupsEn = {
  official: {
    google: { 
      id: 'google-korea', 
      name: 'Google Korea', 
      domain: 'google.com',
      description: 'Official Google Korea employees group'
    },
    microsoft: { 
      id: 'microsoft-korea', 
      name: 'Microsoft Korea', 
      domain: 'microsoft.com',
      description: 'Microsoft Korea team members'
    },
    meta: { 
      id: 'meta-korea', 
      name: 'Meta Korea', 
      domain: 'meta.com',
      description: 'Meta (Facebook) Korea office'
    },
  },
  created: {
    bookclub: { 
      id: 'seoul-book-club', 
      name: 'Seoul Book Club',
      description: 'Monthly book discussions in English'
    },
    hiking: { 
      id: 'seoul-hiking', 
      name: 'Seoul Hiking Group',
      description: 'Weekend hiking adventures around Seoul'
    },
    language: { 
      id: 'language-exchange', 
      name: 'Language Exchange Seoul',
      description: 'Korean-English language exchange meetups'
    },
  },
  instance: {
    techConf: { 
      id: 'tech-conf-2024', 
      name: 'Tech Conference 2024',
      description: 'Annual technology conference in Seoul',
      date: '2024-03-15'
    },
    startup: { 
      id: 'startup-weekend-seoul', 
      name: 'Startup Weekend Seoul',
      description: '48-hour startup creation event',
      date: '2024-04-20'
    },
  },
  location: {
    coex: { 
      id: 'coex-mall', 
      name: 'COEX Mall',
      description: 'Meet people at COEX'
    },
    itaewon: { 
      id: 'itaewon-district', 
      name: 'Itaewon District',
      description: 'International community in Itaewon'
    },
    gangnam: { 
      id: 'gangnam-station', 
      name: 'Gangnam Station',
      description: 'Connections at Gangnam Station area'
    },
  },
};

export const testMessagesEn = {
  greetings: [
    "Hi! Nice to match with you 😊",
    "Hello! How are you doing?",
    "Hey there! Great to connect!",
    "Hi! I liked your profile",
    "Hello! Would love to chat",
  ],
  responses: [
    "That sounds interesting!",
    "I totally agree with you",
    "What do you think about...",
    "That's a great point",
    "I'd love to know more",
  ],
  questions: [
    "What brings you to this app?",
    "How long have you been in Seoul?",
    "What do you do for fun?",
    "Any weekend plans?",
    "Have you tried any good restaurants lately?",
  ],
};

export const testStoriesEn = {
  captions: [
    "Beautiful sunset in Seoul 🌅",
    "Coffee time at my favorite cafe ☕",
    "Weekend vibes 🎉",
    "Exploring new places in the city",
    "Working from a cozy spot today",
    "Delicious Korean food 🍜",
    "Night view from Namsan Tower",
    "Cherry blossoms are blooming 🌸",
    "Rainy day mood ☔",
    "TGIF! Ready for the weekend",
  ],
};

export const testProfileBiosEn = [
  "Adventure seeker | Coffee addict | Dog lover 🐕",
  "Tech professional by day, foodie by night 🍕",
  "Bookworm 📚 | Yoga enthusiast 🧘 | Travel lover ✈️",
  "New to Seoul, excited to meet new people!",
  "Film buff 🎬 | Music lover 🎵 | Weekend hiker 🥾",
  "Startup founder | Always learning | Coffee meetings welcome ☕",
  "Designer with a passion for minimalism",
  "Fitness enthusiast 💪 | Healthy lifestyle advocate",
  "Photographer capturing Seoul's beauty 📸",
  "Language learner | Cultural explorer | Food adventurer",
];

export const testCompaniesEn = [
  { name: "Samsung Electronics", domain: "samsung.com" },
  { name: "LG Electronics", domain: "lg.com" },
  { name: "Hyundai Motor", domain: "hyundai.com" },
  { name: "SK Telecom", domain: "sktelecom.com" },
  { name: "Naver Corporation", domain: "navercorp.com" },
  { name: "Kakao Corp", domain: "kakaocorp.com" },
  { name: "Coupang", domain: "coupang.com" },
  { name: "Line Corporation", domain: "linecorp.com" },
  { name: "Delivery Hero Korea", domain: "deliveryhero.com" },
  { name: "Toss (Viva Republica)", domain: "toss.im" },
];

export const testLocationsEn = {
  seoulCityHall: { 
    latitude: 37.5665, 
    longitude: 126.9780,
    name: "Seoul City Hall",
    description: "Heart of Seoul"
  },
  gangnam: { 
    latitude: 37.4979, 
    longitude: 127.0276,
    name: "Gangnam Station",
    description: "Business and entertainment district"
  },
  myeongdong: { 
    latitude: 37.5636, 
    longitude: 126.9869,
    name: "Myeongdong",
    description: "Shopping paradise"
  },
  hongdae: { 
    latitude: 37.5563, 
    longitude: 126.9220,
    name: "Hongdae",
    description: "Youth culture and indie scene"
  },
  itaewon: { 
    latitude: 37.5345, 
    longitude: 126.9946,
    name: "Itaewon",
    description: "International district"
  },
};

export const testPaymentsEn = {
  credits: {
    small: { 
      id: 'package-5', 
      amount: 5, 
      price: '$2.99',
      description: '5 likes package'
    },
    medium: { 
      id: 'package-10', 
      amount: 10, 
      price: '$4.99',
      description: '10 likes package • Most popular'
    },
    large: { 
      id: 'package-50', 
      amount: 50, 
      price: '$19.99',
      description: '50 likes package • Best value'
    },
  },
  subscriptions: {
    monthly: { 
      price: '$9.99', 
      period: 'Monthly',
      features: [
        'Unlimited likes',
        'See who likes you',
        'Priority matching',
        'Read receipts',
        'Advanced filters'
      ]
    },
    yearly: { 
      originalPrice: '$119.88', 
      discountedPrice: '$99.00', 
      discount: '17% OFF',
      period: 'Yearly',
      savings: 'Save $20.88',
      features: [
        'All monthly features',
        '2 months free',
        'Super likes included',
        'Profile boost',
        'Premium badge'
      ]
    },
  },
};

export const testNotificationsEn = {
  likes: [
    "Someone liked you!",
    "You have a new like from {{group}}",
    "{{nickname}} liked you back! It's a match!",
    "You received a super like!",
  ],
  messages: [
    "New message from {{nickname}}",
    "{{nickname}}: {{preview}}",
    "You have {{count}} unread messages",
  ],
  groups: [
    "Welcome to {{groupName}}!",
    "New members joined {{groupName}}",
    "{{groupName}} is now active for matching",
  ],
  system: [
    "Your premium subscription expires in 3 days",
    "Daily likes have been refreshed",
    "Profile verification completed",
    "New feature: Stories are now available!",
  ],
};

// Test conversation flows
export const testConversationsEn = {
  initial: {
    userA: "Hi! I noticed we both like hiking. Have you been to Bukhansan?",
    userB: "Hey! Yes, I love Bukhansan! I try to go at least once a month. What about you?",
    userA: "That's awesome! I usually go on weekends. Maybe we could hike together sometime?",
    userB: "That sounds great! I'm actually planning to go this Saturday if the weather is nice.",
    userA: "Perfect! Let's exchange contacts and plan the details 😊",
  },
  casual: {
    userA: "How was your day?",
    userB: "Pretty good! Just finished a big project at work. How about yours?",
    userA: "Congrats on finishing the project! Mine was busy but productive.",
    userB: "Thanks! Any plans for the weekend?",
    userA: "Thinking about checking out that new cafe in Gangnam. Want to join?",
  },
};

export default {
  users: testUsersEn,
  groups: testGroupsEn,
  messages: testMessagesEn,
  stories: testStoriesEn,
  bios: testProfileBiosEn,
  companies: testCompaniesEn,
  locations: testLocationsEn,
  payments: testPaymentsEn,
  notifications: testNotificationsEn,
  conversations: testConversationsEn,
};