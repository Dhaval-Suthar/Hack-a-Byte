"use client";

import React, { useState, useCallback, useEffect, useRef } from "react";
import Image from "next/image";
import clsx from "clsx";
import useFileSystem, { FileSystemItem } from "@/components/hackbook-w95/hooks/useFileSystem";

interface MyComputerProps {
  onClose: () => void;
}

const MyComputer: React.FC<MyComputerProps> = ({ onClose }) => {
  // Initialize file system with debug mode disabled to prevent excessive logging
  const fs = useFileSystem({ debug: false });
  const [selectedItem, setSelectedItem] = useState<FileSystemItem | null>(null);
  const [viewMode, setViewMode] = useState<'icons' | 'details' | 'list' | 'smallIcons'>('details');
  const [showHiddenFiles, setShowHiddenFiles] = useState<boolean>(false);
  const [showContextMenu, setShowContextMenu] = useState<boolean>(false);
  const [contextMenuPos, setContextMenuPos] = useState({ x: 0, y: 0 });
  const [isViewMenuOpen, setIsViewMenuOpen] = useState(false);
  const [isFileMenuOpen, setIsFileMenuOpen] = useState(false);
  const [isEditMenuOpen, setIsEditMenuOpen] = useState(false);
  const [showRootView, setShowRootView] = useState<boolean>(fs.currentDirectory === '' || fs.currentDirectory === null);
  const [statusMessage, setStatusMessage] = useState<string>('');
  // These states are now managed directly in the handleCreateNewFolder function
  // so we don't need separate state variables
  const [clipboard, setClipboard] = useState<{
    items: FileSystemItem[];
    operation: 'cut' | 'copy' | null;
  }>({ items: [], operation: null });
  const [pathParts, setPathParts] = useState<{ name: string; path: string }[]>([]);
  const contentRef = useRef<HTMLDivElement>(null);

  // Load hidden files setting from user-specific storage
  useEffect(() => {
    const loadHiddenFilesSetting = async () => {
      try {
        const { userStorage } = await import('@/components/hackbook-w95/hooks/useUserStorage');
        const showHidden = userStorage.getItem('showHiddenFiles', false) as boolean;
        setShowHiddenFiles(showHidden === true);
      } catch (error) {
        console.error('Error loading hidden files setting:', error);
      }
    };
    
    loadHiddenFilesSetting();
  }, []);
  
  // Get icon for file or folder based on type and extension
  const getIcon = useCallback((item: FileSystemItem) => {
    if (item.type === 'directory') {
      if (item.path === 'C:' || item.path === 'D:') {
        return '/hackbook-W95/hard-disk.png';
      }
      return '/hackbook-W95/file.png';
    }
    
    // Check file extension
    const extension = item.name.split('.').pop()?.toLowerCase();
    
    switch (extension) {
      case 'txt':
        return '/hackbook-W95/file-icons/txt-file-symbol.png';
      case 'exe':
        return '/hackbook-w95/file-icons/application.png';
      case 'zip':
      case 'rar':
      case '7z':
      case 'tar':
      case 'gz':
        return '/hackbook-W95/file-icons/archive.png';
      case 'jpg':
      case 'png':
      case 'gif':
      case 'bmp':
        return '/hackbook-w95/file-icons/image.png';
      default:
        return '/hackbook-w95/file-icons/unknown.png';
    }
  }, []);

  // Format file size in KB
  const formatSize = (bytes?: number): string => {
    if (bytes === undefined) return '';
    return `${Math.ceil(bytes / 1024).toLocaleString()} KB`;
  };

  // Format date
  const formatDate = (date?: Date): string => {
    if (!date) return '';
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Handle double click on an item
  const handleDoubleClick = useCallback((item: FileSystemItem) => {
    if (item.type === 'directory') {
      setStatusMessage(`Opening: ${item.name}`);
      
      // Handle navigation to drives specifically
      if (item.path === 'C:' || item.path === 'D:') {
        // For drive navigation, always set showRootView to false first to ensure we see contents
        setShowRootView(false);
        // Short timeout to ensure state update happens before navigation
        setTimeout(() => {
          fs.navigateTo(item.path);
        }, 0);
      } else {
        fs.navigateTo(item.path);
      }
    } else if (item.type === 'file') {
      setStatusMessage(`Opening: ${item.name}`);
      
      // Handle different file types
      const extension = item.name.split('.').pop()?.toLowerCase();
      
      // Text files - open in Notepad
      if (extension === 'txt' || extension === 'log' || extension === 'ini' || extension === 'bat') {
        const event = new CustomEvent('win95openfile', {
          detail: {
            path: item.path,
            content: item.content || '',
            extension: 'txt'
          }
        });
        window.dispatchEvent(event);
      }
      // ZIP files - open in ZIP archive viewer
      else if (extension === 'zip') {
        const event = new CustomEvent('win95openfile', {
          detail: {
            path: item.path,
            extension: 'zip',
            isPasswordProtected: item.metadata?.isPasswordProtected,
            password: item.metadata?.password
          }
        });
        window.dispatchEvent(event);
      } else {
        setStatusMessage(`Cannot open this file type`);
      }
    }
  }, [fs, setStatusMessage]);

  // Cut operation
  const handleCut = useCallback(() => {
    if (selectedItem) {
      setClipboard({
        items: [selectedItem],
        operation: 'cut'
      });
      setStatusMessage(`Cut: ${selectedItem.name}`);
    }
  }, [selectedItem]);

  // Copy operation
  const handleCopy = useCallback(() => {
    if (selectedItem) {
      setClipboard({
        items: [selectedItem],
        operation: 'copy'
      });
      setStatusMessage(`Copied: ${selectedItem.name}`);
    }
  }, [selectedItem]);

  // Paste operation
  const handlePaste = useCallback(() => {
    if (clipboard.items.length > 0 && clipboard.operation) {
      const pastingItem = clipboard.items[0];
      
      // Check if item with same name already exists
      const existingItem = fs.getCurrentItems().find(item => item.name === pastingItem.name);
      
      if (existingItem) {
        if (clipboard.operation === 'copy') {
          // Create a copy with a different name
          const newName = `${pastingItem.name} - Copy`;
          fs.createItem(
            newName,
            pastingItem.type,
            pastingItem.type === 'file' ? pastingItem.content || '' : ''
          );
          setStatusMessage(`Pasted as: ${newName}`);
        } else {
          // For cut operation, replace the existing item
          // First delete the existing item
          fs.deleteItems([existingItem]);
          
          // Then create a new one with the same properties
          fs.createItem(
            pastingItem.name,
            pastingItem.type,
            pastingItem.type === 'file' ? pastingItem.content || '' : ''
          );
          
          setClipboard({ items: [], operation: null });
          setStatusMessage(`Moved: ${pastingItem.name}`);
        }
      } else {
        // No conflict, create the item
        fs.createItem(
          pastingItem.name,
          pastingItem.type,
          pastingItem.type === 'file' ? pastingItem.content || '' : ''
        );
        
        if (clipboard.operation === 'cut') {
          // If cutting, clear the clipboard
          setClipboard({ items: [], operation: null });
          setStatusMessage(`Moved: ${pastingItem.name}`);
        } else {
          setStatusMessage(`Copied: ${pastingItem.name}`);
        }
      }
    }
  }, [clipboard, fs]);

  // Delete operation
  const handleDelete = useCallback(() => {
    if (selectedItem) {
      fs.deleteItems([selectedItem]);
      setSelectedItem(null);
      setStatusMessage(`Deleted: ${selectedItem.name}`);
    }
  }, [selectedItem, fs]);

  // Parse path into clickable parts for breadcrumb navigation
  useEffect(() => {
    const parts = [];
    const path = fs.currentDirectory;
    
    // Handle empty path (root view)
    if (!path) {
      parts.push({ name: "My Computer", path: "" });
      setShowRootView(true);
    }
    // For C: or D: drives
    else if (path === 'C:' || path === 'D:') {
      parts.push({ name: "My Computer", path: "" });
      parts.push({ name: path, path: path });
      setShowRootView(false); // Set to false to show the drive contents instead of root view
    } else {
      // Show "My Computer" as root
      parts.push({ name: "My Computer", path: "" });
      
      // Add drive (C: or D:)
      const drive = path.split('\\')[0];
      parts.push({ name: drive, path: drive });
      
      // Add subsequent folders
      const folders = path.split('\\').slice(1);
      let currentPath = drive;
      
      folders.forEach(folder => {
        currentPath = `${currentPath}\\${folder}`;
        parts.push({ name: folder, path: currentPath });
      });
      
      setShowRootView(false);
    }
    
    setPathParts(parts);
  }, [fs.currentDirectory]);

  // Handle right click (context menu)
  const handleRightClick = (e: React.MouseEvent, item: FileSystemItem | null) => {
    e.preventDefault();
    setSelectedItem(item);
    setShowContextMenu(true);
    setContextMenuPos({ x: e.clientX, y: e.clientY });
  };

  // Handle clicking on menu items
  const handleMenuClick = (menu: 'file' | 'edit' | 'view') => {
    if (menu === 'view') {
      setIsViewMenuOpen(!isViewMenuOpen);
      setIsFileMenuOpen(false);
      setIsEditMenuOpen(false);
    } else if (menu === 'file') {
      setIsFileMenuOpen(!isFileMenuOpen);
      setIsViewMenuOpen(false);
      setIsEditMenuOpen(false);
    } else if (menu === 'edit') {
      setIsEditMenuOpen(!isEditMenuOpen);
      setIsViewMenuOpen(false);
      setIsFileMenuOpen(false);
    } else {
      setIsViewMenuOpen(false);
      setIsFileMenuOpen(false);
      setIsEditMenuOpen(false);
    }
  };

  // Handle new folder creation
  const handleCreateNewFolder = () => {
    // Check if a folder with that name already exists
    let counter = 1;
    let folderName = 'New Folder';
    
    while (fs.getCurrentItems().some(item => item.name === folderName)) {
      folderName = `New Folder (${counter})`;
      counter++;
    }
    
    // Create the folder immediately
    const success = fs.createItem(folderName, 'directory');
    
    if (success) {
      setStatusMessage(`Created: ${folderName}`);
      
      // Find the new folder and select it
      setTimeout(() => {
        const newFolder = fs.getCurrentItems().find(item => item.name === folderName);
        if (newFolder) {
          setSelectedItem(newFolder);
        }
      }, 100);
    } else {
      setStatusMessage(`Failed to create folder`);
    }
  };

  // Refresh the view
  const handleRefresh = () => {
    setStatusMessage('Refreshing...');
    // Re-navigate to current path to refresh
    fs.navigateTo(fs.currentDirectory);
    setTimeout(() => setStatusMessage(''), 1000);
  };

  // Close context menu and dropdowns when clicking elsewhere
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      // Keep context menu open if clicking on it
      if (showContextMenu && (e.target as HTMLElement).closest('.context-menu')) {
        return;
      }
      
      setShowContextMenu(false);
      setIsViewMenuOpen(false);
      setIsFileMenuOpen(false);
      setIsEditMenuOpen(false);
    };

    document.addEventListener('mousedown', handleClickOutside);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showContextMenu]);

  // Get the current directory items
  const currentItems = fs.getCurrentItems().filter(item => !item.isHidden || showHiddenFiles);
  
  // Current directory path
  const currentPath = fs.currentDirectory;
  
  // Determine if we can navigate up
  const canNavigateUp = currentPath !== 'C:' && currentPath !== 'D:';
  
  // Update showRootView when we're at the root level with no directory selected
  useEffect(() => {
    if (currentPath === "" || currentPath === null) {
      setShowRootView(true);
    } else if (currentPath === 'C:' || currentPath === 'D:') {
      // Make sure we're not showing root view when looking at drive contents
      setShowRootView(false);
    }
  }, [currentPath]);
  
  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: globalThis.KeyboardEvent) => {
      if (!contentRef.current) return;
      
      // Handle navigation keys
      if (e.key === 'ArrowUp' || e.key === 'ArrowDown' || 
          e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        e.preventDefault();
        
        const currentItems = fs.getCurrentItems().filter(item => !item.isHidden || showHiddenFiles);
        if (currentItems.length === 0) return;
        
        const currentIndex = selectedItem 
          ? currentItems.findIndex(item => item.id === selectedItem.id)
          : -1;
        
        let newIndex = currentIndex;
        
        // Calculate new index based on key and view mode
        if (viewMode === 'details' || viewMode === 'list') {
          // Simple up/down navigation
          if (e.key === 'ArrowUp') {
            newIndex = currentIndex > 0 ? currentIndex - 1 : currentItems.length - 1;
          } else if (e.key === 'ArrowDown') {
            newIndex = currentIndex < currentItems.length - 1 ? currentIndex + 1 : 0;
          }
        } else {
          // Grid-based navigation
          const itemsPerRow = viewMode === 'icons' ? 4 : 6; // 4 for large icons, 6 for small icons
          const row = Math.floor(currentIndex / itemsPerRow);
          const col = currentIndex % itemsPerRow;
          
          if (e.key === 'ArrowUp') {
            const newRow = row > 0 ? row - 1 : Math.floor((currentItems.length - 1) / itemsPerRow);
            newIndex = Math.min(newRow * itemsPerRow + col, currentItems.length - 1);
          } else if (e.key === 'ArrowDown') {
            const newRow = row < Math.floor((currentItems.length - 1) / itemsPerRow) ? row + 1 : 0;
            newIndex = Math.min(newRow * itemsPerRow + col, currentItems.length - 1);
          } else if (e.key === 'ArrowLeft') {
            newIndex = currentIndex > 0 ? currentIndex - 1 : currentItems.length - 1;
          } else if (e.key === 'ArrowRight') {
            newIndex = currentIndex < currentItems.length - 1 ? currentIndex + 1 : 0;
          }
        }
        
        // Set the new selected item
        if (newIndex !== currentIndex) {
          setSelectedItem(currentItems[newIndex]);
        }
      }
      
      // Handle Enter key for opening items
      if (e.key === 'Enter' && selectedItem) {
        handleDoubleClick(selectedItem);
      }
      
      // Handle Backspace for navigating up
      if (e.key === 'Backspace' && fs.currentDirectory !== 'C:' && fs.currentDirectory !== 'D:') {
        fs.navigateUp();
      }
      
      // Handle Delete key for deleting items
      if (e.key === 'Delete' && selectedItem) {
        handleDelete();
      }
      
      // Handle copy, cut, paste with keyboard shortcuts
      if (e.ctrlKey) {
        if (e.key === 'c' && selectedItem) {
          handleCopy();
        } else if (e.key === 'x' && selectedItem) {
          handleCut();
        } else if (e.key === 'v') {
          handlePaste();
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [
    selectedItem, 
    viewMode, 
    showHiddenFiles, 
    fs, 
    handleCopy, 
    handleCut, 
    handleDelete, 
    handleDoubleClick, 
    handlePaste
  ]);

  return (
    <div className="w-full h-full flex flex-col bg-[#c0c0c0] overflow-hidden">
      {/* Menu bar */}
      <div className="w-full flex text-sm border-b border-b-[#808080]">
        <div 
          className={clsx("px-2 py-1 relative", {
            "bg-[#000080] text-white": isFileMenuOpen,
            "hover:bg-[#000080] hover:text-white": !isFileMenuOpen
          })}
          onClick={() => handleMenuClick('file')}
        >
          <span className="cursor-default">File</span>
          
          {/* File menu */}
          {isFileMenuOpen && (
            <div className="absolute top-full left-0 w-48 bg-[#c0c0c0] border-2 border-t-[#ffffff] border-l-[#ffffff] border-r-[#404040] border-b-[#404040] z-10 shadow-md">
              <div 
                className="px-2 py-1 hover:bg-[#000080] hover:text-white"
                onClick={() => {
                  handleCreateNewFolder();
                  setIsFileMenuOpen(false);
                }}
              >
                New Folder
              </div>
              <div 
                className="px-2 py-1 hover:bg-[#000080] hover:text-white" 
                onClick={() => {
                  if (selectedItem && selectedItem.type === 'file') {
                    const event = new CustomEvent('win95openfile', {
                      detail: {
                        path: selectedItem.path,
                        content: selectedItem.content || '',
                        extension: selectedItem.name.split('.').pop()?.toLowerCase()
                      }
                    });
                    window.dispatchEvent(event);
                    setIsFileMenuOpen(false);
                  }
                }}
              >
                Open
              </div>
              <div className="border-t border-t-[#808080] my-1"></div>
              <div 
                className="px-2 py-1 hover:bg-[#000080] hover:text-white"
                onClick={() => handleRefresh()}
              >
                Refresh
              </div>
              <div className="border-t border-t-[#808080] my-1"></div>
              <div 
                className="px-2 py-1 hover:bg-[#000080] hover:text-white" 
                onClick={onClose}
              >
                Close
              </div>
            </div>
          )}
        </div>
        
        <div 
          className={clsx("px-2 py-1 relative", {
            "bg-[#000080] text-white": isEditMenuOpen,
            "hover:bg-[#000080] hover:text-white": !isEditMenuOpen
          })}
          onClick={() => handleMenuClick('edit')}
        >
          <span className="cursor-default">Edit</span>
          
          {/* Edit menu */}
          {isEditMenuOpen && (
            <div className="absolute top-full left-0 w-48 bg-[#c0c0c0] border-2 border-t-[#ffffff] border-l-[#ffffff] border-r-[#404040] border-b-[#404040] z-10 shadow-md">
              <div 
                className={clsx("px-2 py-1 hover:bg-[#000080] hover:text-white", {
                  "text-[#a0a0a0]": !selectedItem
                })}
                onClick={() => {
                  if (selectedItem) {
                    handleCut();
                    setIsEditMenuOpen(false);
                  }
                }}
              >
                Cut
              </div>
              <div 
                className={clsx("px-2 py-1 hover:bg-[#000080] hover:text-white", {
                  "text-[#a0a0a0]": !selectedItem
                })}
                onClick={() => {
                  if (selectedItem) {
                    handleCopy();
                    setIsEditMenuOpen(false);
                  }
                }}
              >
                Copy
              </div>
              <div 
                className={clsx("px-2 py-1 hover:bg-[#000080] hover:text-white", {
                  "text-[#a0a0a0]": clipboard.items.length === 0
                })}
                onClick={() => {
                  if (clipboard.items.length > 0) {
                    handlePaste();
                    setIsEditMenuOpen(false);
                  }
                }}
              >
                Paste
              </div>
              <div className="border-t border-t-[#808080] my-1"></div>
              <div 
                className={clsx("px-2 py-1 hover:bg-[#000080] hover:text-white", {
                  "text-[#a0a0a0]": !selectedItem
                })}
                onClick={() => {
                  if (selectedItem) {
                    handleDelete();
                    setIsEditMenuOpen(false);
                  }
                }}
              >
                Delete
              </div>
              <div className="border-t border-t-[#808080] my-1"></div>
              <div className="px-2 py-1 hover:bg-[#000080] hover:text-white">
                Select All
              </div>
            </div>
          )}
        </div>
        
        <div 
          className={clsx("px-2 py-1 relative", {
            "bg-[#000080] text-white": isViewMenuOpen,
            "hover:bg-[#000080] hover:text-white": !isViewMenuOpen
          })}
          onClick={() => handleMenuClick('view')}
        >
          <span className="cursor-default">View</span>
          
          {/* View menu */}
          {isViewMenuOpen && (
            <div className="absolute top-full left-0 w-48 bg-[#c0c0c0] border-2 border-t-[#ffffff] border-l-[#ffffff] border-r-[#404040] border-b-[#404040] z-10 shadow-md">
              <div 
                className="px-2 py-1 hover:bg-[#000080] hover:text-white" 
                onClick={() => {
                  setViewMode('icons');
                  setIsViewMenuOpen(false);
                }}
              >
                <span className={viewMode === 'icons' ? 'font-bold' : ''}>Large Icons</span>
              </div>
              <div 
                className="px-2 py-1 hover:bg-[#000080] hover:text-white" 
                onClick={() => {
                  setViewMode('smallIcons');
                  setIsViewMenuOpen(false);
                }}
              >
                <span className={viewMode === 'smallIcons' ? 'font-bold' : ''}>Small Icons</span>
              </div>
              <div 
                className="px-2 py-1 hover:bg-[#000080] hover:text-white" 
                onClick={() => {
                  setViewMode('list');
                  setIsViewMenuOpen(false);
                }}
              >
                <span className={viewMode === 'list' ? 'font-bold' : ''}>List</span>
              </div>
              <div 
                className="px-2 py-1 hover:bg-[#000080] hover:text-white" 
                onClick={() => {
                  setViewMode('details');
                  setIsViewMenuOpen(false);
                }}
              >
                <span className={viewMode === 'details' ? 'font-bold' : ''}>Details</span>
              </div>
              <div className="border-t border-t-[#808080] my-1"></div>
              <div 
                className="px-2 py-1 hover:bg-[#000080] hover:text-white flex items-center"
                onClick={() => {
                  const newValue = !showHiddenFiles;
                  setShowHiddenFiles(newValue);
                  
                  // Save to user-specific storage
                  import('@/components/hackbook-w95/hooks/useUserStorage').then(({ userStorage }) => {
                    userStorage.setItem('showHiddenFiles', newValue);
                  });
                  
                  setIsViewMenuOpen(false);
                }}
              >
                <div className="w-4 h-4 border border-[#808080] bg-white mr-2 flex items-center justify-center">
                  {showHiddenFiles && (
                    <div className="w-2 h-2 bg-black"></div>
                  )}
                </div>
                <span>Show Hidden Files</span>
              </div>
              <div className="border-t border-t-[#808080] my-1"></div>
              <div 
                className="px-2 py-1 hover:bg-[#000080] hover:text-white"
                onClick={() => {
                  handleRefresh();
                  setIsViewMenuOpen(false);
                }}
              >
                Refresh
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Toolbar */}
      <div className="w-full flex items-center bg-[#c0c0c0] p-1 border-b border-b-[#808080]">
        {canNavigateUp && (
          <button 
            className="flex items-center mx-1 px-2 py-1 border-2 border-t-[#ffffff] border-l-[#ffffff] border-r-[#404040] border-b-[#404040]"
            onClick={() => fs.navigateUp()}
          >
            <Image 
              src="/hackbook-W95/up-arrow.png" 
              alt="Up" 
              width={16} 
              height={16} 
              className="mr-1" 
              priority
            />
            <span className="text-xs">Up</span>
          </button>
        )}
        
        <div className="w-px h-6 bg-[#808080] mx-2"></div>

        <button 
          className={clsx("h-8 w-8 mx-1 flex justify-center items-center border-2 border-t-[#ffffff] border-l-[#ffffff] border-r-[#404040] border-b-[#404040]", {
            "opacity-50": !selectedItem
          })}
          onClick={() => selectedItem && handleCut()}
          disabled={!selectedItem}
        >
          <Image 
            src="/hackbook-W95/file-icons/cut.png" 
            alt="Cut" 
            width={16} 
            height={16} 
            priority
          />
        </button>
        
        <button 
          className={clsx("h-8 w-8 mx-1 flex justify-center items-center border-2 border-t-[#ffffff] border-l-[#ffffff] border-r-[#404040] border-b-[#404040]", {
            "opacity-50": !selectedItem
          })}
          onClick={() => selectedItem && handleCopy()}
          disabled={!selectedItem}
        >
          <Image 
            src="/hackbook-W95/file-icons/copy.png" 
            alt="Copy" 
            width={16} 
            height={16} 
            priority
          />
        </button>
        
        <button 
          className={clsx("h-8 w-8 mx-1 flex justify-center items-center border-2 border-t-[#ffffff] border-l-[#ffffff] border-r-[#404040] border-b-[#404040]", {
            "opacity-50": clipboard.items.length === 0
          })}
          onClick={() => clipboard.items.length > 0 && handlePaste()}
          disabled={clipboard.items.length === 0}
        >
          <Image 
            src="/hackbook-W95/file-icons/paste.png" 
            alt="Paste" 
            width={16} 
            height={16} 
            priority
          />
        </button>
        
        <div className="w-px h-6 bg-[#808080] mx-2"></div>
        
        <button 
          className="flex items-center mx-1 px-2 py-1 border-2 border-t-[#ffffff] border-l-[#ffffff] border-r-[#404040] border-b-[#404040]"
          onClick={handleCreateNewFolder}
        >
          <Image 
            src="/hackbook-W95/file.png" 
            alt="New Folder" 
            width={30} 
            height={30} 
            className="mr-1" 
            priority
          />
          <span className="text-xs">New Folder</span>
        </button>

        <div className="w-px h-6 bg-[#808080] mx-2"></div>

        <button 
          className={clsx("flex items-center mx-1 px-2 py-1 border-2 border-t-[#ffffff] border-l-[#ffffff] border-r-[#404040] border-b-[#404040]", {
            "opacity-50": !selectedItem
          })}
          onClick={() => selectedItem && handleDelete()}
          disabled={!selectedItem}
        >
          <Image 
            src="/hackbook-W95/file-icons/delete.png" 
            alt="Delete" 
            width={25} 
            height={25} 
            className="mr-1" 
            priority
          />
          <span className="text-xs">Delete</span>
        </button>
      </div>

      {/* Address bar with breadcrumb navigation */}
      <div className="flex items-center p-1 border-b border-b-[#808080] bg-[#c0c0c0]">
        <span className="text-sm mr-2">Address:</span>
        <div className="flex-1 bg-white border-2 border-t-[#808080] border-l-[#808080] border-r-[#ffffff] border-b-[#ffffff] px-2 py-0.5 flex items-center overflow-x-auto">
          {pathParts.map((part, index) => (
            <React.Fragment key={part.path}>
              {index > 0 && <span className="mx-1 text-sm">\</span>}
              <button
                className="text-sm text-blue-800 hover:underline"
                onClick={() => {
                  if (index === 0 && part.name === "My Computer") {
                    // For root/My Computer navigation
                    setShowRootView(true);
                    // Use navigateTo with empty string to go to root
                    fs.navigateTo("");
                  } else if (part.name === "C:" || part.name === "D:") {
                    // For drives, set showRootView to false first, then navigate
                    setShowRootView(false); 
                    // Add a small delay to ensure state updates before navigation
                    setTimeout(() => {
                      fs.navigateTo(part.path);
                    }, 0);
                  } else {
                    fs.navigateTo(part.path);
                  }
                }}
              >
                {part.name}
              </button>
            </React.Fragment>
          ))}
        </div>
      </div>
      
      {/* Main content panel */}
      <div className="flex-1 bg-white overflow-auto p-1" ref={contentRef}>
        {/* Root drives view - only show when showRootView is true */}
        {showRootView && (
          <div className="p-4">
            <h2 className="text-lg font-bold mb-4">My Computer</h2>
            <div className="grid grid-cols-2 gap-4">
              {[
                { name: "C:", description: "Local Disk", path: "C:" },
                { name: "D:", description: "CD-ROM Drive", path: "D:" }
              ].map((drive) => (
                <div 
                  key={drive.path}
                  className={clsx("flex items-center p-2 border border-dotted border-transparent", {
                    "bg-[#000080] text-white border-white": selectedItem?.path === drive.path,
                    "hover:border-[#808080]": selectedItem?.path !== drive.path
                  })}
                  onClick={() => setSelectedItem({
                    id: drive.path,
                    name: drive.name,
                    type: "directory",
                    path: drive.path
                  } as FileSystemItem)}
                  onDoubleClick={() => fs.navigateTo(drive.path)}
                >
                  <div className="mr-4">
                    <Image 
                      src="/hackbook-W95/hard-disk.png" 
                      alt={drive.name} 
                      width={32} 
                      height={32} 
                      priority
                    />
                  </div>
                  <div>
                    <div className="font-bold">{drive.name}</div>
                    <div className="text-sm">{drive.description}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Regular file view */}
        {!showRootView && viewMode === 'details' && (
          <div>
            {/* Header row */}
            <div className="flex border-b border-b-[#808080] bg-[#c0c0c0] text-sm py-1">
              <div className="w-10"></div>
                                <div className="w-1/3 px-1 font-bold">Name</div>
              <div className="w-1/6 px-1 font-bold">Size</div>
              <div className="w-1/6 px-1 font-bold">Type</div>
              <div className="flex-1 px-1 font-bold">Modified</div>
            </div>
            
            {/* Items list */}
            <div>
              {currentItems.map((item) => (
                <div 
                  key={item.id} 
                  className={clsx("flex items-center py-0.5 border-b border-dotted border-b-[#d0d0d0]", {
                    "bg-[#000080] text-white": selectedItem === item,
                    "hover:bg-[#e0e0e0]": selectedItem !== item
                  })}
                  onClick={() => setSelectedItem(item)}
                  onDoubleClick={() => handleDoubleClick(item)}
                  onContextMenu={(e) => handleRightClick(e, item)}
                >
                  <div className="w-10 flex justify-center">
                    <Image 
                      src={getIcon(item)} 
                      alt={item.name} 
                      width={32} 
                      height={32} 
                      priority
                    />
                  </div>
                  <div className="w-1/3 px-1 overflow-hidden text-ellipsis whitespace-nowrap">{item.name}</div>
                  <div className="w-1/6 px-1 text-right">{item.type === 'file' ? formatSize(item.size) : ''}</div>
                  <div className="w-1/6 px-1">{item.type === 'file' ? `File` : 'Folder'}</div>
                  <div className="flex-1 px-1">{formatDate(item.lastModified)}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {!showRootView && viewMode === 'icons' && (
          <div className="grid grid-cols-4 gap-4 p-2">
            {currentItems.map((item) => (
              <div 
                key={item.id} 
                className={clsx("flex flex-col items-center p-2", {
                  "bg-[#000080] text-white": selectedItem === item
                })}
                onClick={() => setSelectedItem(item)}
                onDoubleClick={() => handleDoubleClick(item)}
                onContextMenu={(e) => handleRightClick(e, item)}
              >
                <Image 
                  src={getIcon(item)} 
                  alt={item.name} 
                  width={64} 
                  height={64} 
                  priority
                />
                <div className="mt-1 text-center text-sm max-w-full overflow-hidden text-ellipsis whitespace-nowrap">
                  {item.name}
                </div>
              </div>
            ))}
          </div>
        )}

        {!showRootView && viewMode === 'smallIcons' && (
          <div className="grid grid-cols-6 gap-2 p-2">
            {currentItems.map((item) => (
              <div 
                key={item.id} 
                className={clsx("flex flex-col items-center p-1", {
                  "bg-[#000080] text-white": selectedItem === item
                })}
                onClick={() => setSelectedItem(item)}
                onDoubleClick={() => handleDoubleClick(item)}
                onContextMenu={(e) => handleRightClick(e, item)}
              >
                <Image 
                  src={getIcon(item)} 
                  alt={item.name} 
                  width={32} 
                  height={32} 
                  priority
                />
                <div className="mt-0.5 text-center text-xs max-w-full overflow-hidden text-ellipsis whitespace-nowrap">
                  {item.name}
                </div>
              </div>
            ))}
          </div>
        )}

        {!showRootView && viewMode === 'list' && (
          <div className="flex flex-col">
            {currentItems.map((item) => (
              <div 
                key={item.id} 
                className={clsx("flex items-center py-0.5", {
                  "bg-[#000080] text-white": selectedItem === item,
                  "hover:bg-[#e0e0e0]": selectedItem !== item
                })}
                onClick={() => setSelectedItem(item)}
                onDoubleClick={() => handleDoubleClick(item)}
                onContextMenu={(e) => handleRightClick(e, item)}
              >
                <div className="w-8 flex justify-center">
                  <Image 
                    src={getIcon(item)} 
                    alt={item.name} 
                    width={32} 
                    height={32} 
                    priority
                  />
                </div>
                <div className="px-1 overflow-hidden text-ellipsis whitespace-nowrap">{item.name}</div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Status bar */}
      <div className="border-t border-t-[#808080] p-1 flex text-sm bg-[#c0c0c0]">
        <div className="flex-1">
          {statusMessage || 
          `${currentItems.filter(item => item.type === 'file').length} File(s)
           ${currentItems.filter(item => item.type === 'directory').length > 0 ? 
            `, ${currentItems.filter(item => item.type === 'directory').length} Folder(s)` : ''}`}
        </div>
      </div>

      {/* Context menu */}
      {showContextMenu && (
        <div 
          className="fixed bg-[#c0c0c0] border-2 border-t-[#ffffff] border-l-[#ffffff] border-r-[#404040] border-b-[#404040] z-50 shadow-md w-48 context-menu"
          style={{ top: contextMenuPos.y, left: contextMenuPos.x }}
          onClick={(e) => e.stopPropagation()}
        >
          {selectedItem && (
            <>
              <div 
                className="px-2 py-1 hover:bg-[#000080] hover:text-white" 
                onClick={() => {
                  handleDoubleClick(selectedItem);
                  setShowContextMenu(false);
                }}
              >
                Open
              </div>
              <div className="border-t border-t-[#808080] my-1"></div>
              <div 
                className="px-2 py-1 hover:bg-[#000080] hover:text-white"
                onClick={() => {
                  handleCut();
                  setShowContextMenu(false);
                }}
              >
                Cut
              </div>
              <div 
                className="px-2 py-1 hover:bg-[#000080] hover:text-white"
                onClick={() => {
                  handleCopy();
                  setShowContextMenu(false);
                }}
              >
                Copy
              </div>
              <div className="border-t border-t-[#808080] my-1"></div>
              <div 
                className="px-2 py-1 hover:bg-[#000080] hover:text-white"
                onClick={() => {
                  handleDelete();
                  setShowContextMenu(false);
                }}
              >
                Delete
              </div>
              <div className="border-t border-t-[#808080] my-1"></div>
              <div className="px-2 py-1 hover:bg-[#000080] hover:text-white">
                Properties
              </div>
            </>
          )}
          {!selectedItem && (
            <>
              <div 
                className="px-2 py-1 hover:bg-[#000080] hover:text-white"
                onClick={() => {
                  handleRefresh();
                  setShowContextMenu(false);
                }}
              >
                Refresh
              </div>
              <div className="border-t border-t-[#808080] my-1"></div>
              <div 
                className={clsx("px-2 py-1 hover:bg-[#000080] hover:text-white", {
                  "text-[#a0a0a0]": clipboard.items.length === 0
                })}
                onClick={() => {
                  if (clipboard.items.length > 0) {
                    handlePaste();
                    setShowContextMenu(false);
                  }
                }}
              >
                Paste
              </div>
              <div className="border-t border-t-[#808080] my-1"></div>
              <div 
                className="px-2 py-1 hover:bg-[#000080] hover:text-white"
                onClick={() => {
                  handleCreateNewFolder();
                  setShowContextMenu(false);
                }}
              >
                New Folder
              </div>
              <div className="border-t border-t-[#808080] my-1"></div>
              <div 
                className="px-2 py-1 hover:bg-[#000080] hover:text-white"
                onClick={() => {
                  setViewMode(viewMode === 'icons' ? 'details' : 'icons');
                  setShowContextMenu(false);
                }}
              >
                {viewMode === 'icons' ? 'Details View' : 'Large Icons'}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default MyComputer;