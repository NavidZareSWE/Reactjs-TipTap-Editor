"use client";

/* eslint-disable unicorn/no-null */
/* eslint-disable quotes */
import { useCallback, useState, useEffect } from "react";
import React from "react";
import { useRef } from "react";
import RichTextEditor, { BaseKit } from "reactjs-tiptap-editor";
import { BubbleMenuKatex } from "reactjs-tiptap-editor/bubble-extra";
import { Attachment } from "reactjs-tiptap-editor/attachment";
import { Blockquote } from "reactjs-tiptap-editor/blockquote";
import { Bold } from "reactjs-tiptap-editor/bold";
import { BulletList } from "reactjs-tiptap-editor/bulletlist";
import { Clear } from "reactjs-tiptap-editor/clear";
import { Code } from "reactjs-tiptap-editor/code";
import { CodeBlock } from "reactjs-tiptap-editor/codeblock";
import { Color } from "reactjs-tiptap-editor/color";
import { ColumnActionButton } from "reactjs-tiptap-editor/multicolumn";
import { Emoji } from "reactjs-tiptap-editor/emoji";
import { ExportPdf } from "reactjs-tiptap-editor/exportpdf";
import { ExportWord } from "reactjs-tiptap-editor/exportword";
import { FontFamily } from "reactjs-tiptap-editor/fontfamily";
import { FontSize } from "reactjs-tiptap-editor/fontsize";
import { FormatPainter } from "reactjs-tiptap-editor/formatpainter";
import { Heading } from "reactjs-tiptap-editor/heading";
import { Highlight } from "reactjs-tiptap-editor/highlight";
import { History } from "reactjs-tiptap-editor/history";
import { HorizontalRule } from "reactjs-tiptap-editor/horizontalrule";
import { Iframe } from "reactjs-tiptap-editor/iframe";
import { Image } from "reactjs-tiptap-editor/image";
import { ImportWord } from "reactjs-tiptap-editor/importword";
import { Indent } from "reactjs-tiptap-editor/indent";
import { Italic } from "reactjs-tiptap-editor/italic";
import { LineHeight } from "reactjs-tiptap-editor/lineheight";
import { Link } from "reactjs-tiptap-editor/link";
import { Mention } from "reactjs-tiptap-editor/mention";
import { MoreMark } from "reactjs-tiptap-editor/moremark";
import { OrderedList } from "reactjs-tiptap-editor/orderedlist";
import { SearchAndReplace } from "reactjs-tiptap-editor/searchandreplace";
import { Strike } from "reactjs-tiptap-editor/strike";
import { Table } from "reactjs-tiptap-editor/table";
import { TableOfContents } from "reactjs-tiptap-editor/tableofcontent";
import { TaskList } from "reactjs-tiptap-editor/tasklist";
import { TextAlign } from "reactjs-tiptap-editor/textalign";
import { TextUnderline } from "reactjs-tiptap-editor/textunderline";
import { TextDirection } from "reactjs-tiptap-editor/textdirection";
import { Katex } from "reactjs-tiptap-editor/katex";
import "reactjs-tiptap-editor/style.css";
import "prism-code-editor-lightweight/layout.css";
import "prism-code-editor-lightweight/themes/github-dark.css";
import "katex/dist/katex.min.css";
import "react-image-crop/dist/ReactCrop.css";

function convertBase64ToBlob(base64: string) {
  const arr = base64.split(",");
  const mime = arr[0].match(/:(.*?);/)![1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new Blob([u8arr], { type: mime });
}

const extensions = [
  FontFamily,
  FontSize,
  Heading,
  TableOfContents.configure({ spacer: true }),
  Color.configure({ spacer: true }),
  Highlight,
  FormatPainter,
  Clear,
  TextDirection,
  LineHeight,
  Bold.configure({ spacer: true }),
  Italic,
  TextUnderline,
  Strike,
  MoreMark,
  Emoji,
  TextAlign.configure({ types: ["heading", "paragraph"], spacer: true }),
  BulletList.configure({ spacer: true }),
  OrderedList,
  Blockquote,
  Code.configure({
    toolbar: false,
  }),
  CodeBlock,
  TaskList.configure({
    taskItem: {
      nested: true,
    },
  }),
  Indent.configure({ spacer: true }),
  Link.configure({ spacer: true }),
  Image.configure({
    upload: (files: File) => {
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve(URL.createObjectURL(files));
        }, 500);
      });
    },
  }),
  Attachment.configure({
    upload: (file: any) => {
      // fake upload return base 64
      const reader = new FileReader();
      reader.readAsDataURL(file);

      return new Promise((resolve) => {
        setTimeout(() => {
          const blob = convertBase64ToBlob(reader.result as string);
          resolve(URL.createObjectURL(blob));
        }, 300);
      });
    },
  }),
  HorizontalRule.configure({ spacer: true }),
  ColumnActionButton,
  Table,
  Iframe,
  Mention,
  Katex,
  ExportPdf.configure({ spacer: true }),
  ExportWord,
  ImportWord.configure({
    upload: (files: File[]) => {
      const f = files.map((file) => ({
        src: URL.createObjectURL(file),
        alt: file.name,
      }));
      return Promise.resolve(f);
    },
  }),
  BaseKit.configure({
    placeholder: {
      showOnlyCurrent: true,
    },
    characterCount: {
      limit: 25_000,
    },
  }),
  History.configure({ spacer: true }),
  SearchAndReplace,
];

function debounce(func: any, wait: number) {
  let timeout: NodeJS.Timeout;
  return function (...args: any[]) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}

interface GreatGrandParentNode {
  node: HTMLElement;
  isActive: boolean;
}

interface GreatGrandParentArray {
  [key: number]: GreatGrandParentNode;
}

export default function Editor() {
  const [content, setContent] = useState("");
  const [theme, setTheme] = useState();
  const [disable, setDisable] = useState(false);
  const editorWrapperRef = useRef<HTMLDivElement | null>(null);
  const [iframeWrapper, setIframeWrapper] =
    useState<NodeListOf<HTMLElement> | null>(null);
  const [greatGrandParentArray, setGreatGrandParentArray] = useState<
    HTMLElement[]
  >([]);
  const [isIframeActive, setIsIframeActive] = useState<Boolean[]>([]);
  const [alignContainer, setAlignContainer] = useState<HTMLElement | null>(
    null
  );
  const [alignButton, setAlignButton] = useState<HTMLElement | null>(null);

  const makeActive = (index: number) => {
    if (iframeWrapper && iframeWrapper[index]) {
      const wrapper = iframeWrapper[index];
      // Ensure the container is focusable
      if (!wrapper.hasAttribute("tabindex"))
        wrapper.setAttribute("tabindex", "-1"); // Programmatic focus
      const arr = new Array(isIframeActive.length).fill(false); // Create a shallow copy
      arr[index] = !isIframeActive[index];
      setIsIframeActive(arr);

      // wrapper.focus(); // Focus the container
      // console.log("Container to focus:", wrapper);
      // console.log("Is container focused?", document.activeElement === wrapper); // Debug: Verify focus
    }
  };

  const alignIframe = (alignName) => {
    // console.log(
    //   `AlignName:${alignName}\ngreatGrandParentArray.length:${greatGrandParentArray.length}`
    // );
    if (!iframeWrapper || greatGrandParentArray.length <= 0) return;
    greatGrandParentArray.map((greatGrandParent, index) => {
      console.log(isIframeActive);
      if (isIframeActive[index]) {
        switch (alignName) {
          case "LEFT":
            greatGrandParent.style.float = "left";
            greatGrandParent.style.margin = "10px 15px 10px 0";
            break;
          case "CENTER":
            greatGrandParent.style.float = "none";
            greatGrandParent.style.justifyContent = "center";
            greatGrandParent.style.margin = "10px";
            break;
          case "RIGHT":
            greatGrandParent.style.float = "right";
            greatGrandParent.style.margin = "10px 0 10px 15px";
            break;
          case "JUSTIFY":
            greatGrandParent.style.float = "left";
            break;
          default:
            break;
        }
        return;
      }
    });
  };
  useEffect(() => {
    if (iframeWrapper)
      Array.from(iframeWrapper).map((wrapper, index) => {
        if (isIframeActive[index]) wrapper.classList.add("active");
        else wrapper.classList.remove("active");
      });
  }, [isIframeActive]);

  // Effect to find and set the button
  useEffect(() => {
    const findButton = () => {
      const button = editorWrapperRef?.current?.querySelector<HTMLElement>(
        ".richtext-flex.richtext-items-center:nth-child(17) button"
      );
      if (button) {
        setAlignButton(button);
      }
    };
    findButton();
    // If not found, set up a MutationObserver to detect DOM changes
    if (!alignButton) {
      const observer = new MutationObserver(() => {
        findButton();
      });
      if (editorWrapperRef.current) {
        observer.observe(editorWrapperRef.current, {
          childList: true,
          subtree: true,
        });
      }
      return () => observer.disconnect();
    }
  }, [editorWrapperRef.current]);

  useEffect(() => {
    if (!alignButton) return;
    const alignClickHandler = (e: MouseEvent) => {
      // Use setTimeout to push this check to the next event loop tick
      // to allow the popup to render first
      setTimeout(() => {
        const element = document.querySelector("#radix-\\«rv\\»");
        if (element instanceof HTMLElement) {
          setAlignContainer(element);
        }
        // If it's still null, try with a small delay and a mutation observer
        if (!element) {
          const observer = new MutationObserver((mutations) => {
            const popup = document.querySelector("#radix-\\«rv\\»");
            if (popup) {
              if (popup instanceof HTMLElement) {
                setAlignContainer(popup);
              }
              console.log("Popup found after mutation:", popup);
              observer.disconnect();
            }
          });

          // Observe the entire document for changes
          observer.observe(document.body, {
            childList: true,
            subtree: true,
          });
          setTimeout(() => observer.disconnect(), 2000);
        }
      }, 0);
    };
    alignButton.addEventListener("click", alignClickHandler);
    return () => {
      alignButton.removeEventListener("click", alignClickHandler);
    };
  }, [alignButton]);

  useEffect(() => {
    if (alignContainer) {
      // Convert HTMLCollection to Array to use forEach
      Array.from(alignContainer.children).forEach((button, index) => {
        let buttonName = null;
        switch (index) {
          case 0:
            buttonName = "LEFT";
            break;
          case 2:
            buttonName = "CENTER";
            break;
          case 3:
            buttonName = "RIGHT";
            break;
          case 4:
            buttonName = "JUSTIFY";
            break;
          default:
            break;
        }
        // console.log(button)
        // console.log(`ButtonName: ${buttonName}\n index: ${index}`)
        if (buttonName) {
          (button as HTMLElement).addEventListener("click", () =>
            alignIframe(buttonName)
          );
        }
      });

      return () => {
        Array.from(alignContainer.children).forEach((button, index) => {
          let buttonName = null;
          if (!buttonName) {
            (button as HTMLElement).removeEventListener("click", () =>
              alignIframe(buttonName)
            );
          }
        });
      };
    }
  }, [alignContainer]);

  useEffect(() => {
    if (!editorWrapperRef.current) return;
  });

  useEffect(() => {
    if (editorWrapperRef.current) {
      const wrappers = editorWrapperRef.current.querySelectorAll(
        "._wrap_5y04w_1.render-wrapper:has(iframe)"
      ) as NodeListOf<HTMLElement>;
      if (wrappers) {
        setIsIframeActive(new Array(wrappers.length).fill(false));
        let arr: HTMLElement[] = [];
        wrappers.forEach((grandParent) => {
          const greatGrandParent = grandParent.parentElement?.parentElement;
          if (greatGrandParent) {
            greatGrandParent.style.display = "flex";
            arr.push(greatGrandParent);
            //   greatGrandParent.style.minHeight = "16/9";
          }
        });
        setGreatGrandParentArray(arr);
      }
      setIframeWrapper(wrappers);
    }
  }, [content]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      setTheme(mediaQuery.matches ? "dark" : "light");
    }
  }, []);

  const onValueChange = useCallback(
    debounce((value: any) => {
      setContent(value);
    }, 300),
    []
  );

  return (
    <main
      style={{
        padding: "0 20px",
      }}
    >
      <div
        style={{
          maxWidth: 1024,
          margin: "88px auto 120px",
        }}
      >
        <div
          style={{
            display: "flex",
            gap: "12px",
            marginBottom: 10,
          }}
          className="buttonWrap"
        >
          <button onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
            {theme === "dark" ? "Light ☀️" : "Dark 🌑"}
          </button>
          <button onClick={() => setDisable(!disable)}>
            {disable ? "Editable" : "Readonly"}
          </button>
          {iframeWrapper
            ? Array.from(iframeWrapper).map((wrapper, index) => (
                <button key={index} onClick={() => makeActive(index)}>
                  {isIframeActive[index]
                    ? `Deselect Iframe #${index + 1}`
                    : `Select Iframe #${index + 1}`}
                </button>
              ))
            : null}
        </div>
        <div ref={editorWrapperRef}>
          <RichTextEditor
            output="html"
            content={content as any}
            onChangeContent={onValueChange}
            extensions={extensions}
            dark={theme === "dark"}
            disabled={disable}
            bubbleMenu={{
              render({ extensionsNames, editor, disabled }, bubbleDefaultDom) {
                return (
                  <>
                    {bubbleDefaultDom}
                    {extensionsNames.includes("katex") ? (
                      <BubbleMenuKatex
                        disabled={disabled}
                        editor={editor}
                        key="katex"
                      />
                    ) : null}
                  </>
                );
              },
            }}
          />
        </div>
        {typeof content === "string" && (
          <textarea
            className="textarea"
            readOnly
            style={{
              marginTop: 20,
              height: 500,
              width: "100%",
              borderRadius: 4,
              padding: 10,
            }}
            value={content}
          />
        )}
      </div>
    </main>
  );
}
