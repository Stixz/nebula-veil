(function() {
  const cpuValue = document.getElementById('cpu-value');
  const cpuBar = document.getElementById('cpu-bar');
  const memValue = document.getElementById('mem-value');
  const memBar = document.getElementById('mem-bar');
  const diskValue = document.getElementById('disk-value');
  const diskBar = document.getElementById('disk-bar');
  const uptimeValue = document.getElementById('uptime-value');
  const processList = document.getElementById('process-list');

  function formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  function formatUptime(seconds) {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${mins}m`;
    return `${mins}m`;
  }

  function updateStats(stats) {
    if (!stats) return;

    cpuValue.textContent = stats.cpu.toFixed(1) + '%';
    cpuBar.style.width = Math.min(stats.cpu, 100) + '%';
    cpuBar.style.background = stats.cpu > 80 ? '#ff6b6b' : stats.cpu > 50 ? '#f59e0b' : '#67e8f9';

    const memPercent = (stats.memUsed / stats.memTotal) * 100;
    memValue.textContent = formatBytes(stats.memUsed) + ' / ' + formatBytes(stats.memTotal);
    memBar.style.width = memPercent + '%';
    memBar.style.background = memPercent > 85 ? '#ff6b6b' : memPercent > 70 ? '#f59e0b' : '#a78bfa';

    const diskPercent = (stats.diskUsed / stats.diskTotal) * 100;
    diskValue.textContent = formatBytes(stats.diskUsed) + ' / ' + formatBytes(stats.diskTotal);
    diskBar.style.width = diskPercent + '%';
    diskBar.style.background = diskPercent > 90 ? '#ff6b6b' : diskPercent > 75 ? '#f59e0b' : '#67e8f9';

    uptimeValue.textContent = formatUptime(stats.uptime);

    if (stats.processes && processList) {
      let html = `<div class="process-header"><span>Process</span><span>CPU</span><span>Memory</span></div>`;
      stats.processes.slice(0, 8).forEach(p => {
        html += `<div class="process-item">
          <span class="process-name">${p.name}</span>
          <span class="process-cpu">${p.cpu.toFixed(1)}%</span>
          <span class="process-mem">${formatBytes(p.mem)}</span>
        </div>`;
      });
      processList.innerHTML = html;
    }
  }

  function fetchStats() {
    window.electronAPI?.getStats?.().then(updateStats).catch(() => {});
  }

  fetchStats();
  const interval = setInterval(fetchStats, 2000);

  if (window.electronAPI) {
    window.electronAPI.onStats?.((stats) => updateStats(stats));
  }
})();