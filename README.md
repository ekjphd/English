# English at UCF

An animated introduction to the Bachelor of Arts in English and the minors offered by the Department of English at the University of Central Florida, published at [ekjphd.com/English](https://ekjphd.com/English/).

A yellow book opens to a statement about the department while a quill writes "Your story awaits..." The page then becomes a library bookcase. The three tracks (Creative Writing, Literature, Technical Communication) and seven minors sit on the shelf labeled "Choose your own adventure"; selecting a book opens a panel with the program's requirements, courses, and a link to the official catalog page.

## Files

- `index.html`: the page and the program panels
- `assets/sketch.js`: the opening animation (p5.js), the decorative shelves, and the panels
- `assets/style.css`: the bookcase, books, and panels
- `assets/courses.json`: course descriptions from the department's course listings
- `tools/fetch_courses.py`: refreshes `assets/courses.json`

## Updating course descriptions

Course descriptions come from the [Department of English course listings](https://cah.ucf.edu/english/courses/), which cover a range of semesters (currently Summer 2026 to Spring 2027). Refresh them each semester:

```
python tools/fetch_courses.py
```

Then commit the updated `assets/courses.json`.

## Publishing

The site is static HTML, CSS, and JavaScript with no build step. GitHub Pages serves it from `main`, `/ (root)`.
