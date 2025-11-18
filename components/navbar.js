class CustomNavbar extends HTMLElement {
  connectedCallback() {
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.innerHTML = `
      <style>
        :host { display:block }
        nav {
          background: #ffffff;
          border-bottom: 1px solid #eee;
          padding: 12px 20px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .brand { font-weight: 800; color:#556B2F; font-size: 1.25rem; }
        .actions { display:flex; align-items:center; gap:.5rem }
        .btn {
          appearance:none; border:0; background:#e5e7eb; color:#111827;
          padding: .5rem .75rem; border-radius:.5rem; font-weight:500;
          text-decoration:none; display:inline-flex; align-items:center; gap:.5rem;
          transition: filter .15s ease, background-color .15s ease;
        }
        .btn:hover { filter: brightness(.95) }
        .logout { background:transparent; color:#475569; padding:.35rem .5rem; border-radius:.5rem }
        .logout:hover, .logout:focus { color:#b91c1c; outline:2px solid rgba(239,68,68,.35) }
        .sep { height:1px; background:#f2f2f2 }
        .icon { width:16px; height:16px; display:inline-block }
      </style>
      <nav>
        <a href="/index.html" class="brand">Pietro</a>
        <div class="actions">
          <a href="/Clientes" class="btn" id="clients-link">Clientes</a>
          <a href="/Difusiones" class="btn" id="broadcasts-link">Difusiones</a>
          <button type="button" class="logout" id="logout-btn" aria-label="Cerrar sesión">
            <span class="icon">⎋</span>
            <span>Cerrar sesión</span>
          </button>
        </div>
      </nav>
    `;

    const btn = this.shadowRoot.getElementById('logout-btn');
    if (btn) {
      btn.addEventListener('click', () => {
        const overlay = document.createElement('div');
        overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.4);display:flex;align-items:center;justify-content:center;z-index:9999';
        const modal = document.createElement('div');
        modal.style.cssText = 'background:#fff;border-radius:12px;box-shadow:0 10px 30px rgba(0,0,0,.2);padding:16px 16px 12px;min-width:280px;';
        modal.innerHTML = `
          <div style="font-weight:700;color:#111827;margin-bottom:6px">¿Cerrar sesión?</div>
          <div style="color:#6b7280;font-size:14px;margin-bottom:12px">Se cerrará tu sesión actual.</div>
          <div style="display:flex;justify-content:flex-end;gap:8px">
            <button id="cancel" style="padding:8px 12px;border:1px solid #e5e7eb;border-radius:8px;background:#fff;color:#111827">Cancelar</button>
            <button id="ok" style="padding:8px 12px;border:0;border-radius:8px;background:#dc2626;color:#fff">Cerrar sesión</button>
          </div>`;
        overlay.appendChild(modal);
        document.body.appendChild(overlay);
        overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
        modal.querySelector('#cancel').addEventListener('click', () => overlay.remove());
        modal.querySelector('#ok').addEventListener('click', () => {
          try { localStorage.removeItem('access_token'); } catch {}
          location.href = '/login';
        });
      });
    }
  }
}
customElements.define('custom-navbar', CustomNavbar);