// ─────────────────────────────────────────────────────────────
// ESLint custom rule: no-hardcoded-strings
// Flags raw user-facing literal strings in JSX/TSX components to enforce
// i18n message catalogs (id.json / en.json) and CMS content.
// ─────────────────────────────────────────────────────────────

module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow hardcoded user-facing strings in JSX components; use i18n translation keys instead.',
      category: 'Internationalization',
      recommended: true,
    },
    schema: [],
    messages: {
      noHardcodedText: 'Hardcoded user-facing string "{{text}}" found in JSX. Use i18n hook/message catalog instead.',
    },
  },
  create(context) {
    function isAllowedString(str) {
      const trimmed = str.trim();
      // Allow whitespace, punctuation only, numbers, or single characters
      if (!trimmed || /^[\d\s.,:;!?()[\]{}\\/|\-+=*&^%$#@~`><"']+$/.test(trimmed)) {
        return true;
      }
      // Allow data attributes, class names, test IDs, icons, URLs, CSS vars
      if (
        trimmed.startsWith('http://') ||
        trimmed.startsWith('https://') ||
        trimmed.startsWith('/') ||
        trimmed.startsWith('#') ||
        trimmed.startsWith('var(') ||
        /^[a-z0-9\-_]+$/i.test(trimmed) && trimmed.length < 4
      ) {
        return true;
      }
      return false;
    }

    return {
      JSXText(node) {
        const value = node.value.trim();
        if (value && !isAllowedString(value)) {
          context.report({
            node,
            messageId: 'noHardcodedText',
            data: { text: value.slice(0, 30) },
          });
        }
      },
      JSXAttribute(node) {
        const attrName = node.name && node.name.name;
        // Check attributes that typically hold user-facing text
        const translatableAttrs = ['placeholder', 'title', 'alt', 'aria-label'];
        if (
          translatableAttrs.includes(attrName) &&
          node.value &&
          node.value.type === 'Literal' &&
          typeof node.value.value === 'string'
        ) {
          const val = node.value.value.trim();
          if (!isAllowedString(val)) {
            context.report({
              node,
              messageId: 'noHardcodedText',
              data: { text: val.slice(0, 30) },
            });
          }
        }
      },
    };
  },
};
