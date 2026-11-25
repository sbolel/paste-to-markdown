// Manual browser acceptance harness. It never reads the system clipboard.
const fixtures = document.getElementById("fixtures");
const selection = document.getElementById("selection");
const app = document.getElementById("app");
const evidence = document.getElementById("evidence");
const cases = {
  beta: () => [document.querySelector("#inline strong").firstChild, 6, 10],
  "partial item": () => [
    document.querySelector("#list li:last-child").firstChild,
    2,
    11,
  ],
  "cell B": () => [
    document.querySelector("#table td:last-child").firstChild,
    0,
    6,
  ],
  "across cells": () => [
    document.querySelector("#table td").firstChild,
    5,
    6,
    document.querySelector("#table td:last-child").firstChild,
  ],
};
for (const id of ["cards", "styled", "whitespace", "integrated", "temporary"])
  cases[id] = () => document.getElementById(id);
for (const [name, makeSelection] of Object.entries(cases)) {
  const button = document.createElement("button");
  button.textContent = `Select ${name}`;
  button.addEventListener("click", () => {
    const target = makeSelection();
    const range = document.createRange();
    if (Array.isArray(target)) {
      range.setStart(target[0], target[1]);
      range.setEnd(target[3] || target[0], target[2]);
    } else range.selectNodeContents(target);
    window.getSelection().removeAllRanges();
    window.getSelection().addRange(range);
    selection.textContent = `Selected ${name}: ${range.toString()}`;
  });
  document.getElementById("controls").append(button);
}
document.getElementById("narrow").onclick = () => {
  fixtures.style.width = "220px";
};
document.getElementById("wide").onclick = () => {
  fixtures.style.width = "900px";
};
let temporaryUrl;
document.getElementById("blob").onclick = () => {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 2;
  canvas.getContext("2d").fillRect(0, 0, 2, 2);
  canvas.toBlob((blob) => {
    if (temporaryUrl) URL.revokeObjectURL(temporaryUrl);
    temporaryUrl = URL.createObjectURL(blob);
    const image = document.createElement("img");
    image.src = temporaryUrl;
    image.alt = "Sample diagram";
    const link = document.createElement("a");
    link.href = "https://example.invalid/details";
    link.append(image);
    document.getElementById("temporary").replaceChildren(link);
  });
};
document.getElementById("revoke").onclick = () => {
  if (temporaryUrl) URL.revokeObjectURL(temporaryUrl);
};
app.addEventListener("load", () => {
  app.contentDocument.addEventListener("paste", (event) => {
    const captured = {
      userAgent: navigator.userAgent,
      types: [...event.clipboardData.types],
      html: event.clipboardData.getData("text/html"),
      plain: event.clipboardData.getData("text/plain"),
    };
    setTimeout(() => {
      captured.markdown =
        app.contentDocument.getElementById("markdown-output")?.value ?? "";
      captured.status = Array.from(
        app.contentDocument.querySelectorAll("[data-sonner-toast]"),
      )
        .map((toast) => toast.textContent)
        .join("\n");
      evidence.textContent = JSON.stringify(captured, null, 2);
    }, 0);
  });
});
