// Vercel API function for groups
export default function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-dev-auth, Accept, X-Requested-With');

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  // Mock groups data for testing
  if (req.method === 'GET') {
    res.status(200).json({
      success: true,
      data: [
        {
          id: 'group-1',
          name: '서강대학교',
          type: 'official',
          isActive: true,
          memberCount: 245
        },
        {
          id: 'group-2', 
          name: '스타트업 개발자',
          type: 'created',
          isActive: true,
          memberCount: 128
        }
      ]
    });
    return;
  }

  res.status(405).json({ error: 'Method not allowed' });
}