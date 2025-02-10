import { Expression } from "./editor.js"

// @ts-ignore
import translations from "../l10n/translations.json"

if (typeof HTMLElement === 'undefined') {
    // @ts-ignore
    global.HTMLElement = class HTMLElement {}
}

/**
 * Encode a string to be used in HTML
 */
function htmlEncode(t: any): string {
    return (typeof t !== "undefined" && t !== null) ? t.toString()
        .replace(/&/g, "&amp;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&apos;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        : '';
}

/**
 * Completely escape a json string
 */
function jsString(s: string): string {
    // Slice off the surrounding quotes
    s = JSON.stringify(s).slice(1, -1);
    return htmlEncode(s);
}

function isBareProp(prop: string): boolean {
    return /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(prop);
}

/**
 * Surround value with a span, including the given className
 */
function decorateWithSpan(value: any, className: string) {
    return `<span class="${className}">${htmlEncode(value)}</span>`;
}

function copyToClipboard(text) {
    // @ts-ignore
    if (window.clipboardData && window.clipboardData.setData) {
        // IE specific code path to prevent textarea being shown while dialog is visible.
        // @ts-ignore
        return clipboardData.setData("Text", text);

    } else if (document.queryCommandSupported && document.queryCommandSupported("copy")) {
        var textarea = document.createElement("textarea");
        textarea.textContent = text;
        textarea.style.position = "fixed";  // Prevent scrolling to bottom of page in MS Edge.
        document.body.appendChild(textarea);
        textarea.select();
        try {
            return document.execCommand("copy");  // Security exception may be thrown by some browsers.
        } catch (ex) {
            console.warn("Copy to clipboard failed.", ex);
            return false;
        } finally {
            document.body.removeChild(textarea);
        }
    }
}

function clickHandler(event: MouseEvent) {
    const collapser = (event.target as HTMLElement).closest('.sv-collapser');
    if (collapser) {
        event.stopPropagation();
        collapser.classList.toggle('sv-collapsed');
    }

    const prop = (event.target as HTMLElement).closest('.sv-prop');
    if (prop && prop.hasAttribute('data-copy')) {
        event.stopPropagation();
        if (copyToClipboard(prop.getAttribute('data-copy')) !== false) {
            const alert = document.createElement('span');
            alert.classList.add('expression-scope-viewer-copied');
            alert.innerText = translations.scope_viewer.copied[this._lang].replace(
                '%path%', prop.getAttribute('data-copy')
            );
            document.body.append(alert);

            const rect1 = prop.getBoundingClientRect();
            const rect2 = alert.getBoundingClientRect();

            alert.style.top = `${Math.round(rect1.top - rect2.top - rect2.height)}px`;
            alert.style.left = `${Math.round(rect1.left - rect2.left)}px`;

            window.requestAnimationFrame(function () {
                alert.classList.add('sv-animated1');

                setTimeout(function () {
                    alert.classList.add('sv-animated2');

                    setTimeout(function () {
                        alert.remove();
                    }, 600)
                }, 600);
            });
        }
    }
}

export class ExpressionScopeViewerElement extends HTMLElement {
    _value = ''
    _lang = 'en'
    _copyable = false

    static define() {
        if (customElements.get("expression-scope-viewer") === undefined) {
            customElements.define("expression-scope-viewer", ExpressionScopeViewerElement);
        }
    }

    valueToHTML(value: any, path: string) {
        const valueType = typeof value;

        if (value === null) {
            return decorateWithSpan('null', 'sv-null');
        } else if (Array.isArray(value)) {
            return this.arrayToHTML(value, path);
        } else if (value instanceof Date) {
            return decorateWithSpan(Expression.prettyPrint(value), 'sv-date');
        } else if (valueType === 'object') {
            return this.objectToHTML(value, path);
        } else if (valueType === 'number') {
            return decorateWithSpan(value, 'sv-num');
        } else if (valueType === 'string' &&
            value.charCodeAt(0) === 8203 &&
            !isNaN(value.slice(1))) {
            return decorateWithSpan(value.slice(1), 'sv-num');
        } else if (valueType === 'string') {
            return `<span class="sv-string">&quot;${jsString(value)}&quot;</span>`;
        } else if (valueType === 'boolean') {
            return decorateWithSpan(value, 'sv-bool');
        }

        return '';
    }

    arrayToHTML(json: any, path: string) {
        if (json.length === 0) {
            return '[ ]';
        }

        let output = '';
        for (let i = 0; i < json.length; i++) {
            const subPath = `${path}[${i}]`;
            const title = htmlEncode(translations.scope_viewer.copy_path[this._lang].replace('%path%', subPath));
            const copy_attr = this._copyable ? `title="${title}" data-copy="${htmlEncode(subPath)}"` : '';
            output += `<li><span class="sv-index sv-prop" data-text="${i}" ${copy_attr}></span>`;
            output += `<span class="sv-index" data-text=": "></span>`;
            output += `${this.valueToHTML(json[i], subPath)}`;
            if (i < json.length - 1) {
                output += ',';
            }
            output += '</li>';
        }

        const counter = `<span class="sv-collapsed-counter" data-text="…${json.length}"></span>`;

        return `<span class="sv-collapser"></span>[<ul class="sv-array sv-collapsible">${output}</ul>${counter}]`;
    }

    objectToHTML(json: any, path: string) {
        let numProps = Object.keys(json).length;
        if (numProps === 0) {
            return '{ }';
        }

        const counter = `<span class="sv-collapsed-counter" data-text="…${numProps}"></span>`;

        let output = '';
        for (const prop in json) {
            let subPath = '';
            let escapedProp = JSON.stringify(prop).slice(1, -1);
            const bare = isBareProp(prop);

            // TODO defis

            if (bare) {
                subPath = path.length ? `${path}.${escapedProp}` : escapedProp;
            } else {
                // path.length не проверяем, потому что в корне не должно быть таких имен
                subPath = `${path}["${escapedProp}"]`;
            }

            const title = htmlEncode(translations.scope_viewer.copy_path[this._lang].replace('%path%', subPath));
            const copy_attr = this._copyable ? `title="${title}" data-copy="${htmlEncode(subPath)}"` : '';

            output += `<li><span class="sv-prop" ${copy_attr}>`;

            if (!bare) output += '&quot;';
            output += jsString(prop);
            if (!bare) output += '&quot;';

            output += `</span>: ${this.valueToHTML(json[prop], subPath)}`;
            if (numProps > 1) output += ',';
            output += '</li>';

            numProps--;
        }

        return `<span class="sv-collapser"></span>{<ul class="sv-obj sv-collapsible">${output}</ul>${counter}}`;
    }

    set value(value) {
        if (value !== this._value) {
            this._value = value;

            this._lang = this.getAttribute('lang') || 'en'
            this._copyable = this.getAttribute('copyable') !== null

            this.innerHTML = this.valueToHTML(value, '');
            console.log('scope-view redraw');
        }
    }

    get value() {
        return this._value;
    }

    constructor() {
        super()
    }

    connectedCallback() {
        this.addEventListener('click', clickHandler, false);
    }

    destroy() {
    }

    disconnectedCallback() {
        this.removeEventListener('click', clickHandler)
    }
}