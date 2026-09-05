describe("Cross-realm morphing tests", function () {
  setup();

  const FILL = "<p>a</p><p>b</p><p>c</p><p>d</p><p>e</p>";

  function makeIframe() {
    let iframe = document.createElement("iframe");
    getWorkArea().append(iframe);
    return iframe;
  }

  function makeForeign(htmlStr) {
    let iframe = document.createElement("iframe");
    getWorkArea().append(iframe);
    let container = iframe.contentDocument.createElement("div");
    container.innerHTML = htmlStr;
    return container.firstElementChild;
  }

  // chai hangs the test runner when it tries to inspect a cross-realm node, so assert on booleans
  function assertSame(actual, expected) {
    (actual === expected).should.equal(true);
  }

  function assertRealm(node, iframe) {
    (node instanceof iframe.contentWindow.Node).should.equal(true);
    (node instanceof window.Node).should.equal(false);
  }

  function makeStatefulIframe(doc, id) {
    let inner = doc.getElementById(id);
    inner.contentDocument.body.innerHTML = "<b>STATE</b>";
    return inner;
  }

  it("morphs outerHTML as content properly when argument is a node from another document", function () {
    let initial = make("<button>Foo</button>");
    let iframe = document.createElement("iframe");
    getWorkArea().append(iframe);
    let final = iframe.contentDocument.createElement("button");
    final.textContent = "Bar";
    Idiomorph.morph(initial, final, { morphStyle: "outerHTML" });
    initial.outerHTML.should.equal("<button>Bar</button>");
  });

  it("syncs input value when newContent is a node from another document", function () {
    let initial = make('<input type="text">');
    initial.value = "Foo";
    let iframe = document.createElement("iframe");
    getWorkArea().append(iframe);
    let final = iframe.contentDocument.createElement("input");
    final.setAttribute("type", "text");
    final.setAttribute("value", "Bar");
    Idiomorph.morph(initial, final, { morphStyle: "outerHTML" });
    initial.value.should.equal("Bar");
  });

  it("preserves id'd element when detached newContent is from another document", function () {
    let initial = make(`<div><span id="s">Foo</span></div>`);
    let span = initial.querySelector("span");
    let final = makeForeign(`<div><div><span id="s">Foo</span></div></div>`);
    final.remove();
    Idiomorph.morph(initial, final);
    initial.outerHTML.should.equal(
      `<div><div><span id="s">Foo</span></div></div>`,
    );
    initial.querySelector("span").should.equal(span);
  });

  it("preserves id'd element when attached newContent is from another document", function () {
    let initial = make(`<div><span id="s">Foo</span></div>`);
    let span = initial.querySelector("span");
    let final = makeForeign(`<div><div><span id="s">Foo</span></div></div>`);

    Idiomorph.morph(initial, final);
    initial.outerHTML.should.equal(
      `<div><div><span id="s">Foo</span></div></div>`,
    );
    initial.querySelector("span").should.equal(span);
  });

  it("morphs template tag contents when newContent is from another document", function () {
    let initial = make("<template data-old>Foo</template>");
    let final = makeForeign("<template data-new>Bar</template>");
    Idiomorph.morph(initial, final);
    initial.outerHTML.should.equal('<template data-new="">Bar</template>');
  });

  it("syncs option selectedness when newContent is from another document", function () {
    let parent = make(
      `<div><select><option>0</option><option>1</option></select></div>`,
    );
    getWorkArea().append(parent);
    let select = parent.querySelector("select");
    let final = makeForeign(
      `<select><option>0</option><option>1</option></select>`,
    );
    final.children[1].selected = true;
    Idiomorph.morph(select, final);
    select.selectedIndex.should.equal(1);
  });

  it("syncs textarea value when newContent is from another document", function () {
    let initial = make("<textarea>Foo</textarea>");
    initial.value = "dirty";
    let final = makeForeign("<textarea>Bar</textarea>");
    Idiomorph.morph(initial, final);
    initial.value.should.equal("Bar");
  });

  it("merges head element from another document", function () {
    let iframe = document.createElement("iframe");
    getWorkArea().append(iframe);
    let foreignDocument = iframe.contentDocument;
    foreignDocument.head.innerHTML = `<meta name="a"><title>Foo</title>`;
    let newHead = foreignDocument.createElement("head");
    newHead.innerHTML = `<title>Foo</title><meta name="a">`;
    Idiomorph.morph(foreignDocument.head, newHead);
    foreignDocument.head.innerHTML.should.equal(
      `<meta name="a"><title>Foo</title>`,
    );
  });

  it("ignores head element from another document when head.style is none", function () {
    let iframe = document.createElement("iframe");
    getWorkArea().append(iframe);
    let foreignDocument = iframe.contentDocument;
    foreignDocument.title = "Old";
    let newHead = foreignDocument.createElement("head");
    newHead.innerHTML = "<title>New</title>";
    Idiomorph.morph(foreignDocument.head, newHead, {
      head: { style: "none" },
    });
    foreignDocument.title.should.equal("Old");
  });

  it("preserves namespaced attributes when newContent is from another document", function () {
    let initial = make(`<div><svg><use></use></svg></div>`);
    let final = makeForeign(
      `<div><svg><use xlink:href="#foo"></use></svg></div>`,
    );
    Idiomorph.morph(initial, final);
    initial
      .querySelector("use")
      .getAttributeNS("http://www.w3.org/1999/xlink", "href")
      .should.equal("#foo");
  });

  it("morphs a document from another realm properly", function () {
    let iframe = document.createElement("iframe");
    getWorkArea().append(iframe);
    let foreignDocument = iframe.contentDocument;
    foreignDocument.body.innerHTML = "<p>Foo</p>";
    Idiomorph.morph(
      foreignDocument,
      "<html><head></head><body><p>Bar</p></body></html>",
    );
    foreignDocument.body.innerHTML.should.equal("<p>Bar</p>");
  });

  it("creates added nodes in the target's realm", function () {
    let iframe = makeIframe();
    let doc = iframe.contentDocument;
    doc.body.innerHTML = `<div id="x"><p>Foo</p></div>`;
    Idiomorph.morph(
      doc.getElementById("x"),
      `<div id="x"><p>Foo</p><span>New</span></div>`,
    );
    assertRealm(doc.querySelector("span"), iframe);
  });

  it("creates added nodes containing persistent ids in the target's realm", function () {
    let iframe = makeIframe();
    let doc = iframe.contentDocument;
    doc.body.innerHTML = `<div id="x"><p id="keep">Foo</p></div>`;
    Idiomorph.morph(
      doc.getElementById("x"),
      `<div id="x"><section><p id="keep">Foo</p></section></div>`,
    );
    assertRealm(doc.querySelector("section"), iframe);
  });

  it("creates added head elements in the target's realm", function () {
    let iframe = makeIframe();
    let doc = iframe.contentDocument;
    doc.head.innerHTML = `<title>Old</title>`;
    let newHead = doc.createElement("head");
    newHead.innerHTML = `<title>Old</title><meta name="added">`;
    Idiomorph.morph(doc.head, newHead);
    assertRealm(doc.head.querySelector(`meta[name="added"]`), iframe);
  });

  it("keeps added nodes owned by the target's document", function () {
    let iframe = makeIframe();
    let doc = iframe.contentDocument;
    doc.body.innerHTML = `<div id="x"></div>`;
    Idiomorph.morph(
      doc.getElementById("x"),
      `<div id="x"><span>New</span></div>`,
    );
    assertSame(doc.querySelector("span").ownerDocument, doc);
  });

  if (hasMoveBefore()) {
    it("preserves the state of moved nodes in another realm", function () {
      let iframe = makeIframe();
      let doc = iframe.contentDocument;
      doc.body.innerHTML = `<div id="x"><iframe id="inner"></iframe>${FILL}</div>`;
      let inner = makeStatefulIframe(doc, "inner");
      let innerWindow = inner.contentWindow;
      Idiomorph.morph(
        doc.getElementById("x"),
        `<div id="x">${FILL}<iframe id="inner"></iframe></div>`,
      );
      assertSame(doc.getElementById("inner"), inner);
      assertSame(inner.contentWindow, innerWindow);
      inner.contentDocument.body.innerHTML.should.equal("<b>STATE</b>");
    });

    it("preserves the state of moved nodes when morphing an entire document", function () {
      let iframe = makeIframe();
      let doc = iframe.contentDocument;
      doc.body.innerHTML = `<iframe id="inner"></iframe>${FILL}`;
      let inner = makeStatefulIframe(doc, "inner");
      let innerWindow = inner.contentWindow;
      Idiomorph.morph(
        doc,
        `<html><head></head><body>${FILL}<iframe id="inner"></iframe></body></html>`,
      );
      assertSame(doc.getElementById("inner"), inner);
      assertSame(inner.contentWindow, innerWindow);
      inner.contentDocument.body.innerHTML.should.equal("<b>STATE</b>");
    });
  }

  it("does not expose its pantry to callbacks when morphing an entire document", function () {
    let iframe = makeIframe();
    let doc = iframe.contentDocument;
    doc.body.innerHTML = `<p>Foo</p>`;
    let removed = [];
    Idiomorph.morph(doc, `<html><head></head><body><p>Bar</p></body></html>`, {
      callbacks: {
        beforeNodeRemoved: (node) => {
          removed.push(node.nodeName);
        },
      },
    });
    removed.should.not.include("DIV");
  });

  it("honors ignoreActiveValue for the target document's active element", function () {
    let iframe = makeIframe();
    let doc = iframe.contentDocument;
    doc.body.innerHTML = `<div id="x"><input id="i" value="server"></div>`;
    let input = doc.getElementById("i");
    input.focus();
    input.value = "user typed";
    Idiomorph.morph(
      doc.getElementById("x"),
      `<div id="x"><input id="i" value="server2"></div>`,
      { ignoreActiveValue: true },
    );
    input.value.should.equal("user typed");
    input.getAttribute("value").should.equal("server");
  });

  it("honors ignoreActive for the target document's active element", function () {
    let iframe = makeIframe();
    let doc = iframe.contentDocument;
    doc.body.innerHTML = `<div id="x"><input id="i" class="old"></div>`;
    let input = doc.getElementById("i");
    input.focus();
    Idiomorph.morph(
      doc.getElementById("x"),
      `<div id="x"><input id="i" class="new"></div>`,
      { ignoreActive: true },
    );
    input.className.should.equal("old");
  });

  it("ignores the active textarea's value in the target's document when ignoreActiveValue is set", function () {
    let doc = makeIframe().contentDocument;
    doc.body.innerHTML = "<textarea id='t1'>server1</textarea>";
    let t1 = doc.getElementById("t1");
    t1.focus();
    t1.value = "typed-by-user";
    (doc.activeElement === t1).should.equal(true);
    Idiomorph.morph(t1, "<textarea id='t1' class='c'>server2</textarea>", {
      morphStyle: "outerHTML",
      ignoreActiveValue: true,
    });
    t1.value.should.equal("typed-by-user");
    t1.classList.value.should.equal("c");
  });

  it("preserves focus algorithmically when morphing inside another document", function () {
    let doc = makeIframe().contentDocument;
    doc.body.innerHTML = `<div><input type="text" id="focused" value="abc"><input type="text" id="other"></div>`;
    let focused = doc.getElementById("focused");
    focused.parentElement.moveBefore = undefined;
    focused.focus();
    (doc.activeElement === focused).should.equal(true);

    Idiomorph.morph(
      doc.body,
      `<div><input type="text" id="other"><input type="text" id="focused" value="abc"></div>`,
      { morphStyle: "innerHTML", restoreFocus: false },
    );

    (doc.activeElement === focused).should.equal(true);
  });
});
