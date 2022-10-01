const test = require("ava").default;
const { render } = require("posthtml-render");
const { createComponentFrom } = require("../dist/index");

const url = "test/component/test.html";
/**
 * Single Slot Test
 * @param {string} str 
 * @returns 
 */
function sst(str) { return createComponentFrom(`<link rel="import" href="./Single.html"><template><Single>${str}</Single></template>`, url) }
/**
 * Multiple Slots Test
 * @param {string} str 
 * @returns 
 */
function mst(str) { return createComponentFrom(`<link rel="import" href="./Multiple.html"><template><Multiple>${str}</Multiple></template>`, url) }
/**
 * Template wrapper
 * @param {string} str 
 */
function tw(str) { return createComponentFrom(`<template>${str}</template>`, url); }

test("component: self closing", async i => {
    const c = await createComponentFrom(`<link rel="import" href="./Single.html"><template><Single /></template>`, url);
    const r = render(c({}));
    i.is(r,"default");
});

test("slot: mixed unnamed and named", async i => {
    await i.throwsAsync(tw("<slot name=\"body\"/><slot />"));
    await i.throwsAsync(tw("<slot /><slot name=\"body\"/>"));
});

test("slot: type", async i => {
    const c1 = await tw("<p>ciao</p>");
    i.assert(c1.slotType === "none");
    const c2 = await tw("<slot />");
    i.assert(c2.slotType === "single");
    const c3 = await tw('<slot name="first" /> <slot name="second" />');
    i.assert(c3.slotType === "multiple");
});

test("slot: self closing", async i => {
    const c = await tw("<slot name=\"body\"/>", url);
    const html = render(c({},{body: "ciao"})); 
    i.is(html, "ciao");
});

test("slot: default value", async i => {
    const c = await sst("");
    const r = render(c({}));
    i.is(r, "default");
});

test("slot: pass", async i => {
    const c = await sst("<p>paragraph</p>text");
    const r = render(c({}));
    i.is(r, "<p>paragraph</p>text");
});

test("fragment: all", async i => {
    const c = await mst('<fragment slot="first">1</fragment><fragment slot="second">2</fragment>');
    const r = render(c({}));
    i.is(r, "12");
});

test("fragment: self closing overwrites default", async i => {
    const c = await mst('<fragment slot="first" />');
    const r = render(c({}));
    i.is(r, "def2");
});

test("fragment: unnamed", async i => {
    await i.throwsAsync(mst("<fragment />"));
    await i.throwsAsync(mst("<fragment>content</fragment>"));
});

test("fragment: wrong name", async i => {
    const c = await mst('<fragment slot="rombo"></fragment>');
    const r = render(c({}));
    i.is(r, "def1def2");
});

test("fragment: empty", async i => {
    const c = await mst('<fragment slot="first"></fragment>');
    const r = render(c({}));
    i.is(r,"def2");
});

test("fragment: filled", async i => {
    const c = await mst('<fragment slot="first">text</fragment>');
    const r = render(c({}));
    i.is(r,"textdef2");
});

test("fragment: multiple with same name", async i => {
    const p = mst('<fragment slot="first">text1</fragment><fragment slot="first">text2</fragment>');
    await i.throwsAsync(p, { message: /^Slots cannot be defined more than once/ });
});

test("slot: skip fragment", async i => {
    const c = await mst('<p slot="first">nasello</p><div class="wrapper" slot="second"></div>');
    const r = render(c({}));
    i.is(r, '<p>nasello</p><div class="wrapper"></div>');
});
