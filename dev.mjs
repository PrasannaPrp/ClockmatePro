import { spawn } from 'child_process';

const args = process.argv.slice(2).filter((arg, i, arr) => {
  if (arg === '--host') return false;
  if (arr[i-1] === '--host') return false;
  if (arg === '--port') return false;
  if (arr[i-1] === '--port') return false;
  return true;
});

spawn('npx', ['next', 'dev', '-p', '3000', '-H', '0.0.0.0', ...args], {
  stdio: 'inherit',
  shell: true
});
