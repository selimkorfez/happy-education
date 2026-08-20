/**
 * A small tolerant HTML parser.
 *
 * Deliberately dependency-free: the migration must be runnable with plain `node`
 * on a clean checkout, and pulling a DOM library in for a one-off conversion is a
 * supply-chain cost with no ongoing benefit.
 *
 * It implements only what the WordPress/Elementor export actually contains:
 * quoted-attribute-aware tag scanning, void elements, raw-text elements, and the
 * implied end tags that make `<p>foo<p>bar` and `<li>a<li>b` parse the way a
 * browser parses them.
 */

export const VOID = new Set([
  'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta',
  'param', 'source', 'track', 'wbr',
])

export const RAW_TEXT = new Set(['script', 'style', 'textarea', 'title'])

/** Removed with their contents: nothing inside these can become body copy. */
export const DROP_SUBTREE = new Set([
  'script', 'style', 'iframe', 'noscript', 'svg', 'form', 'input', 'select',
  'textarea', 'button', 'link', 'meta', 'object', 'embed', 'video', 'audio',
  'canvas', 'template', 'head', 'nav',
])

const BLOCKISH = new Set([
  'address', 'article', 'aside', 'blockquote', 'details', 'div', 'dl', 'dd', 'dt',
  'fieldset', 'figcaption', 'figure', 'footer', 'form', 'h1', 'h2', 'h3', 'h4',
  'h5', 'h6', 'header', 'hr', 'li', 'main', 'nav', 'ol', 'p', 'pre', 'section',
  'table', 'tbody', 'td', 'tfoot', 'th', 'thead', 'tr', 'ul',
])

const ATTR_RE = /([a-zA-Z_:@][-a-zA-Z0-9_:.]*)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g

/** Find the `>` that ends a tag, ignoring `>` inside quoted attribute values. */
function findTagEnd(html, start) {
  let quote = null
  for (let i = start + 1; i < html.length; i += 1) {
    const c = html[i]
    if (quote) {
      if (c === quote) quote = null
      continue
    }
    if (c === '"' || c === "'") quote = c
    else if (c === '>') return i
  }
  return -1
}

function parseAttrs(source) {
  /** @type {Record<string,string>} */
  const attrs = {}
  if (!source) return attrs
  ATTR_RE.lastIndex = 0
  let m
  while ((m = ATTR_RE.exec(source)) !== null) {
    const name = m[1].toLowerCase()
    attrs[name] = m[2] ?? m[3] ?? m[4] ?? ''
  }
  return attrs
}

function impliedClose(stack, openTag) {
  const top = () => stack[stack.length - 1]
  const tagOf = (n) => (n && n.tag ? n.tag : null)
  for (;;) {
    const t = tagOf(top())
    if (!t) return
    if (t === 'p' && BLOCKISH.has(openTag) && openTag !== 'td' && openTag !== 'th') stack.pop()
    else if (t === 'li' && openTag === 'li') stack.pop()
    else if ((t === 'td' || t === 'th') && ['td', 'th', 'tr'].includes(openTag)) stack.pop()
    else if (t === 'tr' && openTag === 'tr') stack.pop()
    else if ((t === 'dd' || t === 'dt') && (openTag === 'dd' || openTag === 'dt')) stack.pop()
    else if (t === 'option' && openTag === 'option') stack.pop()
    else return
  }
}

/**
 * @param {string} html
 * @returns {{ type: 'root', children: Array<object> }}
 */
export function parseHtml(html) {
  const root = { type: 'root', tag: null, attrs: {}, children: [] }
  const stack = [root]
  const push = (node) => stack[stack.length - 1].children.push(node)
  const text = (value) => {
    if (value) push({ type: 'text', value })
  }

  let i = 0
  const len = html.length
  while (i < len) {
    const lt = html.indexOf('<', i)
    if (lt === -1) {
      text(html.slice(i))
      break
    }
    if (lt > i) text(html.slice(i, lt))

    if (html.startsWith('<!--', lt)) {
      const end = html.indexOf('-->', lt)
      i = end === -1 ? len : end + 3
      continue
    }
    if (html.startsWith('<!', lt) || html.startsWith('<?', lt)) {
      const end = html.indexOf('>', lt)
      i = end === -1 ? len : end + 1
      continue
    }

    const gt = findTagEnd(html, lt)
    if (gt === -1) {
      text(html.slice(lt))
      break
    }
    const inner = html.slice(lt + 1, gt)

    if (inner[0] === '/') {
      const name = inner.slice(1).trim().toLowerCase()
      // Pop to the nearest matching open element; ignore strays entirely.
      for (let s = stack.length - 1; s > 0; s -= 1) {
        if (stack[s].tag === name) {
          stack.length = s
          break
        }
      }
      i = gt + 1
      continue
    }

    const selfClosing = inner.endsWith('/')
    const body = selfClosing ? inner.slice(0, -1) : inner
    const space = body.search(/[\s/]/)
    const name = (space === -1 ? body : body.slice(0, space)).toLowerCase()
    if (!name || !/^[a-z][a-z0-9-]*$/.test(name)) {
      i = gt + 1
      continue
    }
    const attrs = parseAttrs(space === -1 ? '' : body.slice(space))
    const node = { type: 'element', tag: name, attrs, children: [] }

    if (RAW_TEXT.has(name)) {
      const closeRe = new RegExp(`</${name}\\s*>`, 'i')
      const rest = html.slice(gt + 1)
      const m = rest.match(closeRe)
      const end = m ? gt + 1 + (m.index ?? 0) : len
      if (!DROP_SUBTREE.has(name)) {
        node.children.push({ type: 'text', value: html.slice(gt + 1, end) })
      }
      push(node)
      i = m ? end + m[0].length : len
      continue
    }

    impliedClose(stack, name)
    stack[stack.length - 1].children.push(node)
    if (!VOID.has(name) && !selfClosing) stack.push(node)
    i = gt + 1
  }

  return root
}

/** Class-attribute test used to drop Elementor page-builder chrome. */
export function classList(node) {
  return String(node?.attrs?.class ?? '').split(/\s+/).filter(Boolean)
}
