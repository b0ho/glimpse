export const testUsers = {
  // 일반 사용자
  newUser: { phone: '01012345678', code: '123456' },
  existingUser: { phone: '01087654321', code: '654321' },
  premiumUser: { phone: '01077777777', code: '777777' },
  
  // 그룹 테스트용
  groupUser: { phone: '01044444444', code: '444444' },
  
  // 매칭 테스트용
  matchingUserA: { phone: '01055555555', code: '555555' },
  matchingUserB: { phone: '01066666666', code: '666666' },
  
  // 채팅 테스트용
  chatUserA: { phone: '01088888888', code: '888888' },
  chatUserB: { phone: '01099999999', code: '999999' },
  
  // 결제 테스트용
  paymentUser: { phone: '01012121212', code: '121212' },
  expiringUser: { phone: '01013131313', code: '131313' },
  
  // 회사 인증 테스트용
  companyUser: { phone: '01012341234', code: '123412' },
  
  // 위치 그룹 테스트용
  locationUser: { phone: '01056565656', code: '565656' },
  locationPremium: { phone: '01067676767', code: '676767' },
  
  // 스토리 테스트용
  storyUser: { phone: '01078787878', code: '787878' },
  storyUserB: { phone: '01089898989', code: '898989' },
  storyPremium: { phone: '01090909090', code: '909090' },
  
  // 친구 시스템 테스트용
  friendUserA: { phone: '01023232323', code: '232323' },
  friendUserB: { phone: '01034343434', code: '343434' },
};

export const testGroups = {
  official: {
    samsung: { id: 'samsung', name: '삼성전자', domain: 'samsung.com' },
    kakao: { id: 'kakao', name: '카카오', domain: 'kakaocorp.com' },
    naver: { id: 'naver', name: '네이버', domain: 'navercorp.com' },
  },
  created: {
    tennis: { id: 'tennis-seoul', name: '서울 테니스 모임' },
  },
  instance: {
    conference: { id: 'event-12345', name: '개발자 컨퍼런스 2024' },
  },
  location: {
    cityHall: { id: 'seoul-city-hall', name: '서울시청' },
    starbucks: { id: 'location-group-starbucks-gangnam', name: '스타벅스 강남역점' },
  },
};

export const testLocations = {
  seoulCityHall: { latitude: 37.5665, longitude: 126.9780 },
  gangnam: { latitude: 37.4979, longitude: 127.0276 },
};

export const testPayments = {
  credits: {
    small: { id: 'package-5', amount: 5, price: '₩2,500' },
    medium: { id: 'package-10', amount: 10, price: '₩4,500' },
    large: { id: 'package-50', amount: 50, price: '₩19,000' },
  },
  subscriptions: {
    monthly: { price: '₩9,900', period: '월간' },
    yearly: { 
      originalPrice: '₩118,800', 
      discountedPrice: '₩99,000', 
      discount: '17% 할인',
      period: '연간',
    },
  },
};