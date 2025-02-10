import type  * as CodeMirror from "codemirror"

export function highlightParentheses(cm: CodeMirror.EditorFromTextArea) {
    function redrawParentheses(instance: CodeMirror.EditorFromTextArea) {
        const doc = instance.getDoc();

        for (const mark of doc.getAllMarks()) {
            if (mark.className.indexOf('parentheses') === 0) {
                mark.clear();
            }
        }

        let opens = [];
        const blocks = [];

        // @ts-ignore: похоже, в типах это свойство отсутствует
        const countOfLines = doc.size;
        for (let line = 0; line < countOfLines; line++) {
            let lineTokens = instance.getLineTokens(line);

            for (const nextToken of lineTokens) {
                if (nextToken.type?.indexOf('parentheses-open') === 0) {
                    opens.push({
                        type: nextToken.type.match(/parentheses-type-([abc])/)[1],
                        start: { line: line, ch: nextToken.start },
                        end: { line: line, ch: nextToken.start + 1 },
                    });
                } else if (nextToken.type?.indexOf('parentheses-close') === 0) {
                    const close = {
                        type: nextToken.type.match(/parentheses-type-([abc])/)[1],
                        start: { line: line, ch: nextToken.start },
                        end: { line: line, ch: nextToken.start + 1 },
                    };

                    let open, brokens = [];
                    for (const openCandidate of opens.slice().reverse()) {
                        if (openCandidate.type === close.type) {
                            open = openCandidate;
                            opens = opens.slice(0, opens.indexOf(openCandidate));
                            break;
                        } else {
                            brokens.push(openCandidate);
                        }
                    }

                    if (open) {
                        for (const broken of brokens) {
                            doc.markText(broken.start, broken.end, {
                                className: 'parentheses-error',
                            });
                        }

                        doc.markText(open.start, open.end, {
                            className: `parentheses-${opens.length + 1}`,
                        });

                        doc.markText(close.start, close.end, {
                            className: `parentheses-${opens.length + 1}`,
                        });

                        if (instance.getSelection().length === 0) {
                            const cursor = instance.getCursor();

                            const cursorAfterOpen1 = cursor.line > open.start.line;
                            const cursorAfterOpen2 = cursor.line === open.start.line && cursor.ch >= open.start.ch;
                            if (cursorAfterOpen1 || cursorAfterOpen2) {
                                const cursorBeforeClose1 = cursor.line < close.start.line;
                                const cursorBeforeClose2 = cursor.line === close.start.line && cursor.ch <= close.start.ch + 1;
                                if (cursorBeforeClose1 || cursorBeforeClose2) {
                                    blocks.push({ open, close });
                                }
                            }
                        }
                    } else {
                        doc.markText(close.start, close.end, {
                            className: 'parentheses-error',
                        });
                    }
                }
            }
        }

        for (const open of opens) {
            doc.markText(open.start, open.end, {
                className: 'parentheses-error',
            });
        }

        if (blocks.length) {
            doc.markText(blocks[0].open.start, blocks[0].open.end, {
                className: 'parentheses-match',
            });

            doc.markText(blocks[0].close.start, blocks[0].close.end, {
                className: 'parentheses-match',
            });

            doc.markText(blocks[0].open.start, blocks[0].close.end, {
                className: 'parentheses-block',
            });
        }
    }

    cm.on('cursorActivity', redrawParentheses);
    redrawParentheses(cm);
}