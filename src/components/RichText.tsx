import { Fragment, type ReactNode } from 'react';
import { TERM_REGEX, termIdForAlias } from '../glossary';
import { useUI } from '../store/ui';

/**
 * Rendu Markdown minimal et sûr (aucun innerHTML) : titres, listes, gras, code.
 * Les termes du glossaire sont rendus cliquables (première occurrence de chaque terme).
 */
export function RichText({ text, linkTerms = true }: { text: string; linkTerms?: boolean }) {
  const openTerm = useUI((s) => s.openTerm);
  const seen = new Set<string>();

  const linkify = (s: string, key: string): ReactNode[] => {
    if (!linkTerms) return [s];
    const out: ReactNode[] = [];
    let last = 0;
    TERM_REGEX.lastIndex = 0;
    let m: RegExpExecArray | null;
    let i = 0;
    while ((m = TERM_REGEX.exec(s))) {
      const word = m[1] ?? m[0];
      const id = termIdForAlias(word);
      if (!id || seen.has(id)) continue;
      seen.add(id);
      if (m.index > last) out.push(s.slice(last, m.index));
      out.push(
        <button key={`${key}-t${i++}`} type="button" className="term-link" onClick={() => openTerm(id)} title="Ouvrir la fiche du glossaire">
          {m[0]}
        </button>
      );
      last = m.index + m[0].length;
    }
    if (last < s.length) out.push(s.slice(last));
    return out;
  };

  const inline = (s: string, key: string): ReactNode[] => {
    const parts = s.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
    return parts.map((p, idx) => {
      const k = `${key}-${idx}`;
      if (p.startsWith('**') && p.endsWith('**') && p.length > 4) return <strong key={k}>{linkify(p.slice(2, -2), k)}</strong>;
      if (p.startsWith('`') && p.endsWith('`') && p.length > 2)
        return (
          <code key={k} className="rounded bg-line/5 px-1 font-mono text-[0.85em]">
            {p.slice(1, -1)}
          </code>
        );
      return <Fragment key={k}>{linkify(p, k)}</Fragment>;
    });
  };

  const lines = text.replace(/\r/g, '').split('\n');
  const blocks: ReactNode[] = [];
  let i = 0;
  let b = 0;
  while (i < lines.length) {
    const line = lines[i] ?? '';
    const key = `b${b++}`;
    if (line.startsWith('```')) {
      const code: string[] = [];
      i++;
      while (i < lines.length && !(lines[i] ?? '').startsWith('```')) code.push(lines[i++] ?? '');
      i++;
      blocks.push(
        <pre key={key} className="overflow-x-auto rounded-xl bg-line/5 p-3 font-mono text-xs leading-relaxed">
          {code.join('\n')}
        </pre>
      );
      continue;
    }
    const h = line.match(/^(#{1,4})\s+(.*)$/);
    if (h) {
      const level = h[1]?.length ?? 1;
      const cls = level <= 2 ? 'mt-3 text-base font-bold' : 'mt-2 text-sm font-bold';
      blocks.push(
        <p key={key} className={cls}>
          {inline(h[2] ?? '', key)}
        </p>
      );
      i++;
      continue;
    }
    if (/^\s*([-*•]|\d+[.)])\s+/.test(line)) {
      const ordered = /^\s*\d+[.)]/.test(line);
      const items: string[] = [];
      while (i < lines.length && /^\s*([-*•]|\d+[.)])\s+/.test(lines[i] ?? '')) {
        items.push((lines[i] ?? '').replace(/^\s*([-*•]|\d+[.)])\s+/, ''));
        i++;
      }
      const List = ordered ? 'ol' : 'ul';
      blocks.push(
        <List key={key} className={`${ordered ? 'list-decimal' : 'list-disc'} space-y-1 pl-5`}>
          {items.map((it, j) => (
            <li key={j}>{inline(it, `${key}-${j}`)}</li>
          ))}
        </List>
      );
      continue;
    }
    if (!line.trim()) {
      i++;
      continue;
    }
    const para: string[] = [];
    while (i < lines.length && (lines[i] ?? '').trim() && !/^(#{1,4}\s|```|\s*([-*•]|\d+[.)])\s+)/.test(lines[i] ?? '')) para.push(lines[i++] ?? '');
    blocks.push(<p key={key}>{inline(para.join(' '), key)}</p>);
  }
  return <div className="space-y-2 text-[0.95rem] leading-relaxed">{blocks}</div>;
}
