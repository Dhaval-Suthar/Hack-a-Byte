"use client";

import React, { useState, useEffect, useRef } from "react";

interface NotepadProps {
  onClose: () => void;
  filePath?: string;
  initialContent?: string;
}

// Extend the component with a windowTitle property for the parent to access
const Notepad: React.FC<NotepadProps> & { windowTitle?: string } = ({ onClose, filePath, initialContent }) => {
  const defaultText =
    "Welcome to Notepad!\n\nThis is a simple text editor just like Windows 95 Notepad.\nYou can type your text here.\n\n\n\n\n--------------------------------------------------\n[Text below is very faint, almost invisible]\n\nMISSION HINT: \n1. Use 'show hidden files' command in Terminal\n2. Check Windows\\System32 directory for hidden files (files starting with '.')\n3. Use 'decrypt-file' command once you find encryption information\n4. Files in C:\\Documents\\Encrypted need decryption";

  const [text, setText] = useState(initialContent || defaultText);
  const [wordWrap, setWordWrap] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [showReplace, setShowReplace] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [replaceTerm, setReplaceTerm] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [showMenu, setShowMenu] = useState<string | null>(null);
  const [cursorPosition, setCursorPosition] = useState({ line: 1, col: 1 });
  const [searchHits, setSearchHits] = useState<number[]>([]);
  const [currentHit, setCurrentHit] = useState(-1);
  const [modified, setModified] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showPrintDialog, setShowPrintDialog] = useState(false);
  const [caseSensitiveSearch, setCaseSensitiveSearch] = useState(false);
  const [showGoToLine, setShowGoToLine] = useState(false);
  const [goToLineNumber, setGoToLineNumber] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Get file name for window title
  const displayName = filePath ? filePath.split("\\").pop() || "Untitled.txt" : "Untitled.txt";

  // Set window title through the custom property
  const windowTitle = displayName + (modified ? " *" : "");
  Notepad.windowTitle = windowTitle;

  // Save content to user-specific storage whenever text changes
  useEffect(() => {
    const saveContent = async () => {
      try {
        if (filePath) {
          const { UserPreferences } = await import("../hooks/useUserPreferences");
          UserPreferences.setAppData(`notepad_${filePath}`, text);
        }
      } catch (error) {
        console.error("Error saving notepad content:", error);
      }
    };

    // Only save if this is an actual file path, not the default document
    if (filePath) {
      const saveTimeout = setTimeout(saveContent, 500); // Debounce saving
      return () => clearTimeout(saveTimeout);
    }
  }, [text, filePath]);

  // Load user preferences and file content
  useEffect(() => {
    const loadTextContent = async () => {
      try {
        if (filePath) {
          const { UserPreferences } = await import("../hooks/useUserPreferences");

          // Load file-specific content if available
          const savedText = UserPreferences.getAppData(`notepad_${filePath}`, null);
          if (savedText !== null) {
            setText(savedText);
          }
        }
      } catch (error) {
        console.error("Error loading notepad text content:", error);
      }
    };

    loadTextContent();
  }, [filePath]);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value;
    setText(newText);
    setModified(true);

    // Update cursor position
    const textarea = e.target;
    const cursorPos = textarea.selectionStart;
    const textBeforeCursor = newText.substring(0, cursorPos);
    const lines = textBeforeCursor.split("\n");
    const lineNumber = lines.length;
    const colNumber = lines[lines.length - 1].length + 1;

    setCursorPosition({
      line: lineNumber,
      col: colNumber,
    });
  };

  // Handle Ctrl+F for search
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.ctrlKey && e.key === "f") {
      e.preventDefault();
      setShowSearch(true);
    } else if (e.ctrlKey && e.key === "h") {
      e.preventDefault();
      setShowReplace(true);
      setShowSearch(true);
    } else if (e.ctrlKey && e.key === "s") {
      e.preventDefault();
      if (filePath) {
        saveFile();
      } else {
        setShowSaveDialog(true);
      }
    }
  };

  // Print functionality
  const handlePrint = () => {
    setShowPrintDialog(true);
  };

  const executePrint = () => {
    setStatusMessage("Printing...");

    // Simulate printing process
    setTimeout(() => {
      setStatusMessage("Document sent to printer");
      setShowPrintDialog(false);

      // Clear status message after a few seconds
      setTimeout(() => {
        setStatusMessage("");
      }, 3000);
    }, 1500);
  };

  // Go to line functionality
  const handleGoToLine = () => {
    setShowGoToLine(true);
  };

  const executeGoToLine = () => {
    if (!goToLineNumber || isNaN(parseInt(goToLineNumber))) {
      setStatusMessage("Please enter a valid line number");
      return;
    }

    const lineNum = parseInt(goToLineNumber);
    const lines = text.split("\n");

    if (lineNum < 1 || lineNum > lines.length) {
      setStatusMessage(`Line number out of range (1-${lines.length})`);
      return;
    }

    // Calculate position in text
    let position = 0;
    for (let i = 0; i < lineNum - 1; i++) {
      position += lines[i].length + 1; // +1 for newline char
    }

    // Set cursor position
    if (textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.setSelectionRange(position, position);

      // Update cursor position state
      setCursorPosition({
        line: lineNum,
        col: 1,
      });
    }

    setShowGoToLine(false);
    setGoToLineNumber("");
  };

  // Search for a term in the text
  const handleSearch = () => {
    if (!searchTerm) {
      setStatusMessage("Please enter a search term");
      return;
    }

    // Find all occurrences of the search term
    const hits: number[] = [];
    let index = -1;

    do {
      index = text.indexOf(searchTerm, index + 1);
      if (index !== -1) {
        hits.push(index);
      }
    } while (index !== -1);

    if (hits.length === 0) {
      setStatusMessage(`Cannot find "${searchTerm}"`);
      return;
    }

    // Set the search hits and highlight the first one
    setSearchHits(hits);
    setCurrentHit(0);
    highlightHit(hits[0]);

    setStatusMessage(`Found ${hits.length} matches for "${searchTerm}"`);
  };

  // Highlight a specific search hit
  const highlightHit = (position: number) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    textarea.focus();
    textarea.setSelectionRange(position, position + searchTerm.length);
  };

  // Enhanced search functionality
  const performSearch = () => {
    if (!searchTerm) {
      setSearchHits([]);
      setCurrentHit(-1);
      return;
    }

    const hits: number[] = [];
    let searchText = text;
    let term = searchTerm;

    if (!caseSensitiveSearch) {
      searchText = searchText.toLowerCase();
      term = term.toLowerCase();
    }

    let lastIndex = -1;

    // Find all occurrences
    while ((lastIndex = searchText.indexOf(term, lastIndex + 1)) !== -1) {
      hits.push(lastIndex);
    }

    setSearchHits(hits);
    setCurrentHit(hits.length > 0 ? 0 : -1);

    if (hits.length > 0 && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.setSelectionRange(hits[0], hits[0] + searchTerm.length);
      scrollToCursor();
      setStatusMessage(`Found ${hits.length} occurrence${hits.length !== 1 ? "s" : ""}`);
    } else {
      setStatusMessage("Text not found");
    }
  };

  // Find next occurrence
  const findNext = () => {
    if (searchHits.length === 0) {
      performSearch();
      return;
    }

    let nextHit = currentHit + 1;
    if (nextHit >= searchHits.length) nextHit = 0;

    setCurrentHit(nextHit);

    if (textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.setSelectionRange(searchHits[nextHit], searchHits[nextHit] + searchTerm.length);
      scrollToCursor();
    }
  };

  // Find previous occurrence
  const findPrevious = () => {
    if (searchHits.length === 0) {
      performSearch();
      return;
    }

    let prevHit = currentHit - 1;
    if (prevHit < 0) prevHit = searchHits.length - 1;

    setCurrentHit(prevHit);

    if (textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.setSelectionRange(searchHits[prevHit], searchHits[prevHit] + searchTerm.length);
      scrollToCursor();
    }
  };

  // Scroll to ensure cursor is visible
  const scrollToCursor = () => {
    if (!textareaRef.current) return;

    const textarea = textareaRef.current;
    const cursorPos = textarea.selectionStart;

    // Calculate line height based on text size and textarea height
    const approxLineHeight = 20; // Estimate based on font size

    // Calculate which line the cursor is on
    const textBeforeCursor = text.substring(0, cursorPos);
    const linesBeforeCursor = textBeforeCursor.split("\n").length;

    // Calculate target scroll position
    const targetScrollPos = (linesBeforeCursor - 5) * approxLineHeight;

    // Scroll to make cursor visible with some context
    textarea.scrollTop = Math.max(0, targetScrollPos);
  };

  // Replace current hit with replacement text
  const replaceHit = () => {
    if (searchHits.length === 0 || currentHit === -1) {
      handleSearch();
      return;
    }

    const position = searchHits[currentHit];
    const newText = text.substring(0, position) + replaceTerm + text.substring(position + searchTerm.length);
    setText(newText);
    setModified(true);

    // Update search hits after replacement
    handleSearch();
  };

  // Replace all occurrences
  const replaceAll = () => {
    if (!searchTerm) {
      handleSearch();
      return;
    }

    const newText = text.split(searchTerm).join(replaceTerm);
    setText(newText);
    setModified(true);
    setStatusMessage(`Replaced all occurrences of "${searchTerm}" with "${replaceTerm}"`);
  };

  // Save the current file
  const saveFile = () => {
    if (!filePath) return;

    try {
      import("../hooks/useUserPreferences")
        .then(({ UserPreferences }) => {
          UserPreferences.setAppData(`notepad_${filePath}`, text);
          setStatusMessage(`File saved: ${filePath}`);
          setModified(false);
        })
        .catch((error) => {
          console.error("Error saving file:", error);
          setStatusMessage("Error saving file");
        });
    } catch (error) {
      console.error("Error saving file:", error);
      setStatusMessage("Error saving file");
    }
  };

  // Toggle word wrap
  const toggleWordWrap = () => {
    setWordWrap(!wordWrap);
  };

  // Menu handling
  const handleMenuClick = (menu: string) => {
    setShowMenu(menu === showMenu ? null : menu);
  };

  return (
    <div className="w-full h-full flex flex-col bg-[#c0c0c0]">
      {/* Menu bar */}
      <div className="w-full flex text-sm items-center bg-[#c0c0c0] border-b border-b-[#808080] p-0.5">
        {["File", "Edit", "Format", "View", "Help"].map((menu) => (
          <div
            key={menu}
            className={`px-2 py-0.5 cursor-pointer ${
              showMenu === menu ? "bg-[#000080] text-white" : "hover:bg-[#000080] hover:text-white"
            }`}
            onClick={() => handleMenuClick(menu)}
          >
            {menu}
          </div>
        ))}

        {/* File menu dropdown */}
        {showMenu === "File" && (
          <div className="absolute left-0 top-5 mt-1 w-48 border-2 border-t-[#808080] border-l-[#808080] border-r-[#ffffff] border-b-[#ffffff] bg-[#c0c0c0] z-50">
            <div className="px-3 py-1 hover:bg-[#000080] hover:text-white cursor-pointer text-sm">New</div>
            <div className="px-3 py-1 hover:bg-[#000080] hover:text-white cursor-pointer text-sm">Open...</div>
            <div className="px-3 py-1 hover:bg-[#000080] hover:text-white cursor-pointer text-sm" onClick={saveFile}>
              Save
            </div>
            <div className="px-3 py-1 hover:bg-[#000080] hover:text-white cursor-pointer text-sm">Save As...</div>
            <div className="border-t border-t-[#808080] my-1"></div>
            <div className="px-3 py-1 hover:bg-[#000080] hover:text-white cursor-pointer text-sm" onClick={handlePrint}>
              Print...
            </div>
            <div className="border-t border-t-[#808080] my-1"></div>
            <div className="px-3 py-1 hover:bg-[#000080] hover:text-white cursor-pointer text-sm" onClick={onClose}>
              Exit
            </div>
          </div>
        )}

        {/* Edit menu dropdown */}
        {showMenu === "Edit" && (
          <div className="absolute left-8 top-5 mt-1 w-48 border-2 border-t-[#808080] border-l-[#808080] border-r-[#ffffff] border-b-[#ffffff] bg-[#c0c0c0] z-50">
            <div className="px-3 py-1 hover:bg-[#000080] hover:text-white cursor-pointer text-sm">Undo</div>
            <div className="border-t border-t-[#808080] my-1"></div>
            <div className="px-3 py-1 hover:bg-[#000080] hover:text-white cursor-pointer text-sm">Cut</div>
            <div className="px-3 py-1 hover:bg-[#000080] hover:text-white cursor-pointer text-sm">Copy</div>
            <div className="px-3 py-1 hover:bg-[#000080] hover:text-white cursor-pointer text-sm">Paste</div>
            <div className="px-3 py-1 hover:bg-[#000080] hover:text-white cursor-pointer text-sm">Delete</div>
            <div className="border-t border-t-[#808080] my-1"></div>
            <div
              className="px-3 py-1 hover:bg-[#000080] hover:text-white cursor-pointer text-sm"
              onClick={() => setShowSearch(true)}
            >
              Find...
            </div>
            <div className="px-3 py-1 hover:bg-[#000080] hover:text-white cursor-pointer text-sm" onClick={findNext}>
              Find Next
            </div>
            <div
              className="px-3 py-1 hover:bg-[#000080] hover:text-white cursor-pointer text-sm"
              onClick={findPrevious}
            >
              Find Previous
            </div>
            <div
              className="px-3 py-1 hover:bg-[#000080] hover:text-white cursor-pointer text-sm"
              onClick={() => setShowReplace(true)}
            >
              Replace...
            </div>
            <div
              className="px-3 py-1 hover:bg-[#000080] hover:text-white cursor-pointer text-sm"
              onClick={handleGoToLine}
            >
              Go To Line...
            </div>
            <div
              className="px-3 py-1 hover:bg-[#000080] hover:text-white cursor-pointer text-sm"
              onClick={() => {
                setShowSearch(true);
                setShowReplace(true);
              }}
            >
              Replace...
            </div>
            <div className="border-t border-t-[#808080] my-1"></div>
            <div className="px-3 py-1 hover:bg-[#000080] hover:text-white cursor-pointer text-sm">Select All</div>
            <div className="px-3 py-1 hover:bg-[#000080] hover:text-white cursor-pointer text-sm">Time/Date</div>
          </div>
        )}

        {/* Format menu dropdown */}
        {showMenu === "Format" && (
          <div className="absolute left-16 top-5 mt-1 w-48 border-2 border-t-[#808080] border-l-[#808080] border-r-[#ffffff] border-b-[#ffffff] bg-[#c0c0c0] z-50">
            <div
              className="px-3 py-1 hover:bg-[#000080] hover:text-white cursor-pointer text-sm flex items-center"
              onClick={toggleWordWrap}
            >
              <span className="mr-2 w-4">{wordWrap ? "✓" : ""}</span>
              Word Wrap
            </div>
            <div className="px-3 py-1 hover:bg-[#000080] hover:text-white cursor-pointer text-sm">Font...</div>
          </div>
        )}
      </div>

      {/* Status bar */}
      <div className="h-5 bg-[#c0c0c0] border-t border-t-[#808080] flex items-center justify-between p-1 text-xs">
        <div className="flex-1">{statusMessage}</div>
        <div>
          Ln {cursorPosition.line}, Col {cursorPosition.col}
        </div>
      </div>

      {/* Print dialog */}
      {showPrintDialog && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="fixed inset-0 bg-black opacity-30" onClick={() => setShowPrintDialog(false)}></div>
          <div className="w-80 bg-[#c0c0c0] border-2 border-t-[#ffffff] border-l-[#ffffff] border-r-[#404040] border-b-[#404040] z-10 shadow-md">
            <div className="bg-[#000080] text-white px-2 py-1 flex justify-between items-center">
              <span className="text-sm font-bold">Print</span>
              <button className="text-white text-sm focus:outline-none" onClick={() => setShowPrintDialog(false)}>
                ✕
              </button>
            </div>
            <div className="p-4">
              <div className="mb-4">
                <h3 className="text-sm font-bold mb-2">Printer:</h3>
                <select className="w-full px-2 py-1 border border-[#404040] bg-white text-sm">
                  <option>HP LaserJet 4 (Default Printer)</option>
                  <option>Generic / Text Only</option>
                </select>
              </div>

              <div className="mb-4">
                <h3 className="text-sm font-bold mb-2">Print range:</h3>
                <div className="flex items-center mb-1">
                  <input type="radio" name="printRange" id="all" defaultChecked className="mr-2" />
                  <label htmlFor="all" className="text-sm">
                    All
                  </label>
                </div>
                <div className="flex items-center">
                  <input type="radio" name="printRange" id="selection" className="mr-2" />
                  <label htmlFor="selection" className="text-sm">
                    Selection
                  </label>
                </div>
              </div>

              <div className="mb-4">
                <h3 className="text-sm font-bold mb-2">Number of copies:</h3>
                <input
                  type="number"
                  min="1"
                  defaultValue="1"
                  className="w-16 px-2 py-1 border border-[#404040] bg-white text-sm"
                />
              </div>

              <div className="flex justify-end space-x-2 mt-4">
                <button
                  className="px-3 py-1 border-2 border-t-[#ffffff] border-l-[#ffffff] border-r-[#404040] border-b-[#404040] text-sm"
                  onClick={executePrint}
                >
                  Print
                </button>
                <button
                  className="px-3 py-1 border-2 border-t-[#ffffff] border-l-[#ffffff] border-r-[#404040] border-b-[#404040] text-sm"
                  onClick={() => setShowPrintDialog(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Go To Line dialog */}
      {showGoToLine && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="fixed inset-0 bg-black opacity-30" onClick={() => setShowGoToLine(false)}></div>
          <div className="w-72 bg-[#c0c0c0] border-2 border-t-[#ffffff] border-l-[#ffffff] border-r-[#404040] border-b-[#404040] z-10 shadow-md">
            <div className="bg-[#000080] text-white px-2 py-1 flex justify-between items-center">
              <span className="text-sm font-bold">Go To Line</span>
              <button className="text-white text-sm focus:outline-none" onClick={() => setShowGoToLine(false)}>
                ✕
              </button>
            </div>
            <div className="p-4">
              <div className="mb-4">
                <label htmlFor="lineNumber" className="text-sm block mb-1">
                  Line number:
                </label>
                <input
                  type="number"
                  id="lineNumber"
                  min="1"
                  value={goToLineNumber}
                  onChange={(e) => setGoToLineNumber(e.target.value)}
                  className="w-full px-2 py-1 border border-[#404040] bg-white text-sm"
                />
              </div>

              <div className="flex justify-end space-x-2 mt-4">
                <button
                  className="px-3 py-1 border-2 border-t-[#ffffff] border-l-[#ffffff] border-r-[#404040] border-b-[#404040] text-sm"
                  onClick={executeGoToLine}
                >
                  Go To
                </button>
                <button
                  className="px-3 py-1 border-2 border-t-[#ffffff] border-l-[#ffffff] border-r-[#404040] border-b-[#404040] text-sm"
                  onClick={() => setShowGoToLine(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Improved search dialog */}
      {showSearch && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="fixed inset-0 bg-black opacity-30" onClick={() => setShowSearch(false)}></div>
          <div className="w-96 bg-[#c0c0c0] border-2 border-t-[#ffffff] border-l-[#ffffff] border-r-[#404040] border-b-[#404040] z-10 shadow-md">
            <div className="bg-[#000080] text-white px-2 py-1 flex justify-between items-center">
              <span className="text-sm font-bold">Find</span>
              <button className="text-white text-sm focus:outline-none" onClick={() => setShowSearch(false)}>
                ✕
              </button>
            </div>
            <div className="p-4">
              <div className="mb-4">
                <label htmlFor="searchTerm" className="text-sm block mb-1">
                  Find what:
                </label>
                <div className="flex">
                  <input
                    type="text"
                    id="searchTerm"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="flex-1 px-2 py-1 border border-[#404040] bg-white text-sm"
                  />
                </div>
              </div>

              <div className="mb-4 flex items-center">
                <input
                  type="checkbox"
                  id="caseSensitive"
                  checked={caseSensitiveSearch}
                  onChange={(e) => setCaseSensitiveSearch(e.target.checked)}
                  className="mr-2"
                />
                <label htmlFor="caseSensitive" className="text-sm">
                  Match case
                </label>
              </div>

              <div className="flex justify-end space-x-2 mt-4">
                <button
                  className="px-3 py-1 border-2 border-t-[#ffffff] border-l-[#ffffff] border-r-[#404040] border-b-[#404040] text-sm"
                  onClick={performSearch}
                >
                  Find Next
                </button>
                <button
                  className="px-3 py-1 border-2 border-t-[#ffffff] border-l-[#ffffff] border-r-[#404040] border-b-[#404040] text-sm"
                  onClick={() => setShowSearch(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Replace dialog */}
      {showReplace && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="fixed inset-0 bg-black opacity-30" onClick={() => setShowReplace(false)}></div>
          <div className="w-96 bg-[#c0c0c0] border-2 border-t-[#ffffff] border-l-[#ffffff] border-r-[#404040] border-b-[#404040] z-10 shadow-md">
            <div className="bg-[#000080] text-white px-2 py-1 flex justify-between items-center">
              <span className="text-sm font-bold">Replace</span>
              <button className="text-white text-sm focus:outline-none" onClick={() => setShowReplace(false)}>
                ✕
              </button>
            </div>
            <div className="p-4">
              <div className="mb-4">
                <label htmlFor="searchTermReplace" className="text-sm block mb-1">
                  Find what:
                </label>
                <input
                  type="text"
                  id="searchTermReplace"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-2 py-1 border border-[#404040] bg-white text-sm"
                />
              </div>

              <div className="mb-4">
                <label htmlFor="replaceTerm" className="text-sm block mb-1">
                  Replace with:
                </label>
                <input
                  type="text"
                  id="replaceTerm"
                  value={replaceTerm}
                  onChange={(e) => setReplaceTerm(e.target.value)}
                  className="w-full px-2 py-1 border border-[#404040] bg-white text-sm"
                />
              </div>

              <div className="mb-4 flex items-center">
                <input
                  type="checkbox"
                  id="caseSensitiveReplace"
                  checked={caseSensitiveSearch}
                  onChange={(e) => setCaseSensitiveSearch(e.target.checked)}
                  className="mr-2"
                />
                <label htmlFor="caseSensitiveReplace" className="text-sm">
                  Match case
                </label>
              </div>

              <div className="flex justify-end space-x-2 mt-4">
                <button
                  className="px-3 py-1 border-2 border-t-[#ffffff] border-l-[#ffffff] border-r-[#404040] border-b-[#404040] text-sm"
                  onClick={performSearch}
                >
                  Find Next
                </button>
                <button
                  className="px-3 py-1 border-2 border-t-[#ffffff] border-l-[#ffffff] border-r-[#404040] border-b-[#404040] text-sm"
                  onClick={() => {
                    if (currentHit !== -1) {
                      // Replace current instance
                      const newText =
                        text.substring(0, searchHits[currentHit]) +
                        replaceTerm +
                        text.substring(searchHits[currentHit] + searchTerm.length);

                      setText(newText);
                      setModified(true);

                      // Re-do search to update hits after replacing
                      setTimeout(performSearch, 0);
                    }
                  }}
                >
                  Replace
                </button>
                <button
                  className="px-3 py-1 border-2 border-t-[#ffffff] border-l-[#ffffff] border-r-[#404040] border-b-[#404040] text-sm"
                  onClick={() => {
                    // Replace all instances
                    let newText = text;
                    let count = 0;

                    if (caseSensitiveSearch) {
                      while (newText.includes(searchTerm)) {
                        newText = newText.replace(searchTerm, replaceTerm);
                        count++;
                      }
                    } else {
                      const regex = new RegExp(searchTerm.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi");
                      const matches = newText.match(regex);
                      count = matches ? matches.length : 0;
                      newText = newText.replace(regex, replaceTerm);
                    }

                    setText(newText);
                    setModified(true);
                    setStatusMessage(`Replaced ${count} occurrence${count !== 1 ? "s" : ""}`);
                    setSearchHits([]);
                    setCurrentHit(-1);
                  }}
                >
                  Replace All
                </button>
                <button
                  className="px-3 py-1 border-2 border-t-[#ffffff] border-l-[#ffffff] border-r-[#404040] border-b-[#404040] text-sm"
                  onClick={() => setShowReplace(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 p-1 bg-white">
        <textarea
          className={`w-full h-full resize-none outline-none border-none p-1 font-mono text-black ${
            wordWrap ? "" : "whitespace-pre"
          }`}
          value={text}
          onChange={handleTextChange}
          onKeyDown={handleKeyDown}
          ref={textareaRef}
        />
      </div>
    </div>
  );
};

export default Notepad;
