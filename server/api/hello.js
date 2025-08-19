// 가장 기본적인 Vercel 함수
module.exports = (req, res) => {
  res.status(200).json({
    hello: 'world',
    timestamp: new Date().toISOString()
  });
};