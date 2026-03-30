// Language ID mapping for Judge0
export const LANGUAGE_MAP: Record<string, { id: number; name: string; monacoId: string }> = {
  javascript: { id: 63, name: 'JavaScript', monacoId: 'javascript' },
  typescript: { id: 74, name: 'TypeScript', monacoId: 'typescript' },
  python: { id: 71, name: 'Python 3', monacoId: 'python' },
  java: { id: 62, name: 'Java', monacoId: 'java' },
  cpp: { id: 54, name: 'C++', monacoId: 'cpp' },
  c: { id: 50, name: 'C', monacoId: 'c' },
  csharp: { id: 51, name: 'C#', monacoId: 'csharp' },
  go: { id: 60, name: 'Go', monacoId: 'go' },
  rust: { id: 73, name: 'Rust', monacoId: 'rust' },
  ruby: { id: 72, name: 'Ruby', monacoId: 'ruby' },
  php: { id: 68, name: 'PHP', monacoId: 'php' },
  swift: { id: 83, name: 'Swift', monacoId: 'swift' },
  kotlin: { id: 78, name: 'Kotlin', monacoId: 'kotlin' },
};

export const TOPICS = [
  'DSA',
  'System Design',
  'Frontend',
  'Backend',
  'Database',
  'DevOps',
  'Machine Learning',
  'Security',
  'Networking',
  'Operating Systems',
];

export const DIFFICULTIES = [
  { value: 'easy', label: 'Easy', color: '#22c55e' },
  { value: 'medium', label: 'Medium', color: '#f59e0b' },
  { value: 'hard', label: 'Hard', color: '#ef4444' },
  { value: 'mixed', label: 'Mixed', color: '#8b5cf6' },
];

export const BOILERPLATES: Record<string, string> = {
  javascript: `/**\n * Definition for singly-linked list.\n * function ListNode(val, next) {\n *     this.val = (val===undefined ? 0 : val)\n *     this.next = (next===undefined ? null : next)\n * }\n */\n/**\n * @param {ListNode} head\n * @return {ListNode}\n */\nfunction solution(head) {\n  // Write your code here\n  return head;\n}`,
  typescript: `/**\n * Definition for singly-linked list.\n * class ListNode {\n *     val: number\n *     next: ListNode | null\n *     constructor(val?: number, next?: ListNode | null) {\n *         this.val = (val===undefined ? 0 : val)\n *         this.next = (next===undefined ? null : next)\n *     }\n * }\n */\nfunction solution(head: ListNode | null): ListNode | null {\n  // Write your code here\n  return head;\n}`,
  python: `# Definition for singly-linked list.\n# class ListNode:\n#     def __init__(self, val=0, next=None):\n#         self.val = val\n#         self.next = next\n\ndef solution(head):\n    # Write your code here\n    return head`,
  java: `/**\n * Definition for singly-linked list.\n * public class ListNode {\n *     int val;\n *     ListNode next;\n *     ListNode() {}\n *     ListNode(int val) { this.val = val; }\n *     ListNode(int val, ListNode next) { this.val = val; this.next = next; }\n * }\n */\npublic class Solution {\n    public static void main(String[] args) {\n        // Write your code here\n    }\n\n    public Object solve(Object input) {\n        return input;\n    }\n}`,
  cpp: `/**\n * Definition for singly-linked list.\n * struct ListNode {\n *     int val;\n *     ListNode *next;\n *     ListNode() : val(0), next(nullptr) {}\n *     ListNode(int x) : val(x), next(nullptr) {}\n *     ListNode(int x, ListNode *next) : val(x), next(next) {}\n * };\n */\n#include <iostream>\n#include <vector>\n#include <string>\n\nusing namespace std;\n\nclass Solution {\npublic:\n    void solve() {\n        // Write your code here\n    }\n};\n\nint main() {\n    Solution sol;\n    sol.solve();\n    return 0;\n}`,
  c: `#include <stdio.h>\n\nint main() {\n    // Write your code here\n    return 0;\n}`,
  csharp: `using System;\n\npublic class Solution {\n    public static void Main(string[] args) {\n        // Write your code here\n    }\n}`,
  go: `package main\n\nimport "fmt"\n\nfunc main() {\n    // Write your code here\n}`,
  rust: `fn main() {\n    // Write your code here\n}`,
  ruby: `def solution(input)\n  # Write your code here\nend`,
  php: `<?php\n\nfunction solution($input) {\n    // Write your code here\n}`,
  swift: `import Foundation\n\nfunc solution() {\n    // Write your code here\n}`,
  kotlin: `fun main(args: Array<String>) {\n    // Write your code here\n}`,
};
