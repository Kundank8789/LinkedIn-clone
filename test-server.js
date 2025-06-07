import http from 'http';

// Create a simple HTTP server
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Test server is running!');
});

// Try to listen on port 7777
const PORT = 7777;
server.listen(PORT, () => {
  console.log(`Test server running on port ${PORT}`);
});

// Handle errors
server.on('error', (error) => {
  console.error('Server error:', error.message);
  if (error.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use.`);
  }
});
