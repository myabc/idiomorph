describe("Cross-realm morphing tests", function () {
  setup();

  const FILL = "<p>a</p><p>b</p><p>c</p><p>d</p><p>e</p>";

  function makeIframe() {
    let iframe = document.createElement("iframe");
    getWorkArea().append(iframe);
    return iframe;
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
});
