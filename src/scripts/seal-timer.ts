import { exec, fork } from 'child_process';
import { join } from 'path';
import { getLocalIPs } from '../utils/get-local-ip';

//launchctl load ~/Library/LaunchAgents/com.fund.seal-timers.plist
//launchctl unload ~/Library/LaunchAgents/com.fund.seal-timers.plist

async function main() {
  const nowCwd = process.cwd();
  const cwd = join(__dirname, '../../');
  process.chdir(cwd);
  console.log('cwd', cwd, Date().toString());

  await startNode();
  console.log('启动dev完成 for seal-timers');

  const localIp = getLocalIPs();
  console.log('请求接口');

  await fetch(`http://${localIp}:3000/seal/send-msg`);
  console.log('请求卖定时任务成功');
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
    console.log('seal-timer 执行成果');
  })
  .catch(() => {
    console.log('seal-timer 执行失败');
  });

setTimeout(() => {
  process.exit();
}, 20000);
