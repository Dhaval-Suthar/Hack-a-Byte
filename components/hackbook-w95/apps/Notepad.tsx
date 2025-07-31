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
  const [showPrintDialog, setShowPrintDialog] = useState(false);
  const [caseSensitiveSearch, setCaseSensitiveSearch] = useState(false);
  const [showGoToLine, setShowGoToLine] = useState(false);
  const [goToLineNumber, setGoToLineNumber] = useState("");
  const [showOpenDialog, setShowOpenDialog] = useState(false);
  const [availableFiles, setAvailableFiles] = useState<string[]>([]);
  const [selectedFile, setSelectedFile] = useState("");
  const [showSaveAsDialog, setShowSaveAsDialog] = useState(false);
  const [saveAsFileName, setSaveAsFileName] = useState("");
  const [showFontDialog, setShowFontDialog] = useState(false);
  const [fontSize, setFontSize] = useState(16);
  const [fontFamily, setFontFamily] = useState("Times New Roman");
  const [fontStyle, setFontStyle] = useState("normal");
  const [fontWeight, setFontWeight] = useState("normal");
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
          const savedText = UserPreferences.getAppData(`notepad_${filePath}`, null) as string | null;
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
      saveFile();
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

  // Save the current file
  const saveFile = async () => {
    try {
      const { UserPreferences } = await import("../hooks/useUserPreferences");
      
      if (filePath) {
        // Save existing file
        UserPreferences.setAppData(`notepad_${filePath}`, text);
        setStatusMessage(`File saved: ${filePath}`);
        setModified(false);
      } else {
        // No file path exists, create a new file with timestamp
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
        const newFileName = `Document-${timestamp}.txt`;
        
        UserPreferences.setAppData(`notepad_${newFileName}`, text);
        setStatusMessage(`File saved as: ${newFileName}`);
        setModified(false);
      }
    } catch (error) {
      console.error("Error saving file:", error);
      setStatusMessage("Error saving file");
    }
  };

  // Toggle word wrap
  const toggleWordWrap = () => {
    setWordWrap(!wordWrap);
  };

  // Handle opening files
  const handleOpenFile = () => {
    setShowOpenDialog(true);
    loadAvailableFiles();
  };

  // Handle creating a new file
  const handleNewFile = async () => {
    try {
      const { UserPreferences } = await import("../hooks/useUserPreferences");
      
      // Generate a unique filename
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      const newFileName = `Untitled-${timestamp}.txt`;
      
      // Set default content for new file
      const newFileContent = `New Document\n\nCreated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}\n\nStart typing here...`;
      
      // Save the new file content
      UserPreferences.setAppData(`notepad_${newFileName}`, newFileContent);
      
      // Update current document
      setText(newFileContent);
      setModified(false);
      setStatusMessage(`New file created: ${newFileName}`);
      
      // Clear any search state
      setSearchHits([]);
      setCurrentHit(-1);
      setSearchTerm("");
      setReplaceTerm("");
      
    } catch (error) {
      console.error("Error creating new file:", error);
      setStatusMessage("Error creating new file");
      
      // Fallback to simple new document
      setText(defaultText);
      setModified(false);
      setStatusMessage("New document created");
    }
  };

  // Handle Save As functionality
  const handleSaveAs = () => {
    setShowSaveAsDialog(true);
    // Pre-fill with a suggested filename based on current content or timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    setSaveAsFileName(`Document-${timestamp}.txt`);
  };

  // Execute Save As
  const executeSaveAs = async () => {
    if (!saveAsFileName.trim()) {
      setStatusMessage("Please enter a valid filename");
      return;
    }

    let filename = saveAsFileName.trim();
    
    // Add .txt extension if not present
    if (!filename.toLowerCase().endsWith('.txt')) {
      filename += '.txt';
    }

    try {
      const { UserPreferences } = await import("../hooks/useUserPreferences");
      
      // Save the content with the new filename
      UserPreferences.setAppData(`notepad_${filename}`, text);
      
      setStatusMessage(`File saved as: ${filename}`);
      setModified(false);
      setShowSaveAsDialog(false);
      setSaveAsFileName("");
      
      // Update window title to reflect new filename
      // Note: In a real implementation, you might want to update the filePath prop
      
    } catch (error) {
      console.error("Error saving file as:", error);
      setStatusMessage(`Error saving file as: ${filename}`);
    }
  };

  // Load available files from user preferences
  const loadAvailableFiles = async () => {
    try {
      const { UserPreferences } = await import("../hooks/useUserPreferences");
      const allKeys = Object.keys(localStorage).filter(key => key.startsWith('notepad_'));
      const files = allKeys.map(key => key.replace('notepad_', ''));
      
      // Add some default sample files
      const sampleFiles = [
        "Welcome.txt",
        "README.txt", 
        "Notes.txt",
        "Document.txt"
      ];
      
      const allFiles = [...new Set([...files, ...sampleFiles])];
      setAvailableFiles(allFiles);
    } catch (error) {
      console.error("Error loading available files:", error);
      setAvailableFiles(["Welcome.txt", "README.txt", "Notes.txt", "Document.txt"]);
    }
  };

  // Open selected file
  const openSelectedFile = async () => {
    if (!selectedFile) {
      setStatusMessage("Please select a file to open");
      return;
    }

    try {
      const { UserPreferences } = await import("../hooks/useUserPreferences");
      
      // Try to load saved content first
      const savedContent = UserPreferences.getAppData(`notepad_${selectedFile}`, null) as string | null;
      
      if (savedContent !== null) {
        setText(savedContent);
        setStatusMessage(`Opened: ${selectedFile}`);
      } else {
        // Load default content based on filename
        let defaultContent = "";
        
        switch (selectedFile) {
          case "Welcome.txt":
            defaultContent = defaultText;
            break;
          case "README.txt":
            defaultContent = "README\n\nThis is a sample README file.\n\nYou can edit this text and save your changes.\n\nNotepad Features:\n- Cut, Copy, Paste\n- Find and Replace\n- Word Wrap\n- Print functionality\n- Go to Line\n- Time/Date insertion";
            break;
          case "Notes.txt":
            defaultContent = "My Notes\n\n" + new Date().toLocaleDateString() + "\n\n- Remember to save important documents\n- Use Ctrl+F to find text\n- Use Ctrl+S to save\n- Use Ctrl+H for find and replace\n\nEnd of notes.";
            break;
          case "Document.txt":
            defaultContent = "Document\n\nThis is a new document created in Notepad.\n\nYou can type your content here and save it for later use.\n\nFeatures available:\n• Text editing\n• Search functionality\n• Replace text\n• Print document\n• Time and date insertion";
            break;
          default:
            defaultContent = `Contents of ${selectedFile}\n\nThis file was created in Notepad.\n\nYou can edit this content and save your changes.`;
        }
        
        setText(defaultContent);
        setStatusMessage(`Opened: ${selectedFile}`);
        
        // Save the default content
        UserPreferences.setAppData(`notepad_${selectedFile}`, defaultContent);
      }
      
      setModified(false);
      setShowOpenDialog(false);
      setSelectedFile("");
      
    } catch (error) {
      console.error("Error opening file:", error);
      setStatusMessage(`Error opening file: ${selectedFile}`);
    }
  };

  // Menu handling
  const handleMenuClick = (menu: string) => {
    setShowMenu(menu === showMenu ? null : menu);
  };

  // Font functionality
  const handleFontDialog = () => {
    setShowFontDialog(true);
  };

  const applyFont = () => {
    setShowFontDialog(false);
    setStatusMessage(`Font changed to ${fontFamily}, ${fontSize}px`);
  };

  return (
    <div className="w-full h-full flex flex-col bg-[#c0c0c0]">
      {/* Menu bar */}
      <div className="w-full flex text-sm items-center bg-[#c0c0c0] border-b border-b-[#808080] p-0.5">
        {["File", "Edit", "Format"].map((menu) => (
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
            <div 
              className="px-3 py-1 hover:bg-[#000080] hover:text-white cursor-pointer text-sm"
              onClick={() => {
                handleNewFile();
                setShowMenu(null);
              }}
            >
              New
            </div>
            <div 
              className="px-3 py-1 hover:bg-[#000080] hover:text-white cursor-pointer text-sm"
              onClick={() => {
                handleOpenFile();
                setShowMenu(null);
              }}
            >
              Open...
            </div>
            <div 
              className="px-3 py-1 hover:bg-[#000080] hover:text-white cursor-pointer text-sm" 
              onClick={() => {
                saveFile();
                setShowMenu(null);
              }}
            >
              Save
            </div>
            <div 
              className="px-3 py-1 hover:bg-[#000080] hover:text-white cursor-pointer text-sm"
              onClick={() => {
                handleSaveAs();
                setShowMenu(null);
              }}
            >
              Save As...
            </div>
            <div className="border-t border-t-[#808080] my-1"></div>
            <div 
              className="px-3 py-1 hover:bg-[#000080] hover:text-white cursor-pointer text-sm" 
              onClick={() => {
                handlePrint();
                setShowMenu(null);
              }}
            >
              Print...
            </div>
            <div className="border-t border-t-[#808080] my-1"></div>
            <div 
              className="px-3 py-1 hover:bg-[#000080] hover:text-white cursor-pointer text-sm" 
              onClick={() => setShowMenu(null)}
            >
              Close
            </div>
          </div>
        )}

        {/* Edit menu dropdown */}
        {showMenu === "Edit" && (
          <div className="absolute left-8 top-5 mt-1 w-48 border-2 border-t-[#808080] border-l-[#808080] border-r-[#ffffff] border-b-[#ffffff] bg-[#c0c0c0] z-50">
            <div 
              className="px-3 py-1 hover:bg-[#000080] hover:text-white cursor-pointer text-sm"
              onClick={() => {
                setStatusMessage("Undo functionality not implemented");
                setShowMenu(null);
              }}
            >
              Undo
            </div>
            <div className="border-t border-t-[#808080] my-1"></div>
            <div 
              className="px-3 py-1 hover:bg-[#000080] hover:text-white cursor-pointer text-sm"
              onClick={() => {
                if (textareaRef.current) {
                  textareaRef.current.focus();
                  document.execCommand('cut');
                  setStatusMessage("Text cut to clipboard");
                }
                setShowMenu(null);
              }}
            >
              Cut
            </div>
            <div 
              className="px-3 py-1 hover:bg-[#000080] hover:text-white cursor-pointer text-sm"
              onClick={() => {
                if (textareaRef.current) {
                  textareaRef.current.focus();
                  document.execCommand('copy');
                  setStatusMessage("Text copied to clipboard");
                }
                setShowMenu(null);
              }}
            >
              Copy
            </div>
            <div 
              className="px-3 py-1 hover:bg-[#000080] hover:text-white cursor-pointer text-sm"
              onClick={() => {
                if (textareaRef.current) {
                  textareaRef.current.focus();
                  document.execCommand('paste');
                  setStatusMessage("Text pasted from clipboard");
                }
                setShowMenu(null);
              }}
            >
              Paste
            </div>
            <div 
              className="px-3 py-1 hover:bg-[#000080] hover:text-white cursor-pointer text-sm"
              onClick={() => {
                if (textareaRef.current) {
                  const start = textareaRef.current.selectionStart;
                  const end = textareaRef.current.selectionEnd;
                  if (start !== end) {
                    const newText = text.substring(0, start) + text.substring(end);
                    setText(newText);
                    setModified(true);
                    setStatusMessage("Selected text deleted");
                  }
                }
                setShowMenu(null);
              }}
            >
              Delete
            </div>
            <div className="border-t border-t-[#808080] my-1"></div>
            <div
              className="px-3 py-1 hover:bg-[#000080] hover:text-white cursor-pointer text-sm"
              onClick={() => {
                setShowSearch(true);
                setShowMenu(null);
              }}
            >
              Find...
            </div>
            <div 
              className="px-3 py-1 hover:bg-[#000080] hover:text-white cursor-pointer text-sm" 
              onClick={() => {
                findNext();
                setShowMenu(null);
              }}
            >
              Find Next
            </div>
            <div
              className="px-3 py-1 hover:bg-[#000080] hover:text-white cursor-pointer text-sm"
              onClick={() => {
                findPrevious();
                setShowMenu(null);
              }}
            >
              Find Previous
            </div>
            <div
              className="px-3 py-1 hover:bg-[#000080] hover:text-white cursor-pointer text-sm"
              onClick={() => {
                setShowReplace(true);
                setShowMenu(null);
              }}
            >
              Replace...
            </div>
            <div
              className="px-3 py-1 hover:bg-[#000080] hover:text-white cursor-pointer text-sm"
              onClick={() => {
                handleGoToLine();
                setShowMenu(null);
              }}
            >
              Go To Line...
            </div>
            <div
              className="px-3 py-1 hover:bg-[#000080] hover:text-white cursor-pointer text-sm"
              onClick={() => {
                setShowSearch(true);
                setShowReplace(true);
                setShowMenu(null);
              }}
            >
              Replace...
            </div>
            <div className="border-t border-t-[#808080] my-1"></div>
            <div 
              className="px-3 py-1 hover:bg-[#000080] hover:text-white cursor-pointer text-sm"
              onClick={() => {
                if (textareaRef.current) {
                  textareaRef.current.select();
                  setStatusMessage("All text selected");
                }
                setShowMenu(null);
              }}
            >
              Select All
            </div>
            <div 
              className="px-3 py-1 hover:bg-[#000080] hover:text-white cursor-pointer text-sm"
              onClick={() => {
                const now = new Date();
                const timeDate = now.toLocaleString();
                const textarea = textareaRef.current;
                if (textarea) {
                  const start = textarea.selectionStart;
                  const newText = text.substring(0, start) + timeDate + text.substring(start);
                  setText(newText);
                  setModified(true);
                  setStatusMessage("Time/Date inserted");
                }
                setShowMenu(null);
              }}
            >
              Time/Date
            </div>
            <div className="border-t border-t-[#808080] my-1"></div>
            <div 
              className="px-3 py-1 hover:bg-[#000080] hover:text-white cursor-pointer text-sm" 
              onClick={() => setShowMenu(null)}
            >
              Close
            </div>
          </div>
        )}

        {/* Format menu dropdown */}
        {showMenu === "Format" && (
          <div className="absolute left-16 top-5 mt-1 w-48 border-2 border-t-[#808080] border-l-[#808080] border-r-[#ffffff] border-b-[#ffffff] bg-[#c0c0c0] z-50">
            <div
              className="px-3 py-1 hover:bg-[#000080] hover:text-white cursor-pointer text-sm flex items-center"
              onClick={() => {
                toggleWordWrap();
                setShowMenu(null);
              }}
            >
              <span className="mr-2 w-4">{wordWrap ? "✓" : ""}</span>
              Word Wrap
            </div>
            <div 
              className="px-3 py-1 hover:bg-[#000080] hover:text-white cursor-pointer text-sm"
              onClick={() => {
                handleFontDialog();
                setShowMenu(null);
              }}
            >
              Font...
            </div>
            <div className="border-t border-t-[#808080] my-1"></div>
            <div 
              className="px-3 py-1 hover:bg-[#000080] hover:text-white cursor-pointer text-sm" 
              onClick={() => setShowMenu(null)}
            >
              Close
            </div>
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

      {/* Open File dialog */}
      {showOpenDialog && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="fixed inset-0 bg-black opacity-30" onClick={() => setShowOpenDialog(false)}></div>
          <div className="w-96 bg-[#c0c0c0] border-2 border-t-[#ffffff] border-l-[#ffffff] border-r-[#404040] border-b-[#404040] z-10 shadow-md">
            <div className="bg-[#000080] text-white px-2 py-1 flex justify-between items-center">
              <span className="text-sm font-bold">Open</span>
              <button className="text-white text-sm focus:outline-none" onClick={() => setShowOpenDialog(false)}>
                ✕
              </button>
            </div>
            <div className="p-4">
              <div className="mb-4">
                <label className="text-sm block mb-1">File name:</label>
                <select 
                  value={selectedFile}
                  onChange={(e) => setSelectedFile(e.target.value)}
                  className="w-full px-2 py-1 border border-[#404040] bg-white text-sm"
                >
                  <option value="">Select a file...</option>
                  {availableFiles.map((file) => (
                    <option key={file} value={file}>
                      {file}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mb-4">
                <label className="text-sm block mb-1">Files of type:</label>
                <select className="w-full px-2 py-1 border border-[#404040] bg-white text-sm">
                  <option>Text Documents (*.txt)</option>
                  <option>All Files (*.*)</option>
                </select>
              </div>

              <div className="flex justify-end space-x-2 mt-4">
                <button
                  className="px-3 py-1 border-2 border-t-[#ffffff] border-l-[#ffffff] border-r-[#404040] border-b-[#404040] text-sm"
                  onClick={openSelectedFile}
                >
                  Open
                </button>
                <button
                  className="px-3 py-1 border-2 border-t-[#ffffff] border-l-[#ffffff] border-r-[#404040] border-b-[#404040] text-sm"
                  onClick={() => {
                    setShowOpenDialog(false);
                    setSelectedFile("");
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Save As dialog */}
      {showSaveAsDialog && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="fixed inset-0 bg-black opacity-30" onClick={() => setShowSaveAsDialog(false)}></div>
          <div className="w-96 bg-[#c0c0c0] border-2 border-t-[#ffffff] border-l-[#ffffff] border-r-[#404040] border-b-[#404040] z-10 shadow-md">
            <div className="bg-[#000080] text-white px-2 py-1 flex justify-between items-center">
              <span className="text-sm font-bold">Save As</span>
              <button className="text-white text-sm focus:outline-none" onClick={() => setShowSaveAsDialog(false)}>
                ✕
              </button>
            </div>
            <div className="p-4">
              <div className="mb-4">
                <label className="text-sm block mb-1">File name:</label>
                <input
                  type="text"
                  value={saveAsFileName}
                  onChange={(e) => setSaveAsFileName(e.target.value)}
                  className="w-full px-2 py-1 border border-[#404040] bg-white text-sm"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      executeSaveAs();
                    }
                  }}
                />
              </div>

              <div className="mb-4">
                <label className="text-sm block mb-1">Save as type:</label>
                <select className="w-full px-2 py-1 border border-[#404040] bg-white text-sm">
                  <option>Text Documents (*.txt)</option>
                  <option>All Files (*.*)</option>
                </select>
              </div>

              <div className="flex justify-end space-x-2 mt-4">
                <button
                  className="px-3 py-1 border-2 border-t-[#ffffff] border-l-[#ffffff] border-r-[#404040] border-b-[#404040] text-sm"
                  onClick={executeSaveAs}
                >
                  Save
                </button>
                <button
                  className="px-3 py-1 border-2 border-t-[#ffffff] border-l-[#ffffff] border-r-[#404040] border-b-[#404040] text-sm"
                  onClick={() => {
                    setShowSaveAsDialog(false);
                    setSaveAsFileName("");
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Font dialog */}
      {showFontDialog && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="fixed inset-0 bg-black opacity-30" onClick={() => setShowFontDialog(false)}></div>
          <div className="w-96 bg-[#c0c0c0] border-2 border-t-[#ffffff] border-l-[#ffffff] border-r-[#404040] border-b-[#404040] z-10 shadow-md">
            <div className="bg-[#000080] text-white px-2 py-1 flex justify-between items-center">
              <span className="text-sm font-bold">Font</span>
              <button className="text-white text-sm focus:outline-none" onClick={() => setShowFontDialog(false)}>
                ✕
              </button>
            </div>
            <div className="p-4">
              <div className="mb-4">
                <label className="text-sm block mb-1">Font:</label>
                <select 
                  value={fontFamily}
                  onChange={(e) => setFontFamily(e.target.value)}
                  className="w-full px-2 py-1 border border-[#404040] bg-white text-sm"
                >
                  <option value="Courier New">Courier New</option>
                  <option value="Arial">Arial</option>
                  <option value="Times New Roman">Times New Roman</option>
                  <option value="Verdana">Verdana</option>
                  <option value="Georgia">Georgia</option>
                  <option value="Trebuchet MS">Trebuchet MS</option>
                  <option value="Comic Sans MS">Comic Sans MS</option>
                  <option value="Impact">Impact</option>
                  <option value="Lucida Console">Lucida Console</option>
                  <option value="Monaco">Monaco</option>
                </select>
              </div>

              <div className="mb-4">
                <label className="text-sm block mb-1">Font style:</label>
                <select 
                  value={`${fontWeight}-${fontStyle}`}
                  onChange={(e) => {
                    const [weight, style] = e.target.value.split('-');
                    setFontWeight(weight);
                    setFontStyle(style);
                  }}
                  className="w-full px-2 py-1 border border-[#404040] bg-white text-sm"
                >
                  <option value="normal-normal">Regular</option>
                  <option value="normal-italic">Italic</option>
                  <option value="bold-normal">Bold</option>
                  <option value="bold-italic">Bold Italic</option>
                </select>
              </div>

              <div className="mb-4">
                <label className="text-sm block mb-1">Size:</label>
                <select 
                  value={fontSize}
                  onChange={(e) => setFontSize(parseInt(e.target.value))}
                  className="w-full px-2 py-1 border border-[#404040] bg-white text-sm"
                >
                  <option value="8">8</option>
                  <option value="9">9</option>
                  <option value="10">10</option>
                  <option value="11">11</option>
                  <option value="12">12</option>
                  <option value="14">14</option>
                  <option value="16">16</option>
                  <option value="18">18</option>
                  <option value="20">20</option>
                  <option value="22">22</option>
                  <option value="24">24</option>
                  <option value="26">26</option>
                  <option value="28">28</option>
                  <option value="36">36</option>
                  <option value="48">48</option>
                  <option value="72">72</option>
                </select>
              </div>

              <div className="mb-4">
                <label className="text-sm block mb-1">Sample:</label>
                <div 
                  className="w-full px-2 py-3 border border-[#404040] bg-white text-sm min-h-[60px] flex items-center"
                  style={{
                    fontFamily: fontFamily,
                    fontSize: `${fontSize}px`,
                    fontStyle: fontStyle,
                    fontWeight: fontWeight
                  }}
                >
                  AaBbYyZz
                </div>
              </div>

              <div className="flex justify-end space-x-2 mt-4">
                <button
                  className="px-3 py-1 border-2 border-t-[#ffffff] border-l-[#ffffff] border-r-[#404040] border-b-[#404040] text-sm"
                  onClick={applyFont}
                >
                  OK
                </button>
                <button
                  className="px-3 py-1 border-2 border-t-[#ffffff] border-l-[#ffffff] border-r-[#404040] border-b-[#404040] text-sm"
                  onClick={() => setShowFontDialog(false)}
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
          style={{
            fontFamily: fontFamily,
            fontSize: `${fontSize}px`,
            fontStyle: fontStyle,
            fontWeight: fontWeight
          }}
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
