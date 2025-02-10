import type * as CodeMirrorProto from "codemirror"

import { Expression } from "../typescript/formulas/Expression.js"
import { parseExpression } from "./parser.js"

import { defineMode } from "./mode.js";
import { highlightParentheses } from "./parentheses.js"
import { ExpressionAnalyzer } from "./analyzer.js"

import { ExpressionScopeViewerElement } from "./scope-viewer.js"

// @ts-ignore
import translations from "../l10n/translations.json"

const errorVector = `<svg width="13px" height="5px" viewBox="0 0 13 5" xmlns="http://www.w3.org/2000/svg">
    <g stroke="#FF0000" stroke-width="0.5" fill="none" fill-rule="evenodd">
        <polygon fill="#FF0000" transform="translate(6.5, 3.5) rotate(-315) translate(-6.5, -3.5) " points="2 8 2 3 6 3 6 -1 11 -1 11 0 7 0 7 4 3 4 3 8"></polygon>
    </g>
</svg>`;

type ExpressionEditorOptions = {
    theme: 'redactor' | 'cabinet' | string,
    width: '100%' | string
    height: 'auto' | string
    value: string
}

let CodeMirror: typeof CodeMirrorProto = null;

function initialize(root: ExpressionEditorElement, options: ExpressionEditorOptions) {
    defineMode(CodeMirror);

    root.classList.add('theme-' + options.theme);

    const container = document.createElement('div');
    container.classList.add('expression-editor_container');
    root.append(container);

    // Этот container нужен только для того, чтобы глушить эти странные события,
    // которые идут от textarea, и ловятся только на внешних елементах
    container.addEventListener('change', event => {
        event.stopPropagation();
    });

    const leftLabel = document.createElement('div');
    container.append(leftLabel);
    leftLabel.classList.add('expression-editor_left-label');

    const leftMenu = document.createElement('div');
    leftLabel.append(leftMenu);
    leftMenu.classList.add('expression-editor_left-menu');

    const fxIcon = document.createElement('div');
    leftMenu.append(fxIcon);
    fxIcon.classList.add('expression-editor_fx-icon');
    root._fxIcon = fxIcon;

    const linkContainer = document.createElement('div');
    leftMenu.append(linkContainer);
    linkContainer.classList.add('expression-editor_link-container');
    root._leftMenu = leftMenu;

    const linkElement = document.createElement('a');
    linkContainer.append(linkElement);
    linkElement.classList.add('expression-editor_link-element');
    linkElement.setAttribute('target', '_blank');
    linkElement.innerText = translations.editor.goto_playground[root._lang];

    // TODO сделать так, чтобы в формулу уходило ТОЛЬКО ТО, ЧТО ИСПОЛЬЗУЕТСЯ, А НЕ ВСЕ

    fxIcon.addEventListener('click', event => {
        if (leftMenu.classList.contains('expandable')) {
            if (leftMenu.classList.contains('expanded')) {
                leftMenu.classList.remove('expanded');
            } else {
                leftMenu.classList.add('expanded');

                const link = [
                    translations.editor.playground_href[root._lang],
                    '?formula=' + encodeURIComponent(root._currentValue),
                    '&scope=' + encodeURIComponent(Expression.prettyPrint(root._currentScope, '')),
                ].join('');

                linkElement.setAttribute('href', link);
            }
        }
    });

    leftMenu.addEventListener('mouseleave', event => {
        if (leftMenu.classList.contains('expandable') && leftMenu.classList.contains('expanded')) {
            leftMenu.classList.remove('expanded');
        }
    });

    const textarea = document.createElement('textarea');
    textarea.textContent = options.value;
    container.append(textarea);

    const cm = CodeMirror.fromTextArea(textarea, {
        lineNumbers: false,
        indentWithTabs: false,
        indentUnit: 2,
        tabSize: 2,
        mode: "formula",
        theme: "formula",
        smartIndent: true,
        electricChars: true,
        scrollbarStyle: "overlay",
        extraKeys: {
            // https://github.com/codemirror/codemirror5/issues/988#issuecomment-549644684
            Tab: cm => {
                if (cm.somethingSelected()) {
                    cm.execCommand('indentMore');
                } else {
                    cm.execCommand('insertSoftTab');
                }
            },
            'Shift-Tab': cm => cm.execCommand('indentLess')
        }
    });

    cm.setOption('viewportMargin', Infinity);

    cm.setSize(options.width || '100%', options.height || 'auto');

    highlightParentheses(cm);

    const errorDecor = document.createElement('div');
    errorDecor.classList.add('error-mark');
    errorDecor.innerHTML = errorVector;

    function clearErrors(instance) {
        errorDecor.remove();
        root.classList.remove('has-error');
    }

    function checkErrors(instance) {
        const doc = instance.getDoc();

        const parsed = parseExpression(doc.getValue());
        if (parsed.error === null) return;

        const ruError = Expression.ErrorTranslator.toRussian('parse :: ' + parsed.error.message);

        let charSkipped = 0;

        // @ts-ignore: похоже, в типах это свойство отсутствует
        const countOfLines = doc.size;
        for (let line = 0; line < countOfLines; line++) {
            const lineChars = instance.getLine(line).length;

            if (charSkipped + lineChars < parsed.error.character) {
                charSkipped += lineChars + 1;
            } else {
                showError({
                    line,
                    ch: parsed.error.character - charSkipped
                }, ruError);

                return;
            }
        }

        showError({ line: 0, ch: 0 }, ruError);
    }

    function showError(pos, message) {
        root.classList.add('has-error');
        errorDecor.setAttribute('title', message);
        cm.addWidget(pos, errorDecor, false);
    }

    let checkTimeout;
    cm.on('change', instance => {
        clearErrors(instance);
        clearTimeout(checkTimeout);
        checkTimeout = setTimeout(() => checkErrors(instance), 2000);
    });

    checkErrors(cm);

    return cm;
}

if (typeof HTMLElement === 'undefined') {
    // @ts-ignore
    global.HTMLElement = class HTMLElement {}
}

class ExpressionEditorElement extends HTMLElement {
    cm: CodeMirror.EditorFromTextArea = null

    _currentValue = ''
    _delayedValue = ''

    _currentScope = null
    _delayedScope = null
    _fxIcon: HTMLDivElement
    _leftMenu: HTMLDivElement

    _lang = 'en'

    static define(CM: typeof CodeMirrorProto) {
        if (CodeMirror === null) {
            CodeMirror = CM;

            if (customElements.get("expression-editor") === undefined) {
                customElements.define("expression-editor", ExpressionEditorElement);
            }
        } else {
            if (CodeMirror !== CM) {
                throw new Error('ScenarioEditor element is already defined with another CodeMirror');
            }
        }
    }

    constructor() {
        super()

        this.addEventListener('change', event => {
            // CodeMirror генерирует странные событие, исходящие от textarea,
            // которые мешают, и мы только в это месте можем их убить
            if (event.target !== this) event.stopPropagation();
        });
    }

    set value(value) {
        if (!this.cm) {
            // Данные пришли, когда компонент еще не подключен к DOM
            this._delayedValue = value;
            return;
        }

        if (this._currentValue !== value) {
            const doc = this.cm.getDoc();

            // @ts-ignore этих свойств нет среди типов doc
            const scrollLeft = doc.scrollLeft, scrollTop = doc.scrollTop;

            doc.setValue(value);
            this.cm.scrollTo(scrollLeft, scrollTop);
        }
    }

    get value() {
        return this._currentValue;
    }

    connectedCallback() {
        if (this.cm) return; // Уже подключено

        const initialValue = this._delayedValue || this.getAttribute('value') || '';

        this._lang = this.getAttribute('lang') || 'en';

        this.cm = initialize(this, {
            theme: this.getAttribute('theme') || 'redactor',
            width: this.getAttribute('width') || '100%',
            height: this.getAttribute('height') || 'auto',
            value: initialValue,
        });

        this._currentValue = this.cm.getDoc().getValue();

        if (this._delayedScope) this.evaluate(this._delayedScope);

        this.cm.on('change', event => {
            this._currentValue = this.cm.getDoc().getValue();
            this.dispatchEvent(new CustomEvent('change'));
        });

        this.cm.on('focus', event => {
            this.dispatchEvent(new CustomEvent('focus'));
        });

        this.cm.on('blur', event => {
            this.dispatchEvent(new CustomEvent('blur'));
        });

        // @ts-ignore
        if (this.cm.display.wrapper.offsetWidth === 0) {
            (function waitForVisible() {
                if (this.cm.display.wrapper.offsetWidth) this.cm.refresh();
                else setTimeout(waitForVisible.bind(this), 100);
            }.bind(this))();
        }
    }

    evaluate(scope) {
        if (!this.cm) {
            this._delayedScope = scope;
            return;
        }

        this._currentScope = scope;

        this._fxIcon.removeAttribute('title');
        this._leftMenu.classList.remove('expandable');

        const parsed = parseExpression(this._currentValue);
        if (parsed.error) return;

        const expr = new Expression(parsed, Expression.LIMIT_MODE_10K);

        const output = expr.evaluate(scope);
        if (output.error) return;

        this._fxIcon.setAttribute('title', Expression.prettyPrint(output.result));
        this._leftMenu.classList.add('expandable');
    }

    enableAnalyzer(result, callback) {
        ExpressionAnalyzer.enableAnalyzer(this.cm, result, callback);
    }

    disableAnalyzer() {
        ExpressionAnalyzer.disableAnalyzer(this.cm);
    }

    destroy() {
        this.cm.toTextArea();
        this.innerHTML = '';
    }

    disconnectedCallback() {}
}

export { ExpressionEditorElement, Expression, parseExpression, ExpressionScopeViewerElement, ExpressionAnalyzer }