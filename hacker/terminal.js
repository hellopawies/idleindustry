const output  = document.getElementById('output');
const cmdInput = document.getElementById('cmd-input');

let cmdHistory = [];
let historyIdx = -1;
let busy       = false;

document.getElementById('terminal').addEventListener('click', () => cmdInput.focus());

cmdInput.addEventListener('keydown', e => {
  if (e.key === 'Enter') {
    if (busy) return;
    const cmd = cmdInput.value.trim();
    cmdInput.value = '';
    historyIdx = -1;
    if (cmd) {
      cmdHistory.unshift(cmd);
      if (cmdHistory.length > 50) cmdHistory.pop();
      printCmd(cmd);
      handleCommand(cmd);
    }
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    if (historyIdx < cmdHistory.length - 1) { historyIdx++; cmdInput.value = cmdHistory[historyIdx]; }
  } else if (e.key === 'ArrowDown') {
    e.preventDefault();
    if (historyIdx > 0) { historyIdx--; cmdInput.value = cmdHistory[historyIdx]; }
    else { historyIdx = -1; cmdInput.value = ''; }
  }
});

function printLine(text, cls = 'out-info') {
  const span = document.createElement('span');
  span.className = `out-line ${cls}`;
  span.textContent = text;
  output.appendChild(span);
  output.appendChild(document.createElement('br'));
  output.scrollTop = output.scrollHeight;
}

function printCmd(cmd) {
  printLine(`${document.getElementById('prompt').textContent} ${cmd}`, 'out-cmd');
}

function printEmpty() { printLine(''); }

async function printLines(lines, delayMs = 40) {
  const clsMap = { sys:'out-sys', info:'out-info', ok:'out-ok', warn:'out-warn', err:'out-err', dim:'out-dim' };
  for (const line of lines) {
    printLine(line.text, clsMap[line.type] || 'out-info');
    if (delayMs > 0) await delay(delayMs);
  }
}

async function printProgress(label, durationMs = 1500, steps = 20) {
  const span = document.createElement('span');
  span.className = 'out-line out-warn scanning';
  output.appendChild(span);
  output.appendChild(document.createElement('br'));

  for (let i = 0; i <= steps; i++) {
    const pct    = Math.round((i / steps) * 100);
    const filled = Math.round((i / steps) * 20);
    span.textContent = `${label} [${'█'.repeat(filled)}${'░'.repeat(20 - filled)}] ${pct}%`;
    output.scrollTop = output.scrollHeight;
    await delay(durationMs / steps);
  }
  span.classList.remove('scanning');
}

function clearOutput() { output.innerHTML = ''; }

function delay(ms) { return new Promise(r => setTimeout(r, ms)); }

function setBusy(val) {
  busy = val;
  cmdInput.disabled = val;
  if (!val) cmdInput.focus();
}
