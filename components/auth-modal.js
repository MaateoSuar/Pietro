class AuthModal extends HTMLElement {
  connectedCallback() {
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.innerHTML = `
      <style>
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0,0,0,0.5);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1000;
        }
        .modal-content {
          background: white;
          padding: 2rem;
          border-radius: 8px;
          width: 100%;
          max-width: 400px;
          box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }
        .logo {
          text-align: center;
          margin-bottom: 2rem;
          font-size: 2rem;
          font-weight: 700;
        }
        .logo span {
          color: #6B8E23;
        }
        .form-group {
          margin-bottom: 1.5rem;
        }
        label {
          display: block;
          margin-bottom: 0.5rem;
          color: #1A1A1A;
          font-weight: 500;
        }
        input {
          width: 100%;
          padding: 0.75rem;
          border: 1px solid #E0E0E0;
          border-radius: 4px;
          font-size: 1rem;
        }
        input:focus {
          outline: none;
          border-color: #6B8E23;
          box-shadow: 0 0 0 2px rgba(107,142,35,0.2);
        }
        button {
          width: 100%;
          padding: 0.75rem;
          background: #6B8E23;
          color: white;
          border: none;
          border-radius: 4px;
          font-size: 1rem;
          font-weight: 500;
          cursor: pointer;
          transition: background 0.2s ease;
        }
        button:hover {
          background: #5a7b1d;
        }
        .error {
          color: #dc2626;
          font-size: 0.875rem;
          margin-top: 0.5rem;
          display: none;
        }
      </style>
      <div class="modal-overlay">
        <div class="modal-content">
          <div class="logo"><span>Pietro</span> CRM</div>
          <form id="login-form">
            <div class="form-group">
              <label for="username">Usuario</label>
              <input type="text" id="username" required>
              <div class="error" id="username-error">Usuario requerido</div>
            </div>
            <div class="form-group">
              <label for="password">Contraseña</label>
              <input type="password" id="password" required>
              <div class="error" id="password-error">Contraseña requerida</div>
            </div>
            <button type="submit">Ingresar</button>
          </form>
        </div>
      </div>
    `;

    this.shadowRoot.getElementById('login-form').addEventListener('submit', this.handleLogin.bind(this));
  }

  async handleLogin(e) {
    e.preventDefault();
    const username = this.shadowRoot.getElementById('username').value;
    const password = this.shadowRoot.getElementById('password').value;

    // Simple validation
    let isValid = true;
    if (!username) {
      this.shadowRoot.getElementById('username-error').style.display = 'block';
      isValid = false;
    } else {
      this.shadowRoot.getElementById('username-error').style.display = 'none';
    }

    if (!password) {
      this.shadowRoot.getElementById('password-error').style.display = 'block';
      isValid = false;
    } else {
      this.shadowRoot.getElementById('password-error').style.display = 'none';
    }

    if (!isValid) return;

    try {
      const apiBase = localStorage.getItem('apiBase') || 'http://127.0.0.1:8000';
      const response = await fetch(`${apiBase}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password })
      });

      if (response.ok) {
        const data = await response.json();
        const token = data.access_token || data.token;
        if (token) {
          localStorage.setItem('authToken', token);
        }
        window.location.href = '/';
      } else {
        if (typeof showToast === 'function') {
          showToast('Credenciales incorrectas', 'error');
        } else {
          alert('Credenciales incorrectas');
        }
      }
    } catch (error) {
      console.error('Login error:', error);
      if (typeof showToast === 'function') {
        showToast('Error de conexión', 'error');
      } else {
        alert('Error de conexión');
      }
    }
  }
}
customElements.define('auth-modal', AuthModal);