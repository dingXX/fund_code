import { networkInterfaces } from 'os';

export const getLocalIPs = () => {
  const nets = networkInterfaces();

  for (const name of Object.keys(nets)) {
    if (nets[name]) {
      for (const net of nets[name]) {
        // 跳过非IPv4和内部地址
        if (net.family === 'IPv4' && !net.internal) {
          return net.address;
        }
      }
    }

  }
  return '127.0.01.1';
};
