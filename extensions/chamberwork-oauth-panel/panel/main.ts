import { connectHost } from '@openchamber/sdk';

const host = connectHost();
const root = document.querySelector<HTMLElement>('#root')!;

let mounted = false;

host.onReady((ctx) => {
  if (mounted) return;
  mounted = true;

  const container = document.createElement('div');

  // Status indicator
  const status = document.createElement('div');
  status.className = 'status connected';
  status.textContent = '✓ CONNECTED TO CHAMBERWORK CONTROL PLANE';
  container.appendChild(status);

  // Tenant info
  const info = document.createElement('div');
  info.className = 'info';
  info.textContent = `Surface: ${ctx.surface} | Theme: ${ctx.theme.mode}`;
  container.appendChild(info);

  // Sync button
  const syncBtn = document.createElement('button');
  syncBtn.textContent = 'Sync Credentials';
  syncBtn.style.marginTop = '16px';
  syncBtn.addEventListener('click', async () => {
    try {
      await host.serviceRequest({ method: 'POST', path: '/sync', body: '{}' });
      await host.toast({ kind: 'success', message: 'Credentials synced successfully' });
    } catch (e) {
      await host.toast({ kind: 'error', message: 'Sync failed' });
    }
  });
  container.appendChild(syncBtn);

  root.appendChild(container);
});
