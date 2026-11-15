"use strict";
// Run locally with: node site/smoke-test.cjs
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const root = path.resolve(__dirname, "..");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const game = fs.readFileSync(path.join(root, "site/game.js"), "utf8");
const pigs = fs.readFileSync(path.join(root, "site/pigs.js"), "utf8");
new Function(game); new Function(pigs);
for (const id of ["startTypeMode", "startMathMode", "typeMode", "mathMode", "answerSubmit", "answerInput", "questionText", "answerFeedback"]) {
  assert.ok(html.includes('id="' + id + '"'), 'Missing control: ' + id);
}
const textMatch = game.match(/const texts=(\[[\s\S]*?\]);/);
assert.ok(textMatch, "Typing challenge question list missing");
const texts = JSON.parse(textMatch[1]);
assert.ok(texts.length >= 10, "Need a variety of prompts");
assert.ok(texts.every(t => t.length <= 25), "Typing prompts must remain short (25 chars max)");
assert.match(game, /QUESTION_TIMES=\{typing:18,math:14\}/);
assert.match(game, /\["\+","−","×","÷"\]/, "Math must cover four operations");
assert.match(game, /function setMode\(next\)/, "Mode switching missing");
assert.match(game, /function submit\(\)/, "Submitting math responses missing");
assert.match(game, /answerSubmit"\)\.addEventListener\("click",submit\)/, "Submit button must be wired");
console.log("Pig Racing challenge smoke checks passed (" + texts.length + " short phrases; typing + math).");
