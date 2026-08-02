/*
 * Auth0 sign-in for every AirHaven page.
 *
 * Universal Login (Authorization Code flow with PKCE) via @auth0/auth0-spa-js,
 * loaded from the CDN ahead of this file. Only public client configuration
 * lives here — a browser app has nowhere to keep a client secret, and the
 * PKCE flow does not need one.
 *
 * redirect_uri is pinned to window.location.origin, so a single callback URL
 * in the Auth0 dashboard covers the whole storefront.
 *
 * Sign-in is strictly opt-in: product pages, the bag, and the demo checkout
 * behave exactly as before for visitors who never touch the account button.
 */
const AUTH0_DOMAIN = 'dev-yxxx3wu2nx8szji0.us.auth0.com';
const AUTH0_CLIENT_ID = '0SEEN9ZU31Ea6a4CHhQBBpcUsIxoTH6G';

let auth0Client = null;
let currentUser = null;
let authMenu = null;

const authButtons = () => [...document.querySelectorAll('[data-auth-button]')];

function labelAuthButtons(text, ariaLabel) {
  authButtons().forEach(button => {
    const label = button.querySelector('.auth-button-label');
    if (label) label.textContent = text;
    button.setAttribute('aria-label', ariaLabel);
    button.setAttribute('aria-expanded', 'false');
  });
}

function closeAuthMenu() {
  if (!authMenu || authMenu.hidden) return;
  authMenu.hidden = true;
  authButtons().forEach(button => button.setAttribute('aria-expanded', 'false'));
}

function ensureAuthMenu() {
  if (authMenu) return authMenu;
  authMenu = document.createElement('div');
  authMenu.className = 'auth-menu';
  authMenu.id = 'authMenu';
  authMenu.hidden = true;
  authMenu.innerHTML = `
    <p class="auth-menu-name"></p>
    <p class="auth-menu-email"></p>
    <button type="button" class="auth-menu-signout"><i data-lucide="log-out"></i> Sign out</button>`;
  document.body.appendChild(authMenu);
  authMenu.querySelector('.auth-menu-signout').addEventListener('click', async () => {
    closeAuthMenu();
    await auth0Client.logout({ logoutParams: { returnTo: window.location.origin } });
  });
  if (window.lucide) window.lucide.createIcons({ attrs: { 'aria-hidden': 'true' } });
  return authMenu;
}

function openAuthMenu(anchor) {
  const menu = ensureAuthMenu();
  const name = currentUser.name || currentUser.email || 'Signed in';
  menu.querySelector('.auth-menu-name').textContent = name;
  const emailLine = menu.querySelector('.auth-menu-email');
  const showEmail = Boolean(currentUser.email && currentUser.email !== name);
  emailLine.textContent = showEmail ? currentUser.email : '';
  emailLine.hidden = !showEmail;

  // Fixed position, right edge aligned with the button that opened it.
  const rect = anchor.getBoundingClientRect();
  menu.style.top = `${rect.bottom + 8}px`;
  menu.style.right = `${Math.max(12, window.innerWidth - rect.right)}px`;
  menu.hidden = false;
  anchor.setAttribute('aria-expanded', 'true');
}

async function onAuthButtonClick(event) {
  if (!auth0Client) return;
  if (!currentUser) {
    await auth0Client.loginWithRedirect();
    return;
  }
  if (authMenu && !authMenu.hidden) closeAuthMenu();
  else openAuthMenu(event.currentTarget);
}

function renderAuthState() {
  if (currentUser) {
    const name = currentUser.name || currentUser.email || 'Account';
    labelAuthButtons(name, `Account menu: ${name}`);
  } else {
    labelAuthButtons('Sign in', 'Sign in');
  }
}

async function initAuth() {
  // If the CDN script was blocked (offline, content blocker) the buttons
  // simply stay inert — the rest of the storefront is unaffected.
  if (!window.auth0 || typeof window.auth0.createAuth0Client !== 'function') return;

  auth0Client = await window.auth0.createAuth0Client({
    domain: AUTH0_DOMAIN,
    clientId: AUTH0_CLIENT_ID,
    // A multi-page static site reloads on every navigation; localStorage keeps
    // the session alive across those reloads. Tokens never leave the browser.
    cacheLocation: 'localstorage',
    authorizationParams: { redirect_uri: window.location.origin }
  });

  // Back from Universal Login: swap the code for tokens, then strip the
  // parameters so a refresh or shared link stays clean.
  const query = window.location.search;
  if (query.includes('code=') && query.includes('state=')) {
    try {
      await auth0Client.handleRedirectCallback();
    } catch (error) {
      console.error('Auth0 redirect callback failed:', error);
    }
    window.history.replaceState({}, document.title, window.location.pathname);
  }

  currentUser = (await auth0Client.isAuthenticated()) ? await auth0Client.getUser() : null;
  renderAuthState();
}

document.addEventListener('DOMContentLoaded', () => {
  authButtons().forEach(button => button.addEventListener('click', onAuthButtonClick));
  document.addEventListener('click', event => {
    if (event.target.closest('.auth-menu') || event.target.closest('[data-auth-button]')) return;
    closeAuthMenu();
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') closeAuthMenu();
  });
  window.addEventListener('resize', closeAuthMenu);

  initAuth().catch(error => console.error('Auth0 initialisation failed:', error));
});
