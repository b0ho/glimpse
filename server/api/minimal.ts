// 최소한의 함수 - 어떤 의존성도 없음
export default (req, res) => {
  res.status(200).json({
    message: 'Minimal endpoint works!',
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.url
  });
};