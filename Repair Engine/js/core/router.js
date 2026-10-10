// File: /js/core/router.js
// Client-side Hash Router with Protected Routes & Fullscreen Login Layout

import { auth } from './auth.js';

class Router {
  constructor() {
    this.routes = new Map();
    this.currentPath = '';
    window.addEventListener('hashchange', () => this.handleRoute());
  }

  register(path, pageModule, allowedRoles = []) {
    this.routes.set(path, { pageModule, allowedRoles });
  }

  navigate(path) {
    window.location.hash = path;
  }

  async handleRoute() {
    const rawHash = window.location.hash.slice(1) || '';
    const [path] = rawHash.split('?');
    const isAuthed = auth.isAuthenticated();

    // 1. If not authenticated, force clean full-screen Login
    if (!isAuthed) {
      if (path !== '/login') {
        this.navigate('/login');
        return;
      }
    } else {
      // If authenticated and tries to visit /login, redirect to /dashboard
      if (path === '/login' || !path) {
        this.navigate('/dashboard');
        return;
      }
    }

    const targetPath = path || (isAuthed ? '/dashboard' : '/login');
    const route = this.routes.get(targetPath) || this.routes.get('/dashboard');

    if (!route) return;

    // Toggle Fullscreen Login Layout vs Dashboard App Shell
    const appContainer = document.querySelector('.app-container');
    const sidebar = document.getElementById('sidebar');
    const topbar = document.querySelector('.app-topbar');

    if (targetPath === '/login') {
      document.body.classList.add('login-active');
      if (sidebar) sidebar.style.display = 'none';
      if (topbar) topbar.style.display = 'none';
      if (appContainer) appContainer.style.display = 'block';
    } else {
      document.body.classList.remove('login-active');
      if (sidebar) sidebar.style.display = 'flex';
      if (topbar) topbar.style.display = 'flex';
      if (appContainer) appContainer.style.display = 'flex';
      
      const user = auth.getCurrentUser();
      if (user && window.updateRoleUI) {
        window.updateRoleUI(user);
      }
    }

    // Role Guard Check
    const profile = auth.getCurrentUser();
    if (route.allowedRoles.length > 0 && profile) {
      if (profile.role !== 'super_admin' && !route.allowedRoles.includes(profile.role)) {
        console.warn('Access denied for role:', profile.role, 'on path:', targetPath);
        this.navigate('/dashboard');
        return;
      }
    }

    // Update active nav link
    document.querySelectorAll('.nav-link').forEach(link => {
      if (link.getAttribute('href') === `#${targetPath}`) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });

    const contentArea = document.getElementById('main-content');
    if (contentArea && route.pageModule.render) {
      this.currentPath = targetPath;
      contentArea.innerHTML = '';
      const pageEl = await route.pageModule.render();
      if (pageEl) contentArea.appendChild(pageEl);
    }
  }

  init() {
    this.handleRoute();
  }
}

export const router = new Router();
