#!/usr/bin/env python3
"""Look up references so citations are never written from memory.

Usage:
  python3 scripts/check-ref.py 10.1103/RevModPhys.87.307 arXiv:quant-ph/9508027 ...
      Prints one line per id: OK or MISSING, then year, authors, title and venue.
  python3 scripts/check-ref.py docs/references.md [--links]
      Checks every Sources row: each DOI and arXiv id must exist, and its title and year
      must match the row. A real id that points to the wrong paper fails.
      Checks every Learn more pick: known key, a Part, a link that opens at the topic
      (no doi.org, no arXiv PDF, no home page), at most 3 per stop.
      --links also opens every link: the #anchor must exist, and a PDF #page=N must show the Part.
      Exits 1 on problems.

DOIs are checked with Crossref, arXiv ids with the arXiv API.
"""
import difflib, gzip, html, json, re, sys, time, urllib.request, urllib.parse, xml.etree.ElementTree as ET
from concurrent.futures import ThreadPoolExecutor

UA = {'User-Agent': 'qce-ref-check/1.1'}

def get(url, tries=5):
    for i in range(tries):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=30) as r:
                body = r.read()
                return gzip.decompress(body) if body[:2] == b'\x1f\x8b' else body  # some sites gzip even unasked
        except urllib.error.HTTPError as e:
            if e.code != 429 or i == tries - 1: raise
            time.sleep(int(e.headers.get('Retry-After') or 2 ** i))  # rate limited: wait, then retry

def names(people):
    people = [p for p in people if p]
    return people[0] + ' et al.' if len(people) > 3 else ' and '.join([', '.join(people[:-1]), people[-1]] if len(people) > 1 else people)

def surname(full):
    # Keep particles: "Ronald de Wolf" -> "de Wolf"
    w = full.split(); i = len(w) - 1
    while i > 0 and w[i - 1].lower() in ('de', 'da', 'das', 'di', 'del', 'della', 'van', 'von', 'der', 'den', 'le', 'la', 'du', 'dos', 'ter'): i -= 1
    return ' '.join(w[i:])

def doi(d):
    m = json.loads(get('https://api.crossref.org/works/' + urllib.parse.quote(d)))['message']
    clean = lambda t: ' '.join(html.unescape(re.sub(r'<[^>]+>', '', t or '')).split())
    return {'year': str((m.get('issued', {}).get('date-parts') or [[None]])[0][0]),
            'authors': names([a.get('family') or a.get('name', '') for a in m.get('author') or m.get('editor') or []]),
            'title': clean((m.get('title') or [''])[0]),
            'venue': clean((m.get('container-title') or [m.get('publisher', '')])[0])}

def arxiv(ids):
    """Look up many arXiv ids at once. Returns {id: record}; missing ids are left out."""
    out, ns = {}, {'a': 'http://www.w3.org/2005/Atom'}
    for i in range(0, len(ids), 50):
        if i: time.sleep(3)  # the arXiv API asks for a pause between calls
        batch = ids[i:i + 50]
        x = ET.fromstring(get('https://export.arxiv.org/api/query?max_results=50&id_list=' + ','.join(map(urllib.parse.quote, batch))))
        for e in x.findall('a:entry', ns):
            title = ' '.join(e.findtext('a:title', '', ns).split())
            got = re.sub(r'v\d+$', '', e.findtext('a:id', '', ns).split('/abs/')[-1])
            if title and title != 'Error':
                out[got] = {'year': e.findtext('a:published', '', ns)[:4], 'title': title, 'venue': 'arXiv',
                            'authors': names([surname(a.text) for a in e.findall('a:author/a:name', ns)])}
    return out

bare = lambda a: re.sub(r'v\d+$', '', re.sub('(?i)^arxiv:', '', a))
# Compare titles loosely: case, punctuation, LaTeX, a leading "A" or "The" and spelling slips do not count.
norm = lambda t: re.sub(r'^(a|an|the) ', '', ' '.join(re.sub(r'[^a-z0-9]+', ' ', re.sub(r'\\[a-z]+', ' ', html.unescape(t).lower())).split()))

def same_title(a, b):
    a, b = norm(a), norm(b)
    return bool(a and b) and (a in b or b in a or difflib.SequenceMatcher(None, a, b).ratio() >= 0.9)

def table(md, name):
    """Rows of the table under '## <name>' as dicts keyed by lowercase header."""
    body = md.split('\n## ' + name, 1)[1].split('\n## ', 1)[0]
    rows = [r for r in body.splitlines() if r.startswith('|') and not r.startswith('|---')]
    cells = lambda r: [c.strip() for c in re.split(r'(?<!\\)\|', r.strip())[1:-1]]
    head = [c.lower() for c in cells(rows[0])]
    return [dict(zip(head, cells(r))) for r in rows[1:]]

def beginner_reading(md, path):
    # A Beginner stop needs at least one pick a beginner can read: level Intro or University.
    import os
    cur = open(os.path.join(os.path.dirname(path), 'curriculum.md')).read()
    beginner = set(re.findall(r'^\| ([a-z0-9-]+) \|(?:[^|\n]*\|){3} Beginner \|', cur, re.M))
    level = {r['key']: r['level'] for r in table(md, 'Sources')}
    by = {}
    for p in table(md, 'Learn more'): by.setdefault(p['stop'], []).append(level.get(p['key']))
    return [f'{s}: Beginner stop with no Intro or University reading' for s in sorted(beginner) if s in by and not set(by[s]) & {'Intro', 'University'}]

def check_picks(md, keys, open_links, path_of_md):
    problems, per = [], {}
    for p in table(md, 'Learn more'):
        s, link, where = p['stop'], p['link'], f"{p['stop']} > {p['key']}"
        per[s] = per.get(s, 0) + 1
        if p['key'] not in keys: problems.append(f'{where}: unknown source key')
        if p['part'] in ('', '-'): problems.append(f'{where}: no Part (say where to look)')
        if not link.startswith('https://'): problems.append(f'{where}: link must be https')
        if re.match(r'https://(dx\.)?doi\.org/|https://arxiv\.org/(pdf|html)/', link): problems.append(f'{where}: use the arXiv abstract page or the exact page, not {link}')
        if urllib.parse.urlparse(link).path in ('', '/') and '#' not in link: problems.append(f'{where}: a home page is not the topic')
    problems += [f'{s}: {n} picks, keep at most 3' for s, n in per.items() if n > 3]
    problems += beginner_reading(md, path_of_md)
    if open_links: problems += check_links(table(md, 'Learn more'))
    return problems

def check_links(picks):
    import subprocess, tempfile
    pages, problems = {}, []
    def fetch(url):
        try: return url, get(url)
        except Exception as e: return url, e
    with ThreadPoolExecutor(4) as pool:
        pages = dict(pool.map(fetch, sorted({p['link'].split('#')[0] for p in picks})))
    for p in picks:
        base, _, frag = p['link'].partition('#')
        body, where = pages[base], f"{p['stop']} > {p['key']}"
        if isinstance(body, Exception): problems.append(f'{where}: link does not open ({body})'); continue
        page = re.fullmatch(r'page=(\d+)', frag)
        if page and body[:4] == b'%PDF':
            with tempfile.NamedTemporaryFile(suffix='.pdf') as f:
                f.write(body); f.flush()
                text = subprocess.run(['pdftotext', '-f', page[1], '-l', page[1], f.name, '-'], capture_output=True, text=True).stdout
            words = norm(p['part'].split(',', 1)[-1]).split()
            if words and sum(w in norm(text) for w in words) < 0.6 * len(words): problems.append(f'{where}: page {page[1]} does not show "{p["part"]}"')
        elif frag and not page and not re.search(rb'(id|name)="' + re.escape(urllib.parse.unquote(frag)).encode() + rb'"', body):
            problems.append(f'{where}: no #{frag} on the page')
    return problems

def check_file(path, open_links=False):
    md = open(path).read()
    rows = table(md, 'Sources')
    dois = [r['doi'] for r in rows if r['doi'] != '-']
    def safe(d):
        try: return d, doi(d)
        except Exception as e: return d, e
    with ThreadPoolExecutor(4) as pool:
        found = dict(pool.map(safe, dois))
    ax = arxiv([bare(r['arxiv']) for r in rows if r['arxiv'] != '-'])
    problems = []
    for r in rows:
        k, title = r['key'], r['title'].replace('\\|', '|')
        # A preprint can have another title than the journal version; the Note then says so: arXiv title: "..."
        ax_title = re.search(r'arXiv title: "([^"]+)"', r.get('note', ''))
        for kind, rec in [('DOI', found.get(r['doi'])), ('arXiv', ax.get(bare(r['arxiv']), LookupError('no such arXiv id')) if r['arxiv'] != '-' else None)]:
            if rec is None: continue
            if isinstance(rec, Exception): problems.append(f'{k}: {kind} not found ({rec})'); continue
            want = ax_title[1] if kind == 'arXiv' and ax_title else title
            if rec['title'] and not same_title(rec['title'], want): problems.append(f'{k}: {kind} title is "{rec["title"]}"')
            if kind == 'DOI' and rec['year'] not in ('None', r['year']): problems.append(f'{k}: DOI year is {rec["year"]}, row says {r["year"]}')
        if '\ufffd' in ''.join(r.values()): problems.append(f'{k}: broken character (\ufffd), fix the text by hand')
        if r['doi'] == '-' and r['arxiv'] == '-' and r.get('url', '-') == '-': problems.append(f'{k}: no DOI, arXiv id or URL')
    problems += check_picks(md, {r['key'] for r in rows}, open_links, path)
    print(*problems, f'{len(rows)} sources, {len(problems)} problems', sep='\n')
    return not problems

if len(sys.argv) > 1 and sys.argv[1].endswith('.md'):
    sys.exit(0 if check_file(sys.argv[1], '--links' in sys.argv) else 1)

for ref in sys.argv[1:]:
    try:
        is_arxiv = ref.lower().startswith('arxiv:') or re.fullmatch(r'\d{4}\.\d{4,5}(v\d+)?|[a-z-]+/\d{7}', ref)
        rec = arxiv([bare(ref)]).get(bare(ref)) if is_arxiv else doi(ref)
        if not rec: raise LookupError('no such arXiv id')
        print(f'OK      {ref} | {rec["year"]} | {rec["authors"]} | {rec["title"]} | {rec["venue"]}')
    except Exception as e:
        print(f'MISSING {ref} | {type(e).__name__}: {e}')
