import { marked } from 'marked';

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
        // Pre-process LaTeX-ish symbols for display if needed, but for now just raw markdown
        // Marked doesn't support MathJax/KaTeX out of the box without extensions.
        // For now, we rely on the raw text explanations in THEORY.md which are readable.
        // Ideally we would add katex here, but keeping it simple for "Vanilla + Marked".

        this.viewer.innerHTML = marked.parse(rawMarkdown);
    }
}
