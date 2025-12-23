import { marked } from 'marked';
import renderMathInElement from 'katex/contrib/auto-render';
import 'katex/dist/katex.min.css';

// Import markdown files as raw strings via Vite
import readmeRaw from '../../doc/README.md?raw';
import developerRaw from '../../doc/DEVELOPER.md?raw';
import theoryRaw from '../../doc/THEORY.md?raw';

export class DocumentationViewer {
    constructor() {
        this.modal = document.getElementById('doc-modal');
        this.closeBtn = document.getElementById('btn-close-doc');
        this.openBtn = document.getElementById('btn-help');
        this.viewer = document.getElementById('doc-viewer');

        this.navItems = document.querySelectorAll('.doc-sidebar li');

        this.docs = {
            readme: readmeRaw,
            developer: developerRaw,
            theory: theoryRaw
        };

        this.currentDoc = 'readme';

        this.init();
    }

    init() {
        // Open/Close logic
        this.openBtn.addEventListener('click', () => this.open());
        this.closeBtn.addEventListener('click', () => this.close());

        // Close on background click
        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) this.close();
        });

        // Navigation
        this.navItems.forEach(item => {
            item.addEventListener('click', () => {
                const docKey = item.dataset.doc;
                this.switchDoc(docKey);
            });
        });

        // Initial render
        this.render();
    }

    open() {
        this.modal.classList.remove('hidden');
    }

    close() {
        this.modal.classList.add('hidden');
    }

    switchDoc(key) {
        if (!this.docs[key]) return;

        this.currentDoc = key;

        // Update active state in sidebar
        this.navItems.forEach(item => {
            if (item.dataset.doc === key) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });

        this.render();
    }

    render() {
        const rawMarkdown = this.docs[this.currentDoc];

        // Render Markdown to HTML
        this.viewer.innerHTML = marked.parse(rawMarkdown);

        // Render Math (LaTeX) inside the viewer element
        // We configure delimiters to match standard LaTeX usage often found in markdown ($...$ and $$...$$)
        renderMathInElement(this.viewer, {
            delimiters: [
                { left: '$$', right: '$$', display: true },
                { left: '$', right: '$', display: false },
                { left: '\\(', right: '\\)', display: false },
                { left: '\\[', right: '\\]', display: true }
            ],
            throwOnError: false
        });
    }
}
