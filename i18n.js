(() => {
  'use strict';

  const LANGUAGE_OPTIONS = [
    ['en', 'English'], ['zh', '中文'], ['ja', '日本語'], ['ko', '한국어'],
    ['fr', 'Français'], ['de', 'Deutsch'], ['es', 'Español'], ['it', 'Italiano'],
    ['ru', 'Русский'], ['pt', 'Português'], ['vi', 'Tiếng Việt'], ['id', 'Bahasa Indonesia'],
    ['th', 'ไทย'], ['ms', 'Bahasa Melayu']
  ];
  const STORAGE_KEY = 'airhaven-language';
  const TRANSLATABLE_ATTRIBUTES = ['aria-label', 'placeholder', 'alt', 'title'];
  const ORIGINAL_TEXT = new WeakMap();
  const ORIGINAL_ATTRIBUTES = new WeakMap();
  let activeLanguage = 'en';
  let translationRun = 0;
  let applyingTranslations = false;
  let originalTitle = document.title;
  let mutationTimer = null;

  const $ = selector => document.querySelector(selector);

  function canTranslateText(value) {
    return Boolean(value && value.trim() && value.trim().length <= 1000 && /[A-Za-z]/.test(value));
  }

  function isExcluded(element) {
    return !element || Boolean(element.closest('[data-no-translate], script, style, noscript, svg, option'));
  }

  function textCandidate(node) {
    if (!node.parentElement || isExcluded(node.parentElement)) return null;
    if (!ORIGINAL_TEXT.has(node)) ORIGINAL_TEXT.set(node, node.nodeValue);
    const original = ORIGINAL_TEXT.get(node);
    return canTranslateText(original) ? { type: 'text', node, original } : null;
  }

  function attributeCandidate(element, name) {
    if (isExcluded(element) || !element.hasAttribute(name)) return null;
    let originals = ORIGINAL_ATTRIBUTES.get(element);
    if (!originals) {
      originals = new Map();
      ORIGINAL_ATTRIBUTES.set(element, originals);
    }
    if (!originals.has(name)) originals.set(name, element.getAttribute(name));
    const original = originals.get(name);
    return canTranslateText(original) ? { type: 'attribute', element, name, original } : null;
  }

  function collectCandidates(root = document.body) {
    const candidates = [];
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    let node;

    while ((node = walker.nextNode())) {
      const candidate = textCandidate(node);
      if (candidate) candidates.push(candidate);
    }

    const elements = [root, ...root.querySelectorAll('*')];
    for (const element of elements) {
      if (!(element instanceof Element) || isExcluded(element)) continue;
      for (const name of TRANSLATABLE_ATTRIBUTES) {
        const candidate = attributeCandidate(element, name);
        if (candidate) candidates.push(candidate);
      }
    }

    if (root === document.body) {
      const description = document.querySelector('meta[name="description"]');
      const candidate = description && attributeCandidate(description, 'content');
      if (candidate) candidates.push(candidate);
    }

    return candidates;
  }

  function applyCandidate(candidate, value) {
    if (candidate.type === 'title') {
      document.title = value;
      return;
    }
    if (candidate.type === 'text') {
      const leading = candidate.original.match(/^\s*/)[0];
      const trailing = candidate.original.match(/\s*$/)[0];
      candidate.node.nodeValue = `${leading}${value.trim()}${trailing}`;
      return;
    }
    candidate.element.setAttribute(candidate.name, value);
  }

  function restoreCandidates(candidates) {
    applyingTranslations = true;
    candidates.forEach(candidate => applyCandidate(candidate, candidate.original));
    applyingTranslations = false;
  }

  async function requestTranslations(texts, to) {
    const response = await fetch('/api/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ texts, from: 'en', to })
    });
    if (!response.ok) throw new Error('Translation request failed');
    const payload = await response.json();
    if (!Array.isArray(payload.translations) || payload.translations.length !== texts.length) {
      throw new Error('Translation response was incomplete');
    }
    return payload.translations;
  }

  async function translateCandidates(candidates, to, run) {
    const uniqueTexts = [...new Set(candidates.map(candidate => candidate.original))];
    const translations = new Map();

    for (let index = 0; index < uniqueTexts.length; index += 40) {
      const texts = uniqueTexts.slice(index, index + 40);
      const values = await requestTranslations(texts, to);
      texts.forEach((text, valueIndex) => translations.set(text, values[valueIndex]));
      if (run !== translationRun || to !== activeLanguage) return;
    }

    applyingTranslations = true;
    candidates.forEach(candidate => applyCandidate(candidate, translations.get(candidate.original) || candidate.original));
    applyingTranslations = false;
  }

  function saveLanguage(language) {
    try { localStorage.setItem(STORAGE_KEY, language); } catch { /* Storage can be unavailable. */ }
  }

  function savedLanguage() {
    try { return localStorage.getItem(STORAGE_KEY); } catch { return null; }
  }

  async function setLanguage(language) {
    const select = $('#languageSelect');
    if (!LANGUAGE_OPTIONS.some(([code]) => code === language)) return;
    const run = ++translationRun;
    activeLanguage = language;
    document.documentElement.lang = language;
    saveLanguage(language);
    if (select) select.disabled = true;

    const candidates = collectCandidates();
    candidates.push({ type: 'title', original: originalTitle });
    if (language === 'en') {
      restoreCandidates(candidates);
      if (select) select.disabled = false;
      return;
    }

    try {
      await translateCandidates(candidates, language, run);
    } catch {
      if (run === translationRun) restoreCandidates(candidates);
    } finally {
      if (run === translationRun && select) select.disabled = false;
    }
  }

  function addLanguageOptions(select) {
    select.replaceChildren(...LANGUAGE_OPTIONS.map(([code, label]) => {
      const option = document.createElement('option');
      option.value = code;
      option.textContent = label;
      return option;
    }));
  }

  function translateDynamicContent() {
    mutationTimer = null;
    if (activeLanguage === 'en' || applyingTranslations) return;
    translateCandidates(collectCandidates(), activeLanguage, translationRun).catch(() => {});
  }

  function observeDynamicContent() {
    const observer = new MutationObserver(() => {
      if (activeLanguage === 'en' || applyingTranslations) return;
      clearTimeout(mutationTimer);
      mutationTimer = setTimeout(translateDynamicContent, 60);
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  document.addEventListener('DOMContentLoaded', () => {
    const select = $('#languageSelect');
    if (!select) return;

    addLanguageOptions(select);
    const language = savedLanguage();
    if (LANGUAGE_OPTIONS.some(([code]) => code === language)) select.value = language;
    select.addEventListener('change', () => setLanguage(select.value));
    observeDynamicContent();
    if (select.value !== 'en') setLanguage(select.value);
  });
})();
