const mongoose = require('mongoose');
const MONGO_URI = 'mongodb+srv://venih32858_db_user:GCXMQ6rDxZGuJtJ@cluster0.libonwi.mongodb.net/killerweb?retryWrites=true&w=majority';

mongoose.connect(MONGO_URI)
  .then(() => {
    console.log('✅ MongoDB connected!');
    process.exit(0);
  })
  .catch(err => {
    console.log('❌ Error:', err.message);
    process.exit(1);
  });
