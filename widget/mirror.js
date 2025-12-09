/**
 * Mirror.Me Widget - Embeddable Virtual Try-On
 * Version: 1.0.0
 *
 * Usage:
 * <script src="https://fashionmirror.shop/widget/mirror.js"></script>
 * <button class="mirror-me-button" data-merchant-key="mk_live_xxx" data-product-image="...">Try it on</button>
 */
(function(window, document) {
  'use strict';

  // Prevent double initialization
  if (window.MirrorMe && window.MirrorMe._initialized) {
    return;
  }

  // Configuration
  const WIDGET_VERSION = '1.0.0';
  const API_BASE = (function() {
    // Auto-detect base URL from script src
    const scripts = document.querySelectorAll('script[src*="mirror.js"]');
    if (scripts.length > 0) {
      const src = scripts[scripts.length - 1].src;
      const url = new URL(src);
      return url.origin;
    }
    return 'https://fashionmirror.shop';
  })();

  const CSS_URL = API_BASE + '/widget/mirror.css';
  const IFRAME_URL = API_BASE + '/widget/embed';

  // Event emitter
  class EventEmitter {
    constructor() {
      this._events = {};
    }

    on(event, handler) {
      if (!this._events[event]) {
        this._events[event] = [];
      }
      this._events[event].push(handler);
      return this;
    }

    off(event, handler) {
      if (!this._events[event]) return this;
      if (!handler) {
        delete this._events[event];
      } else {
        this._events[event] = this._events[event].filter(h => h !== handler);
      }
      return this;
    }

    emit(event, ...args) {
      if (!this._events[event]) return;
      this._events[event].forEach(handler => {
        try {
          handler(...args);
        } catch (e) {
          console.error('[MirrorMe] Event handler error:', e);
        }
      });
    }
  }

  // Main MirrorMe class
  class MirrorMeWidget extends EventEmitter {
    constructor(config = {}) {
      super();
      this.config = {
        merchantKey: config.merchantKey || null,
        theme: config.theme || 'auto',
        locale: config.locale || 'en',
        debug: config.debug || false,
        ...config
      };

      this._isOpen = false;
      this._modal = null;
      this._iframe = null;
      this._session = null;
      this._cssLoaded = false;
      this._preloaded = false;

      // Bind callbacks from config
      if (config.onReady) this.on('ready', config.onReady);
      if (config.onOpen) this.on('open', config.onOpen);
      if (config.onClose) this.on('close', config.onClose);
      if (config.onResult) this.on('result', config.onResult);
      if (config.onError) this.on('error', config.onError);
      if (config.onPhotoSelected) this.on('photoSelected', config.onPhotoSelected);
      if (config.onProcessingStart) this.on('processingStart', config.onProcessingStart);
      if (config.onProcessingProgress) this.on('processingProgress', config.onProcessingProgress);

      this._log('Initialized with config:', this.config);
    }

    _log(...args) {
      if (this.config.debug) {
        console.log('[MirrorMe]', ...args);
      }
    }

    _error(...args) {
      console.error('[MirrorMe]', ...args);
    }

    // Load CSS stylesheet
    async _loadCSS() {
      if (this._cssLoaded) return;

      return new Promise((resolve) => {
        const existing = document.querySelector('link[href*="mirror.css"]');
        if (existing) {
          this._cssLoaded = true;
          resolve();
          return;
        }

        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = CSS_URL;
        link.onload = () => {
          this._cssLoaded = true;
          resolve();
        };
        link.onerror = () => {
          this._error('Failed to load CSS');
          resolve(); // Continue anyway with inline styles
        };
        document.head.appendChild(link);
      });
    }

    // Create modal container
    _createModal() {
      if (this._modal) return this._modal;

      const modal = document.createElement('div');
      modal.className = 'mirror-me-modal';
      modal.setAttribute('data-mirror-me-theme', this._getTheme());
      modal.innerHTML = `
        <div class="mirror-me-backdrop"></div>
        <div class="mirror-me-container">
          <button class="mirror-me-close" aria-label="Close">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
          <div class="mirror-me-loading">
            <div class="mirror-me-spinner"></div>
            <p>Loading Mirror.Me...</p>
          </div>
          <iframe class="mirror-me-iframe" style="display: none;" allow="camera; microphone"></iframe>
        </div>
      `;

      // Event handlers
      const backdrop = modal.querySelector('.mirror-me-backdrop');
      const closeBtn = modal.querySelector('.mirror-me-close');

      backdrop.addEventListener('click', () => this.close('user'));
      closeBtn.addEventListener('click', () => this.close('user'));

      document.body.appendChild(modal);
      this._modal = modal;
      this._iframe = modal.querySelector('.mirror-me-iframe');

      return modal;
    }

    // Get effective theme
    _getTheme() {
      if (this.config.theme === 'auto') {
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      }
      return this.config.theme;
    }

    // Setup postMessage listener
    _setupMessageListener() {
      if (this._messageHandler) return;

      this._messageHandler = (event) => {
        // Validate origin
        if (!event.origin.includes(new URL(API_BASE).hostname)) {
          return;
        }

        const { type, payload } = event.data || {};
        this._log('Received message:', type, payload);

        switch (type) {
          case 'mirrorme:ready':
            this._onIframeReady();
            break;
          case 'mirrorme:close':
            this.close(payload?.reason || 'user');
            break;
          case 'mirrorme:result':
            this._onResult(payload);
            break;
          case 'mirrorme:error':
            this._onError(payload);
            break;
          case 'mirrorme:photoSelected':
            this.emit('photoSelected', payload);
            break;
          case 'mirrorme:processingStart':
            this.emit('processingStart');
            break;
          case 'mirrorme:processingProgress':
            this.emit('processingProgress', payload?.progress || 0);
            break;
          case 'mirrorme:resize':
            this._handleResize(payload);
            break;
        }
      };

      window.addEventListener('message', this._messageHandler);
    }

    _onIframeReady() {
      const loading = this._modal.querySelector('.mirror-me-loading');
      const iframe = this._modal.querySelector('.mirror-me-iframe');

      loading.style.display = 'none';
      iframe.style.display = 'block';

      this._log('Iframe ready');
    }

    _onResult(result) {
      this._log('Result received:', result);
      this._session = { ...this._session, result };
      this.emit('result', result);
    }

    _onError(error) {
      this._error('Error:', error);
      this.emit('error', error);
    }

    _handleResize(dimensions) {
      // Handle dynamic iframe resizing if needed
      this._log('Resize request:', dimensions);
    }

    // Parse data attributes from element
    _parseDataAttributes(element) {
      const data = element.dataset;
      return {
        merchantKey: data.merchantKey,
        product: {
          image: data.productImage,
          name: data.productName,
          id: data.productId,
          category: data.productCategory,
          price: data.productPrice ? parseFloat(data.productPrice) : undefined,
          currency: data.productCurrency,
          url: data.productUrl,
          brand: data.productBrand,
          specification: data.productSpecification,
          description: data.productDescription,
        },
        user: {
          image: data.userImage,
          id: data.userId,
          email: data.userEmail,
          name: data.userName,
        },
        options: {
          skipPhotoStep: data.skipPhotoStep === 'true',
          allowCamera: data.allowCamera !== 'false',
          allowUpload: data.allowUpload !== 'false',
          autoClose: data.autoClose === 'true',
          showShare: data.showShare !== 'false',
          showDownload: data.showDownload !== 'false',
          callbackUrl: data.callbackUrl,
        },
        theme: data.theme,
        locale: data.locale,
        buttonStyle: data.buttonStyle,
        buttonSize: data.buttonSize,
        modalSize: data.modalSize,
        position: data.position,
      };
    }

    // Preload resources
    async preload() {
      if (this._preloaded) return;

      this._log('Preloading resources...');
      await this._loadCSS();
      this._setupMessageListener();
      this._preloaded = true;
    }

    // Open the try-on modal
    async open(options = {}) {
      if (this._isOpen) {
        this._log('Modal already open');
        return;
      }

      this._log('Opening modal with options:', options);

      // Merge options
      const merchantKey = options.merchantKey || this.config.merchantKey;
      if (!merchantKey) {
        this._error('No merchant key provided');
        this.emit('error', { code: 'NO_MERCHANT_KEY', message: 'Merchant key is required' });
        return;
      }

      const product = options.product || {};
      if (!product.image) {
        this._error('No product image provided');
        this.emit('error', { code: 'NO_PRODUCT_IMAGE', message: 'Product image is required' });
        return;
      }

      // Ensure CSS and listeners are ready
      await this.preload();

      // Create modal if needed
      this._createModal();

      // Build iframe URL with session data
      const params = new URLSearchParams({
        merchantKey,
        productImage: product.image,
        theme: options.theme || this.config.theme || 'auto',
        locale: options.locale || this.config.locale || 'en',
      });

      // Add optional product params
      if (product.name) params.set('productName', product.name);
      if (product.id) params.set('productId', product.id);
      if (product.category) params.set('productCategory', product.category);
      if (product.price) params.set('productPrice', String(product.price));
      if (product.currency) params.set('productCurrency', product.currency);
      if (product.url) params.set('productUrl', product.url);
      if (product.specification) params.set('productSpecification', product.specification);
      if (product.description) params.set('productDescription', product.description);

      // Add user params
      const user = options.user || {};
      if (user.image) params.set('userImage', user.image);
      if (user.id) params.set('userId', user.id);

      // Add options
      const opts = options.options || {};
      if (opts.skipPhotoStep) params.set('skipPhotoStep', 'true');
      if (opts.allowCamera === false) params.set('allowCamera', 'false');
      if (opts.allowUpload === false) params.set('allowUpload', 'false');

      // Show modal
      this._modal.classList.add('mirror-me-modal--open');
      document.body.style.overflow = 'hidden';
      this._isOpen = true;

      // Reset loading state
      const loading = this._modal.querySelector('.mirror-me-loading');
      const iframe = this._modal.querySelector('.mirror-me-iframe');
      loading.style.display = 'flex';
      iframe.style.display = 'none';

      // Load iframe
      const iframeUrl = `${IFRAME_URL}?${params.toString()}`;
      this._log('Loading iframe:', iframeUrl);
      this._iframe.src = iframeUrl;

      // Generate session ID for tracking
      const sessionId = 'ses_' + Math.random().toString(36).substr(2, 16);
      this._session = { id: sessionId, product, user: options.user };

      this.emit('open', sessionId);

      // Add keyboard listener
      this._escapeHandler = (e) => {
        if (e.key === 'Escape') {
          this.close('user');
        }
      };
      document.addEventListener('keydown', this._escapeHandler);
    }

    // Close the modal
    close(reason = 'user') {
      if (!this._isOpen) return;

      this._log('Closing modal, reason:', reason);

      this._modal.classList.remove('mirror-me-modal--open');
      document.body.style.overflow = '';
      this._isOpen = false;

      // Clear iframe to stop any processing
      if (this._iframe) {
        this._iframe.src = 'about:blank';
      }

      // Remove keyboard listener
      if (this._escapeHandler) {
        document.removeEventListener('keydown', this._escapeHandler);
        this._escapeHandler = null;
      }

      this.emit('close', reason);
    }

    // Check if modal is open
    isOpen() {
      return this._isOpen;
    }

    // Get current session info
    getSession() {
      return this._session;
    }

    // Update configuration
    setConfig(config) {
      this.config = { ...this.config, ...config };
      this._log('Config updated:', this.config);
    }

    // Destroy the widget
    destroy() {
      this._log('Destroying widget');

      if (this._isOpen) {
        this.close('destroy');
      }

      if (this._messageHandler) {
        window.removeEventListener('message', this._messageHandler);
        this._messageHandler = null;
      }

      if (this._modal) {
        this._modal.remove();
        this._modal = null;
        this._iframe = null;
      }

      this._events = {};
    }
  }

  // Mirror.me Logo SVG
  const MIRROR_ME_LOGO_SVG = `<svg class="mirror-me-logo" viewBox="0 0 800 210" xmlns="http://www.w3.org/2000/svg">
    <text x="40" y="145"
          fill="currentColor"
          font-family="Comic Sans MS, Comic Sans, cursive"
          font-style="italic"
          font-weight="700"
          font-size="130"
          letter-spacing="-3">
      Mirror
    </text>
    <rect x="455" y="128" width="14" height="14"
          fill="currentColor"
          transform="rotate(45 462 135)" />
    <text x="482" y="145"
          fill="currentColor"
          font-family="Inter, Arial, sans-serif"
          font-weight="600"
          font-size="90">
      me
    </text>
  </svg>`;

  // Auto-initialization
  function autoInit() {
    // Find all buttons with mirror-me-button class
    const buttons = document.querySelectorAll('.mirror-me-button');

    if (buttons.length === 0) {
      return;
    }

    // Create a default instance for auto-detected buttons
    const defaultInstance = new MirrorMeWidget({ debug: false });
    defaultInstance.preload();

    buttons.forEach((button) => {
      // Skip if already initialized
      if (button._mirrorMeInit) return;
      button._mirrorMeInit = true;

      // Replace button content with Mirror.me logo (unless data-keep-text is set)
      if (!button.hasAttribute('data-keep-text')) {
        button.innerHTML = MIRROR_ME_LOGO_SVG;
      }

      button.addEventListener('click', (e) => {
        e.preventDefault();

        const attrs = defaultInstance._parseDataAttributes(button);

        // Update theme/locale from button attributes if specified
        if (attrs.theme) defaultInstance.setConfig({ theme: attrs.theme });
        if (attrs.locale) defaultInstance.setConfig({ locale: attrs.locale });

        defaultInstance.open({
          merchantKey: attrs.merchantKey,
          product: attrs.product,
          user: attrs.user,
          options: attrs.options,
          theme: attrs.theme,
          locale: attrs.locale,
        });
      });
    });
  }

  // Static initialization method
  function init(config) {
    return new MirrorMeWidget(config);
  }

  // Export to global
  window.MirrorMe = {
    _initialized: true,
    version: WIDGET_VERSION,
    init,
    _Widget: MirrorMeWidget, // Expose for advanced usage
  };

  // Auto-initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', autoInit);
  } else {
    autoInit();
  }

  // Emit ready event
  if (typeof CustomEvent !== 'undefined') {
    window.dispatchEvent(new CustomEvent('mirrormeReady', { detail: { version: WIDGET_VERSION } }));
  }

})(window, document);
