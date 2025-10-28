class CustomNavbar extends HTMLElement {
  connectedCallback() {
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.innerHTML = `
      <style>
        nav {
          background-color: #000;
          padding: 1rem 2rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
          position: fixed;
          width: 100%;
          top: 0;
          z-index: 1000;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .logo {
          color: white;
          font-weight: 800;
          font-size: 1.5rem;
          letter-spacing: 1px;
        }
        .logo span {
          color: #666;
        }
        ul {
          display: flex;
          gap: 2rem;
          list-style: none;
          margin: ;
          padding: 0;
          align-items: center;
          position: relative;
          left: -4rem;

        }
        a {
          color: white;
          text-decoration: none;
          font-weight: 500;
          transition: color 0.3s;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        a:hover {
          color: #ccc;
        }
        .cta {
          background-color: white;
          color: black;
          padding: 0.5rem 1.5rem;
          border-radius: 9999px;
          font-weight: 600;
          
          
        }
        .cta:hover {
          background-color: #eee;
          color: black;
        }
        @media (max-width: 768px) {
          nav {
            flex-direction: column;
            padding: 1rem;
          }
          ul {
            margin-top: 1rem;
            gap: 1rem;
          }
        }
      </style>
      <nav>
        <div class="logo">BARBER<span>MAX</span></div>
        <ul>
          <li><a href="/"><i data-feather="home"></i> Home</a></li>
          <li><a href="/booking.html"><i data-feather="calendar"></i> Book Now</a></li>
          <li><a href="/barbers.html"><i data-feather="users"></i> Our Barbers</a></li>
          <li><a href="/login.html" class="cta"><i data-feather="user"></i> Login</a></li>
        </ul>
      </nav>
    `;
  }
}
customElements.define('custom-navbar', CustomNavbar);