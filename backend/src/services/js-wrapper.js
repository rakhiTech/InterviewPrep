// --- Auto-Execution Wrapper for JavaScript ---
// This file is appended to candidate code before execution.
// It auto-detects the candidate's function and runs it with stdin.

var __fs = require('fs');

function ListNode(val, next) {
    this.val = (val === undefined ? 0 : val);
    this.next = (next === undefined ? null : next);
}

function __arrayToList(arr) {
    if (!Array.isArray(arr) || !arr.length) return null;
    var head = new ListNode(arr[0]);
    var curr = head;
    for (var i = 1; i < arr.length; i++) {
        curr.next = new ListNode(arr[i]);
        curr = curr.next;
    }
    return head;
}

function __listToArray(node) {
    if (node === null) return [];
    var res = [];
    while (node && typeof node === 'object' && 'val' in node) {
        res.push(node.val);
        node = node.next;
    }
    return res;
}

try {
    var __stdin = __fs.readFileSync(0, 'utf-8').trim();
    if (__stdin) {
        var __parsedArgs = [];
        var __isLinkedList = false;

        var __content = __fs.readFileSync(__filename, 'utf8');

        // Strip comments so we don't accidentally pick up ListNode from JSDoc
        var __commentRe = new RegExp('\\/\\*[\\s\\S]*?\\*\\/|\\/\\/.*', 'g');
        var __codeOnly = __content.replace(__commentRe, '');

        // Find all function declarations, excluding our internal helpers
        var __internalNames = ['ListNode', '__arrayToList', '__listToArray', '__fs'];
        var __funcName = null;

        // Try to find 'function XXXX(' pattern
        var __allFuncRe = new RegExp('function\\s+([a-zA-Z0-9_]+)\\s*\\(', 'g');
        var __match;
        while ((__match = __allFuncRe.exec(__codeOnly)) !== null) {
            var __candidate = __match[1];
            if (__internalNames.indexOf(__candidate) === -1 && __candidate.indexOf('__') !== 0) {
                __funcName = __candidate;
                break;
            }
        }

        // Also try const/let/var assignments: const foo = function(
        if (!__funcName) {
            var __assignRe = new RegExp('(?:const|let|var)\\s+([a-zA-Z0-9_]+)\\s*=', 'g');
            while ((__match = __assignRe.exec(__codeOnly)) !== null) {
                var __candidate2 = __match[1];
                if (__internalNames.indexOf(__candidate2) === -1 && __candidate2.indexOf('__') !== 0) {
                    __funcName = __candidate2;
                    break;
                }
            }
        }

        if (__funcName) {
            // Detect linked list problems
            if (__funcName.toLowerCase().indexOf('list') >= 0 || __content.toLowerCase().indexOf('listnode') >= 0 || __content.toLowerCase().indexOf('linked') >= 0) {
                __isLinkedList = true;
            }

            // Parse stdin arguments
            if (__stdin.indexOf('=') >= 0 && __stdin.indexOf('[') > __stdin.indexOf('=')) {
                // Named variables format: "nums=[2,7], target=9"
                var __pairRe = new RegExp(',(?![^\\[]*\\])');
                var __pairs = __stdin.split(__pairRe);
                __pairs.forEach(function(p) {
                    var parts = p.split('=');
                    if (parts.length >= 2) {
                        try { __parsedArgs.push(JSON.parse(parts.slice(1).join('=').trim())); } catch(e) {}
                    }
                });
            } else {
                // Flat JSON format: "[1,2,3,4,5]"
                try {
                    var __val = JSON.parse(__stdin);
                    if (__isLinkedList && Array.isArray(__val)) {
                        __val = __arrayToList(__val);
                    }
                    __parsedArgs.push(__val);
                } catch(e) { __parsedArgs.push(__stdin); }
            }

            // Invoke the candidate's function
            var __fn = eval(__funcName);
            var __result = __fn.apply(null, __parsedArgs);

            // Output the result
            if (__isLinkedList && (__result === null || (typeof __result === 'object' && __result !== null && 'val' in __result))) {
                console.log(JSON.stringify(__listToArray(__result)));
            } else if (__result !== undefined) {
                console.log(JSON.stringify(__result));
            }
        }
    }
} catch(e) {
    console.error('Execution error:', e.message);
}
