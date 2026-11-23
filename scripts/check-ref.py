#!/usr/bin/env python3
"""Look up references so citations are never written from memory.

Usage: python3 scripts/check-ref.py 10.1103/RevModPhys.87.307 arXiv:quant-ph/9508027 ...
Prints one line per reference: OK or MISSING, then year, first author, title and venue.
DOIs are checked with Crossref, arXiv ids with the arXiv API.
"""
import json, re, sys, urllib.request, urllib.parse, xml.etree.ElementTree as ET

UA = {'User-Agent': 'qce-ref-check/1.0'}

def get(url):
    with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=30) as r:
        return r.read()

def doi(d):
    m = json.loads(get('https://api.crossref.org/works/' + urllib.parse.quote(d)))['message']
    year = (m.get('issued', {}).get('date-parts') or [[None]])[0][0]
    first = (m.get('author') or [{}])[0]
    return year, first.get('family', ''), (m.get('title') or [''])[0], (m.get('container-title') or m.get('publisher') and [m['publisher']] or [''])[0]

def arxiv(a):
    x = ET.fromstring(get('https://export.arxiv.org/api/query?id_list=' + urllib.parse.quote(a)))
    ns = {'a': 'http://www.w3.org/2005/Atom'}
    e = x.find('a:entry', ns)
    title = e.findtext('a:title', '', ns).strip() if e is not None else ''
    if not title or title == 'Error':
        raise LookupError('no such arXiv id')
    return e.findtext('a:published', '', ns)[:4], e.find('a:author/a:name', ns).text.split()[-1], ' '.join(title.split()), 'arXiv'

for ref in sys.argv[1:]:
    try:
        is_arxiv = ref.lower().startswith('arxiv:') or re.fullmatch(r'\d{4}\.\d{4,5}(v\d+)?|[a-z-]+/\d{7}', ref)
        year, author, title, venue = arxiv(re.sub('(?i)^arxiv:', '', ref)) if is_arxiv else doi(ref)
        print(f'OK      {ref} | {year} | {author} | {title} | {venue}')
    except Exception as e:
        print(f'MISSING {ref} | {type(e).__name__}: {e}')
