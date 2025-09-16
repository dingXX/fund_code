import { exec, execSync, fork, spawn } from 'child_process';
import { join, resolve } from 'path';
import { getLocalIPs } from '../utils/get-local-ip';
//launchctl load ~/Library/LaunchAgents/com.fund.timers.plist

// launchctl unload ~/Library/LaunchAgents/com.fund.timers.plist

// launchctl list | grep com.fund
async function main() {
  const nowCwd = process.cwd();
  const cwd = join(__dirname, '../../');
  console.log('cwd', cwd, Date().toString());
  process.chdir(cwd);
  // exec('/Users/dingxuexing/.nvm/versions/node/v20.19.0/bin/pnpm run dev', {});
  await startNode();
  console.log('启动dev完成  for buy-timers');
  // await sleep(3000);
  // console.log('睡眠3s');

  const localIp = getLocalIPs();
  await fetch(`http://${localIp}:3000/buy-fund-msg`);
  console.log('请求发送成果');
  await sleep(10000);

  process.exit();
}

function startNode() {
  return new Promise(async (resolve) => {
    fork('/Users/dingxuexing/study-work/fund_code/dist/main.js');
    await sleep(10000);
    console.log('启动等待10s');
    // const result = execSync('lsof -i :3000').toString();
    // console.log('result', result);
    resolve(0);
  });
}

async function sleep(timeMs) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(0);
    }, timeMs);
  });
}
main()
  .then(() => {
    console.log('buy-timer 执行成功');
  })
  .catch((error) => {
    console.log('buy-timer 执行失败', error);
  });
