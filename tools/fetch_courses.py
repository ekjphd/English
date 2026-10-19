"""Download course descriptions from the Department of English course listings.

The listings at https://cah.ucf.edu/english/courses/ load their table from the
site's WordPress AJAX endpoint. This script makes the same request the page
makes, cleans the descriptions to plain paragraphs, and writes
assets/courses.json, which assets/sketch.js reads to fill in the program panels.

Run it again each semester to refresh the descriptions:

    python tools/fetch_courses.py
"""

import html
import json
import re
import urllib.parse
import urllib.request
from pathlib import Path

PAGE = 'https://cah.ucf.edu/english/courses/'
OUT = Path(__file__).resolve().parent.parent / 'assets' / 'courses.json'
HEADERS = {'User-Agent': 'Mozilla/5.0 (UCF English course list refresh)'}
SEASONS = {'Spring': 0, 'Summer': 1, 'Fall': 2}
MODES = {
    'Asynchronous Online (W)': 'Online',
    'Synchronous Online (S)': 'Online, live sessions',
    'In Person (P)': 'In person',
    'Mixed Mode (M)': 'Mixed mode',
}


def get(url, data=None):
    req = urllib.request.Request(url, data=data, headers=HEADERS)
    with urllib.request.urlopen(req, timeout=30) as resp:
        return resp.read().decode('utf-8')


def page_settings():
    page = get(PAGE)
    ajax = re.search(r'var wpVars = (\{.*?\});', page)
    config = re.search(r'value="(\{&quot;dept&quot;.*?\})"', page)
    if not ajax or not config:
        raise SystemExit('Could not find the course table settings on the courses page.')
    return json.loads(ajax.group(1)), json.loads(html.unescape(config.group(1)))


def paragraphs(raw):
    text = re.sub(r'<\s*(br|/p|/div|/li|/h\d)\b[^>]*>', '\n', raw or '', flags=re.I)
    text = html.unescape(re.sub(r'<[^>]+>', '', text)).replace('\xa0', ' ')
    lines = [re.sub(r'\s+', ' ', p).strip() for p in text.split('\n') if p.strip()]
    # Many descriptions are hard-wrapped mid-sentence. Rejoin a line with the next unless the line
    # ends a sentence or the next line starts a list item.
    out = []
    for line in lines:
        tag_then_sentence = out and not re.search('[a-z]', out[-1]) and re.match(r'\S*[a-z]', line)
        if out and not END_OF_SENTENCE.search(out[-1]) and not LIST_ITEM.match(line) and not tag_then_sentence:
            out[-1] += ' ' + line
        elif out and line[0].islower():
            out[-1] += ' ' + line
        else:
            out.append(line)
    # The site does not show when a course is offered, so drop the semester from labels
    # such as "SUMMER 2026 TOPIC:" and keep the label itself.
    return [TERM_LABEL.sub(lambda m: m.group(1).capitalize() + ':', p) for p in out]


TERM_LABEL = re.compile(r'^(?:spring|summer|fall)\s+\d{4}\s+(topics?|author)\s*:', re.I)


END_OF_SENTENCE = re.compile(r'[.!?:;)\]"”’]$')
LIST_ITEM = re.compile(r'^(\d+[.)]|[-•*–])\s')


def term_key(term):
    season, year = term.split()
    return int(year), SEASONS.get(season, 9)


def main():
    wp, cfg = page_settings()
    form = urllib.parse.urlencode({
        'action': 'cah-courses',
        'dept': cfg['dept'],
        'multiDept': str(cfg.get('multiDept', False)).lower(),
        'start': cfg['start'],
        'end': cfg['end'],
        'get': 'course-list',
        '_wpnonce': wp['ajaxNonce'],
    }).encode()
    sections = json.loads(get(wp['ajaxurl'], form)).values()

    courses = {}
    for sec in sections:
        code = sec['course']
        course = courses.setdefault(code, {'title': sec['title'], 'terms': set(), 'groups': {}})
        course['terms'].add(sec['term'])
        paras = paragraphs(sec['description'])
        if not paras:
            continue
        # Sections that share a description are listed once, with every term and format they run in.
        group = course['groups'].setdefault('\n'.join(paras), {'terms': set(), 'modes': set(), 'paragraphs': paras})
        group['terms'].add(sec['term'])
        group['modes'].add(MODES.get(sec['mode'], sec['mode']))

    out = {}
    for code, c in sorted(courses.items()):
        groups = sorted(c['groups'].values(), key=lambda g: min(term_key(t) for t in g['terms']))
        out[code] = {
            'title': c['title'],
            'descriptions': [g['paragraphs'] for g in groups],
        }

    data = {'source': PAGE, 'courses': out}
    OUT.write_text(json.dumps(data, ensure_ascii=False, indent=1) + '\n', encoding='utf-8')
    described = sum(1 for c in out.values() if c['descriptions'])
    print(f'Wrote {len(out)} courses ({described} with descriptions) to {OUT}')


if __name__ == '__main__':
    main()
