import jwt from 'jsonwebtoken';

const secret = 'clickmarido_local_secret_2026';
const token = jwt.sign({ userId: '1', email: 'admin@clickmarido.com', role: 'admin' }, secret, { expiresIn: '7d' });
console.log('Token JWT:', token);
