import express from 'express';

const app = express();
const PORT = 6789; // Use a very specific port

app.get('/', (req, res) => {
  res.send('Simple server is running!');
});

app.listen(PORT, () => {
  console.log(`Simple server running on port ${PORT}`);
});
