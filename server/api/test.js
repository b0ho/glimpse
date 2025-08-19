// JavaScript로 작성한 간단한 테스트
module.exports = (req, res) => {
  res.json({
    message: 'JavaScript test endpoint working!',
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.url
  });
};