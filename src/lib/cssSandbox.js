import postcss from 'postcss';
import selectorParser from 'postcss-selector-parser';

export const SCOPE_CLASS = 'user-space-scope';
export const ALLOWED_CLASSES = ['space-card', 'space-btn', 'space-banner'];
export const ALLOWED_VARS = ['--accent', '--bg', '--text', '--font-mono'];

const DISALLOWED_TAGS = new Set([
  'html', 'body', 'base', 'script', 'iframe', 'object', 'embed',
  'link', 'meta', 'style', 'form', 'input', 'textarea', 'select', 'button',
]);

const DISALLOWED_AT_RULES = new Set(['import', 'use', 'charset', 'namespace', 'font-face', 'page', 'viewport']);
const PASSTHROUGH_AT_RULES = new Set(['media', 'supports']);

function escapeRegExp(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function nodePosition(node) {
  const start = node.source?.start;
  const end = node.source?.end;
  return {
    line: start?.line ?? 1,
    column: start?.column ?? 1,
    endLine: end?.line ?? start?.line ?? 1,
    endColumn: end?.column ?? (start?.column ?? 1) + 1,
  };
}

/**
 * Parses, sanitizes, and scopes user-authored CSS so it can never escape
 * `.user-space-scope`, touch document/script-level elements, exfiltrate data
 * via url()/expression()/javascript:, or define arbitrary custom properties.
 * Only `.space-card` / `.space-btn` / `.space-banner` rules and the
 * `--accent` / `--bg` / `--text` / `--font-mono` variables are permitted.
 *
 * @param {string} rawCss
 * @param {{ scopeSuffix?: string }} [options]
 * @returns {{ css: string, diagnostics: Array<{message:string, severity:'error'|'warning', line:number, column:number, endLine:number, endColumn:number}> }}
 */
export function sanitizeAndScopeCss(rawCss, options = {}) {
  const scopeSuffix = options.scopeSuffix || 'space';
  const diagnostics = [];

  if (!rawCss || !rawCss.trim()) {
    return { css: '', diagnostics: [] };
  }

  let root;
  try {
    root = postcss.parse(rawCss);
  } catch (err) {
    return {
      css: '',
      diagnostics: [{
        message: `CSS failed to parse: ${err.reason || err.message}`,
        severity: 'error',
        line: err.line || 1,
        column: err.column || 1,
        endLine: err.line || 1,
        endColumn: (err.column || 1) + 1,
      }],
    };
  }

  const keyframeRenames = new Map();

  root.walkAtRules((atRule) => {
    const name = atRule.name.toLowerCase();

    if (name === 'keyframes' || name === '-webkit-keyframes') {
      const original = atRule.params.trim();
      const unique = `${original}--${scopeSuffix}`;
      keyframeRenames.set(original, unique);
      atRule.params = unique;
      return;
    }

    if (DISALLOWED_AT_RULES.has(name)) {
      const pos = nodePosition(atRule);
      diagnostics.push({ message: `@${atRule.name} is not permitted and was removed.`, severity: 'error', ...pos });
      atRule.remove();
      return;
    }

    if (!PASSTHROUGH_AT_RULES.has(name)) {
      const pos = nodePosition(atRule);
      diagnostics.push({ message: `@${atRule.name} is not recognized and was removed.`, severity: 'warning', ...pos });
      atRule.remove();
    }
  });

  root.walkRules((rule) => {
    const insideKeyframes = rule.parent?.type === 'atrule' && /keyframes/i.test(rule.parent.name);
    if (insideKeyframes) return;

    let rejectedReason = null;
    let touchesAllowedClass = false;
    let transformedSelector;

    try {
      transformedSelector = selectorParser((selectors) => {
        selectors.each((selector) => {
          selector.walk((node) => {
            if (node.type === 'tag' && DISALLOWED_TAGS.has(node.value.toLowerCase())) {
              rejectedReason = `element selector "${node.value}" is not allowed`;
            }
            if (node.type === 'universal') {
              rejectedReason = 'universal selector "*" is not allowed';
            }
            if (node.type === 'attribute') {
              rejectedReason = 'attribute selectors are not allowed';
            }
            if (node.type === 'pseudo' && [':root', ':host', ':host-context'].includes(node.value)) {
              rejectedReason = `pseudo-selector "${node.value}" is not allowed`;
            }
            if (node.type === 'class' && ALLOWED_CLASSES.includes(node.value)) {
              touchesAllowedClass = true;
            }
          });
          selector.prepend(selectorParser.combinator({ value: ' ' }));
          selector.prepend(selectorParser.className({ value: SCOPE_CLASS }));
        });
      }).processSync(rule.selector);
    } catch {
      const pos = nodePosition(rule);
      diagnostics.push({ message: `Could not parse selector "${rule.selector}" — rule removed.`, severity: 'error', ...pos });
      rule.remove();
      return;
    }

    const pos = nodePosition(rule);
    if (rejectedReason) {
      diagnostics.push({ message: `Selector "${rule.selector}": ${rejectedReason} — rule removed.`, severity: 'error', ...pos });
      rule.remove();
      return;
    }
    if (!touchesAllowedClass) {
      diagnostics.push({
        message: `Selector "${rule.selector}" must target .space-card, .space-btn, or .space-banner — rule removed.`,
        severity: 'error',
        ...pos,
      });
      rule.remove();
      return;
    }

    rule.selector = transformedSelector;
  });

  root.walkDecls((decl) => {
    const prop = decl.prop.toLowerCase();
    const value = decl.value;
    const pos = nodePosition(decl);

    if (/url\s*\(/i.test(value)) {
      diagnostics.push({ message: `"${prop}" uses url(...) which is not allowed — declaration removed.`, severity: 'error', ...pos });
      decl.remove();
      return;
    }
    if (/expression\s*\(/i.test(value)) {
      diagnostics.push({ message: `"${prop}" uses expression(...) which is not allowed — declaration removed.`, severity: 'error', ...pos });
      decl.remove();
      return;
    }
    if (/javascript\s*:/i.test(value)) {
      diagnostics.push({ message: `"${prop}" contains a javascript: URI — declaration removed.`, severity: 'error', ...pos });
      decl.remove();
      return;
    }
    if (prop === 'position' && /\b(fixed|sticky)\b/i.test(value)) {
      diagnostics.push({ message: `"position: ${value}" can be used for clickjacking overlays and was removed.`, severity: 'error', ...pos });
      decl.remove();
      return;
    }
    if (/^(z-index)$/.test(prop) && Number(value) > 40) {
      diagnostics.push({ message: `z-index is capped at 40 inside a Space — declaration removed.`, severity: 'warning', ...pos });
      decl.remove();
      return;
    }
    if (prop.startsWith('--') && !ALLOWED_VARS.includes(prop)) {
      diagnostics.push({
        message: `Custom property "${prop}" is not allowed — only ${ALLOWED_VARS.join(', ')} may be defined.`,
        severity: 'error',
        ...pos,
      });
      decl.remove();
    }
  });

  if (keyframeRenames.size > 0) {
    root.walkDecls(/^(-webkit-)?animation(-name)?$/i, (decl) => {
      let value = decl.value;
      for (const [original, unique] of keyframeRenames) {
        value = value.replace(new RegExp(`\\b${escapeRegExp(original)}\\b`, 'g'), unique);
      }
      decl.value = value;
    });
  }

  root.walkRules((rule) => {
    if (rule.nodes.length === 0) rule.remove();
  });
  root.walkAtRules((atRule) => {
    if (PASSTHROUGH_AT_RULES.has(atRule.name.toLowerCase()) && (!atRule.nodes || atRule.nodes.length === 0)) {
      atRule.remove();
    }
  });

  return { css: root.toString(), diagnostics };
}
