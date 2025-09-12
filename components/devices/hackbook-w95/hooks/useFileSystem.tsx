"use client";

import { useState, useEffect, useCallback } from 'react';
import { getUserStorageKey } from './useUserStorage';

// Define types for our virtual file system
export interface FileSystemItem {
  id: string;
  name: string;
  type: 'file' | 'directory';
  size?: number;
  content?: string;
  lastModified?: Date | string;
  path: string;
  children?: FileSystemItem[];
  isHidden?: boolean;
  isEncrypted?: boolean;
  encryptionType?: 'caesar' | 'vigenere' | 'aes' | 'rsa';
  encryptionKey?: string | number;
  permissions?: {
    read: boolean;
    write: boolean;
    execute: boolean;
  };
  metadata?: Record<string, unknown>;
}

// Generate a unique storage key based on playspace and user info
// This uses the shared getUserStorageKey function but keeps original key format for backward compatibility
const getStorageKey = (debug = false, isE95 = false) => {
  const baseKey = isE95 ? 'e95FileSystem' : 'win95FileSystem';
  return getUserStorageKey(baseKey, debug);
};

// Example initial file system structure
const initialFileSystem: FileSystemItem[] = [
  {
    id: 'd-drive',
    name: 'D:',
    type: 'directory',
    path: 'D:',
    lastModified: new Date('2025-01-01'),
    children: [
      {
        id: 'd-readme',
        name: 'README.txt',
        type: 'file',
        size: 128,
        path: 'D:\\README.txt',
        lastModified: new Date('2025-01-01'),
        content: 'CD-ROM Drive\n\nThis is a virtual CD-ROM drive for demonstration purposes.'
      },
      {
        id: 'd-hackbyte-manual',
        name: 'HACKBYTE.txt',
        type: 'file',
        size: 256,
        path: 'D:\\HACKBYTE.txt',
        lastModified: new Date('2025-05-17'),
        content: 'HACKBYTE MANUAL\n\nWelcome to HackByte 2025!\n\nThis CD contains important utilities and documentation for your hacking challenges.'
      },
      {
        id: 'd-utils',
        name: 'Utils',
        type: 'directory',
        path: 'D:\\Utils',
        lastModified: new Date('2025-01-01'),
        children: [
          {
            id: 'd-utils-decoder',
            name: 'decoder.exe',
            type: 'file',
            size: 1024,
            path: 'D:\\Utils\\decoder.exe',
            lastModified: new Date('2025-01-01')
          }
        ]
      }
    ]
  },
  {
    id: 'c-drive',
    name: 'C:',
    type: 'directory',
    path: 'C:',
    lastModified: new Date('2025-01-01'),
    children: [
      // Documents folder - for user files and mission-related content
      {
        id: 'c-documents',
        name: 'Documents',
        type: 'directory',
        path: 'C:\\Documents',
        lastModified: new Date('2025-05-01'),
        children: [
          {
            id: 'c-documents-readme',
            name: 'Readme.txt',
            type: 'file',
            size: 1024,
            path: 'C:\\Documents\\Readme.txt',
            lastModified: new Date('2025-05-01'),
            content: 'Welcome to HackBook W95!\n\nThis system is designed for security training purposes. As you progress through missions, you will gain access to more tools and features.\n\nYour first mission is to explore the system and familiarize yourself with its interface.\n\nGood luck!'
          },
          {
            id: 'c-documents-old-files',
            name: 'Old_Files',
            type: 'directory',
            path: 'C:\\Documents\\Old_Files',
            lastModified: new Date('1995-11-28'),
            children: [
              {
                id: 'c-documents-old-files-archive',
                name: 'Archive.zip',
                type: 'file',
                size: 4096,
                path: 'C:\\Documents\\Old_Files\\Archive.zip',
                lastModified: new Date('1995-10-16'),
                content: 'ZIP_ARCHIVE_PROTECTED',
                metadata: {
                  isPasswordProtected: true,
                  password: 'GHOST',
                  compressionType: 'deflate'
                }
              },
              {
                id: 'c-documents-old-files-note',
                name: 'READ_ME_FIRST.txt',
                type: 'file',
                size: 512,
                path: 'C:\\Documents\\Old_Files\\READ_ME_FIRST.txt',
                lastModified: new Date('1995-11-28'),
                content: 'CONFIDENTIAL RECOVERY MISSION\n\nAgent,\n\nYou have been assigned to recover important data from a damaged client system. The attached ZIP file contains the only recoverable files from their hard drive.\n\nThe archive is password protected for security. Use your skills to gain access to the files within.\n\nOnce you have recovered the data, check the contents for further instructions.\n\nGood luck.\n\n-- GHOST Network'
              }
            ]
          },
          {
            id: 'c-documents-personal',
            name: 'Personal',
            type: 'directory',
            path: 'C:\\Documents\\Personal',
            lastModified: new Date('2025-05-01'),
            children: []
          },
          {
            id: 'c-documents-encrypted',
            name: 'Encrypted',
            type: 'directory',
            path: 'C:\\Documents\\Encrypted',
            lastModified: new Date('2025-05-02'),
            children: [
              {
                id: 'c-documents-encrypted-message',
                name: 'secret_message.txt',
                type: 'file',
                size: 512,
                path: 'C:\\Documents\\Encrypted\\secret_message.txt',
                lastModified: new Date('2025-05-02'),
                content: 'KDFNERRN LV WKH SDVVZRUG',
                isEncrypted: true,
                encryptionType: 'caesar',
                encryptionKey: 3
              },
              {
                id: 'c-documents-encrypted-mission',
                name: 'MISSION_DATA.txt',
                type: 'file',
                size: 768,
                path: 'C:\\Documents\\Encrypted\\MISSION_DATA.txt',
                lastModified: new Date('2025-05-16'),
                content: 'Wklv iloh frqwdlqv vhfuhw plvvlrq gdwd.\n\nWkh sdvvzrug lv: KDFNERRN\n\nXvh wkh whuplqdo dqg wbsh: ghfubsw-iloh --sdwk "F:\\\\Grfxphqwv\\\\Hqfubswhg\\\\vhfuhw_phvvdjh.waw" --nhb 3',
                isEncrypted: true,
                encryptionType: 'caesar',
                encryptionKey: 3
              },
              {
                id: 'c-documents-encrypted-hint',
                name: 'README.txt',
                type: 'file',
                size: 256,
                path: 'C:\\Documents\\Encrypted\\README.txt',
                lastModified: new Date('2025-05-16'),
                content: 'ENCRYPTED FILES\n\nThe files in this directory are encrypted and require special tools to access.\n\nFor security personnel only:\nTo decrypt files, use the Terminal and enter "help" for available commands.\n\nHint: Check Windows\\System32 for hidden files with important decryption information.\nUse "show hidden files" in the Terminal to reveal hidden system files.\n\nSyntax: decrypt-file --path "filepath" --key number'
              }
            ]
          }
        ]
      },
      
      // Program Files folder - for applications
      {
        id: 'c-program-files',
        name: 'Program Files',
        type: 'directory',
        path: 'C:\\Program Files',
        lastModified: new Date('2025-01-01'),
        children: [
          {
            id: 'c-program-files-internet-explorer',
            name: 'Internet Explorer',
            type: 'directory',
            path: 'C:\\Program Files\\Internet Explorer',
            lastModified: new Date('2025-01-01'),
            children: [
              {
                id: 'c-program-files-internet-explorer-exe',
                name: 'iexplore.exe',
                type: 'file',
                path: 'C:\\Program Files\\Internet Explorer\\iexplore.exe',
                size: 2048,
                lastModified: new Date('2025-01-01')
              }
            ]
          },
          {
            id: 'c-program-files-hacker-tools',
            name: 'HackerTools',
            type: 'directory',
            path: 'C:\\Program Files\\HackerTools',
            lastModified: new Date('2025-01-01'),
            children: []
          }
        ]
      },
      
      // Hidden system folder with a password file - for mission objectives
      {
        id: 'c-system',
        name: 'System',
        type: 'directory',
        path: 'C:\\System',
        lastModified: new Date('2025-01-01'),
        isHidden: true,
        children: [
          {
            id: 'c-system-credentials',
            name: 'credentials.db',
            type: 'file',
            path: 'C:\\System\\credentials.db',
            size: 1024,
            lastModified: new Date('2025-01-01'),
            content: 'admin:supersecretpassword123\nuser:password123\nguest:guest'
          }
        ]
      },
      
      // Windows system folder
      {
        id: 'c-windows',
        name: 'Windows',
        type: 'directory',
        path: 'C:\\Windows',
        lastModified: new Date('2025-01-01'),
        children: [
          {
            id: 'c-windows-system32',
            name: 'System32',
            type: 'directory',
            path: 'C:\\Windows\\System32',
            lastModified: new Date('2025-01-01'),
            children: [
              {
                id: 'c-windows-system32-hidden-data',
                name: '.hidden_data',
                type: 'file',
                size: 215,
                path: 'C:\\Windows\\System32\\.hidden_data',
                lastModified: new Date('2025-05-16'),
                content: 'DECRYPTION KEY: 3\nENCRYPTION TYPE: CAESAR\n\nTo decrypt Caesar cipher:\nShift each letter back by the key value.\nExample: D with key 3 becomes A\n\nComplete decryption to unlock password: HACKBOOK',
                isHidden: true
              },
              {
                id: 'c-windows-system32-secure-notes',
                name: '.secure_notes.txt',
                type: 'file',
                size: 512,
                path: 'C:\\Windows\\System32\\.secure_notes.txt',
                lastModified: new Date('1995-11-28'),
                content: 'Security Notes:\n\nImportant: The Caesar cipher uses a shift of 3 positions.\nRemember to use "access FIRST_MISSION_1995" to gain access to secure terminal functions.\n\nThe mission files are in: C:\\Documents\\Encrypted\\\n\nFor the ZIP recovery mission:\n- File location: C:\\Documents\\Old_Files\\Archive.zip\n- Password hint: Network codename (5 letters)\n- Brute force option available if password unknown\n\nNext phase: Connect to secure messaging after ZIP recovery.',
                isHidden: true
              }
            ]
          },
          {
            id: 'c-windows-command',
            name: 'Command',
            type: 'directory',
            path: 'C:\\Windows\\Command',
            lastModified: new Date('2025-01-01'),
            children: []
          },
          {
            id: 'c-windows-config',
            name: 'Config',
            type: 'directory',
            path: 'C:\\Windows\\Config',
            lastModified: new Date('2025-01-01'),
            children: []
          },
          {
            id: 'c-windows-cookies',
            name: 'Cookies',
            type: 'directory',
            path: 'C:\\Windows\\Cookies',
            lastModified: new Date('2025-01-01'),
            children: []
          },
          {
            id: 'c-windows-cursors',
            name: 'Cursors',
            type: 'directory',
            path: 'C:\\Windows\\Cursors',
            lastModified: new Date('2025-01-01'),
            children: []
          },
          {
            id: 'c-windows-favorites',
            name: 'Favorites',
            type: 'directory',
            path: 'C:\\Windows\\Favorites',
            lastModified: new Date('2025-01-01'),
            children: []
          },
          {
            id: 'c-windows-fonts',
            name: 'Fonts',
            type: 'directory',
            path: 'C:\\Windows\\Fonts',
            lastModified: new Date('2025-01-01'),
            children: []
          },
          {
            id: 'c-windows-system32',
            name: 'System32',
            type: 'directory',
            path: 'C:\\Windows\\System32',
            lastModified: new Date('2025-01-01'),
            children: [
              {
                id: 'c-windows-system32-drivers',
                name: 'drivers',
                type: 'directory',
                path: 'C:\\Windows\\System32\\drivers',
                lastModified: new Date('2025-01-01'),
                children: []
              },
              {
                id: 'c-windows-system32-config',
                name: 'config',
                type: 'directory',
                path: 'C:\\Windows\\System32\\config',
                lastModified: new Date('2025-01-01'),
                children: []
              },
              {
                id: 'c-windows-system32-mission-hint',
                name: '.secure_notes.txt',
                type: 'file',
                size: 320,
                path: 'C:\\Windows\\System32\\.secure_notes.txt',
                lastModified: new Date('2025-05-16'),
                content: 'Security Notes:\n\nImportant: The Caesar cipher uses a shift of 3 positions.\nRemember to use "access FIRST_MISSION_1995" to gain access to secure terminal functions.\n\nThe mission files are in: C:\\Documents\\Encrypted\\',
                isHidden: true
              }
            ]
          },
          {
            id: 'c-windows-notepad',
            name: 'notepad.exe',
            type: 'file',
            size: 68000,
            path: 'C:\\Windows\\notepad.exe',
          }
        ]
      },
      {
        id: 'c-program-files-2',
        name: 'Program Files',
        type: 'directory',
        path: 'C:\\Program Files',
        children: [
          {
            id: 'c-program-files-accessories',
            name: 'Accessories',
            type: 'directory',
            path: 'C:\\Program Files\\Accessories',
            children: [
              {
                id: 'c-program-files-accessories-calculator',
                name: 'calc.exe',
                type: 'file',
                size: 45000,
                path: 'C:\\Program Files\\Accessories\\calc.exe',
              },
              {
                id: 'c-program-files-accessories-paint',
                name: 'paint.exe',
                type: 'file',
                size: 132000,
                path: 'C:\\Program Files\\Accessories\\paint.exe',
              }
            ]
          },
          {
            id: 'c-program-files-games',
            name: 'Games',
            type: 'directory',
            path: 'C:\\Program Files\\Games',
            children: [
              {
                id: 'c-program-files-games-minesweeper',
                name: 'minesweeper.exe',
                type: 'file',
                size: 38000,
                path: 'C:\\Program Files\\Games\\minesweeper.exe',
              },
              {
                id: 'c-program-files-games-solitaire',
                name: 'sol.exe',
                type: 'file',
                size: 52000,
                path: 'C:\\Program Files\\Games\\sol.exe',
              }
            ]
          }
        ]
      },
      {
        id: 'c-mydocuments',
        name: 'My Documents',
        type: 'directory',
        path: 'C:\\My Documents',
        children: [
          {
            id: 'c-mydocuments-readme',
            name: 'README.txt',
            type: 'file',
            size: 250,
            content: 'Welcome to Windows 95! This is a text file you can edit with Notepad.',
            path: 'C:\\My Documents\\README.txt',
            lastModified: new Date('1995-08-24')
          }
        ]
      }
    ]
  }
];

export type FileOperation = 'copy' | 'cut' | 'delete' | 'rename' | 'newFolder' | 'newFile';

export default function useFileSystem(options = { debug: false, isE95: false }) {
  // Helper function to restore Date objects after JSON serialization
  const restoreDates = useCallback((items: FileSystemItem[]): FileSystemItem[] => {
    const processItem = (item: FileSystemItem): FileSystemItem => {
      const newItem = {...item};
      
      // Convert lastModified back to Date if it exists
      if (newItem.lastModified) {
        newItem.lastModified = new Date(newItem.lastModified);
      }
      
      // Process children recursively
      if (newItem.children && newItem.children.length > 0) {
        newItem.children = newItem.children.map(processItem);
      }
      
      return newItem;
    };

    return items.map(processItem);
  }, []);

  // Create filtered file system based on E95 mode
  const getFilteredFileSystem = useCallback(() => {
    if (!options.isE95) return initialFileSystem;
    
    // For E95 mode, filter out the Old_Files directory
    const filteredFS = JSON.parse(JSON.stringify(initialFileSystem)); // Deep clone
    const cDrive = filteredFS.find((item: FileSystemItem) => item.path === 'C:');
    if (cDrive?.children) {
      const documents = cDrive.children.find((item: FileSystemItem) => item.path === 'C:\\Documents');
      if (documents?.children) {
        // Remove Old_Files directory
        documents.children = documents.children.filter((item: FileSystemItem) => item.name !== 'Old_Files');
      }
    }
    // Restore Date objects after JSON cloning
    return restoreDates(filteredFS);
  }, [options.isE95, restoreDates]);

  const [fileSystem, setFileSystem] = useState<FileSystemItem[]>(getFilteredFileSystem);
  const [currentDirectory, setCurrentDirectory] = useState<string>('C:');
  const [selectedItems, setSelectedItems] = useState<FileSystemItem[]>([]);
  const [clipboard, setClipboard] = useState<{items: FileSystemItem[], operation: FileOperation | null}>({
    items: [],
    operation: null
  });
  
  // Debug mode for logging
  const debugMode = options.debug || false;

  // Migration function to update existing file systems
  const migrateFileSystem = useCallback((savedFileSystem: FileSystemItem[]): FileSystemItem[] => {
    try {
      // Find the C: drive
      const cDriveIndex = savedFileSystem.findIndex(item => item.path === 'C:');
      if (cDriveIndex === -1) return getFilteredFileSystem(); // Fallback if C: drive not found

      // Find the Documents folder
      const documentsIndex = savedFileSystem[cDriveIndex].children?.findIndex(
        item => item.path === 'C:\\Documents'
      );
      
      if (documentsIndex === undefined || documentsIndex === -1) {
        // Documents folder doesn't exist, use filtered file system
        return getFilteredFileSystem();
      }

      // Check if Old_Files directory already exists
      const oldFilesExists = savedFileSystem[cDriveIndex].children?.[documentsIndex]?.children?.some(
        item => item.path === 'C:\\Documents\\Old_Files'
      );

      if (!oldFilesExists && !options.isE95) {
        // Add the Old_Files directory with the ZIP file (skip in E95 mode)
        const newFileSystem = JSON.parse(JSON.stringify(savedFileSystem)); // Deep clone
        
        const oldFilesDir = {
          id: 'c-documents-old-files',
          name: 'Old_Files',
          type: 'directory' as const,
          path: 'C:\\Documents\\Old_Files',
          lastModified: new Date('1995-11-28'),
          children: [
            {
              id: 'c-documents-old-files-archive',
              name: 'Archive.zip',
              type: 'file' as const,
              size: 4096,
              path: 'C:\\Documents\\Old_Files\\Archive.zip',
              lastModified: new Date('1995-10-16'),
              content: 'ZIP_ARCHIVE_PROTECTED',
              metadata: {
                isPasswordProtected: true,
                password: 'GHOST',
                compressionType: 'deflate'
              }
            },
            {
              id: 'c-documents-old-files-note',
              name: 'READ_ME_FIRST.txt',
              type: 'file' as const,
              size: 512,
              path: 'C:\\Documents\\Old_Files\\READ_ME_FIRST.txt',
              lastModified: new Date('1995-11-28'),
              content: 'CONFIDENTIAL RECOVERY MISSION\n\nAgent,\n\nYou have been assigned to recover important data from a damaged client system. The attached ZIP file contains the only recoverable files from their hard drive.\n\nThe archive is password protected for security. Use your skills to gain access to the files within.\n\nOnce you have recovered the data, check the contents for further instructions.\n\nGood luck.\n\n-- GHOST Network'
            }
          ]
        };

        if (newFileSystem[cDriveIndex].children?.[documentsIndex]?.children) {
          newFileSystem[cDriveIndex].children[documentsIndex].children.push(oldFilesDir);
        }

        return newFileSystem;
      }

      return savedFileSystem; // No migration needed
    } catch (error) {
      console.error('Migration failed, using filtered file system:', error);
      return getFilteredFileSystem();
    }
  }, [debugMode, getFilteredFileSystem, options.isE95]);

  // Debug function to reset file system (for development/testing)
  const resetFileSystem = useCallback(() => {
    try {
      const storageKey = getStorageKey(debugMode, options.isE95);
      localStorage.removeItem(storageKey);
      setFileSystem(getFilteredFileSystem());
      setCurrentDirectory('C:');
    } catch (error) {
      console.error('Failed to reset file system:', error);
    }
  }, [debugMode, getFilteredFileSystem, options.isE95]);

  // Expose reset function globally for development
  useEffect(() => {
    if (process.env.NODE_ENV === 'development' && debugMode && typeof window !== 'undefined') {
      (window as Window & { resetWin95FileSystem?: () => void }).resetWin95FileSystem = resetFileSystem;
    } else if (typeof window !== 'undefined') {
      delete (window as Window & { resetWin95FileSystem?: () => void }).resetWin95FileSystem;
    }
  }, [debugMode, resetFileSystem]);

  // Initialize from localStorage if available, or use default for new users
  useEffect(() => {
    // Add a small delay to ensure the component is fully mounted
    const initTimeout = setTimeout(() => {
      try {
        // Only proceed if localStorage is available
        if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
          setFileSystem(getFilteredFileSystem());
          return;
        }
        
        try {
          const storageKey = getStorageKey(debugMode, options.isE95);
          let savedFileSystem = null;
          
          // Safe localStorage access with try-catch
          try {
            savedFileSystem = localStorage.getItem(storageKey);
          } catch (storageError) {
            if (debugMode) console.warn("Failed to access localStorage:", storageError);
            setFileSystem(getFilteredFileSystem());
            return;
          }
          
          if (savedFileSystem) {
            // Parse the saved file system and restore Date objects
            try {
              const parsedFileSystem = JSON.parse(savedFileSystem);
              if (Array.isArray(parsedFileSystem)) {
                // Apply migration to ensure new features are available
                const migratedFileSystem = migrateFileSystem(parsedFileSystem);
                
                // If in E95 mode, filter out Old_Files even from saved data
                if (options.isE95) {
                  const cDrive = migratedFileSystem.find((item: FileSystemItem) => item.path === 'C:');
                  if (cDrive?.children) {
                    const documents = cDrive.children.find((item: FileSystemItem) => item.path === 'C:\\Documents');
                    if (documents?.children) {
                      documents.children = documents.children.filter((item: FileSystemItem) => item.name !== 'Old_Files');
                    }
                  }
                }
                
                setFileSystem(restoreDates(migratedFileSystem));
                
                // Save the migrated (and potentially filtered) file system back to localStorage
                try {
                  localStorage.setItem(storageKey, JSON.stringify(migratedFileSystem));
                } catch (saveError) {
                  console.error("Error saving migrated file system:", saveError);
                }
                
              } else {
                throw new Error("Invalid file system format");
              }
            } catch (parseError) {
              console.error("Error parsing saved file system:", parseError);
              setFileSystem(getFilteredFileSystem());
              
              // Clear corrupted data
              try {
                localStorage.removeItem(storageKey);
              } catch {
                // Ignore removal errors
              }
            }
          } else {
            // For new users, use the filtered file system (respects E95 mode)
            setFileSystem(getFilteredFileSystem());
            
            // Defer saving the filtered file system to avoid immediate write after read
            setTimeout(() => {
              try {
                const fileSystemToSave = getFilteredFileSystem();
                localStorage.setItem(storageKey, JSON.stringify(fileSystemToSave));
              } catch (saveError) {
                console.error("Error saving initial file system:", saveError);
              }
            }, 500);
          }
        } catch (error) {
          console.error("Error in file system initialization:", error);
          // Fallback to filtered file system
          setFileSystem(getFilteredFileSystem());
        }
      } catch (fatalError) {
        // Last resort error handling
        console.error("Fatal error during file system initialization:", fatalError);
        setFileSystem(getFilteredFileSystem());
      }
    }, 100);

    return () => clearTimeout(initTimeout);
  }, [restoreDates, debugMode, migrateFileSystem, getFilteredFileSystem, options.isE95]);

  // Save to localStorage on changes with debouncing and error handling
  useEffect(() => {
    // Use a timeout to debounce frequent saves and prevent "aborted" errors
    const saveTimeout = setTimeout(() => {
      try {
        // Check if localStorage is available and the operation is not aborting
        if (typeof localStorage !== 'undefined') {
          const storageKey = getStorageKey(debugMode, options.isE95);
          // Serialize with try-catch to handle circular references
          try {
            const serializedData = JSON.stringify(fileSystem);
            localStorage.setItem(storageKey, serializedData);
          } catch (serializeError) {
            console.error("Error serializing file system:", serializeError);
          }
        }
      } catch (error) {
        // Handle specific DOMException for aborted operations
        if (error instanceof DOMException && error.name === 'AbortError') {
          console.warn("Storage operation was aborted, will retry on next change");
        } else {
          console.error("Error saving file system to localStorage:", error);
        }
      }
    }, 300); // 300ms debounce time

    // Clear timeout on cleanup to avoid memory leaks
    return () => clearTimeout(saveTimeout);
  }, [fileSystem, debugMode, options.isE95]);

  // Helper function to find a directory by path
  const findDirectoryByPath = (path: string, items = fileSystem): FileSystemItem | null => {
    if (!path) {
      console.warn('Empty path provided to findDirectoryByPath');
      return null;
    }

    // Normalize path to handle case insensitivity - Windows paths are case-insensitive
    const normalizedPath = path.toLowerCase();
    
    // Debug information (only shown when debug mode is enabled)
    if (debugMode) {
    }
    
    // Special handling for root drives - handle with or without colon
    if (normalizedPath === 'd:' || normalizedPath === 'c:' || 
        normalizedPath === 'd' || normalizedPath === 'c') {
      const lookingForC = normalizedPath.startsWith('c');
      const lookingForD = normalizedPath.startsWith('d');
      
      // Direct lookup at the root level for drives
      for (const item of items) {
        if (!item.path) continue; // Skip items without path
        
        const itemPath = item.path.toLowerCase();
        
        if ((lookingForC && (itemPath === 'c:' || itemPath === 'c')) || 
            (lookingForD && (itemPath === 'd:' || itemPath === 'd'))) {
          if (debugMode) {
          }
          return item;
        }
      }
      
      console.warn(`Root drive not found: ${path}`);
      return null;
    }
    
    // First try direct match at any level
    for (const item of items) {
      if (item.path.toLowerCase() === normalizedPath) {
        if (debugMode) {
        }
        return item;
      }
    }
    
    // If direct match fails, try recursive search through children
    for (const item of items) {
      if (item.children && item.children.length > 0) {
        const found = findDirectoryByPath(normalizedPath, item.children);
        if (found) return found;
      }
    }
    
    if (debugMode) {
      console.warn(`Path not found: ${path}`);
    }
    return null;
  };

  // Get items in current directory
  const getCurrentItems = (): FileSystemItem[] => {
    const directory = findDirectoryByPath(currentDirectory);
    return directory?.children || [];
  };

  // Navigate to a directory with error handling
  const navigateTo = (path: string) => {
    if (!path) {
      // For empty path, we're navigating to root view
      setCurrentDirectory("");
      return true;
    }

    try {
      // Special handling for root drives
      const normalizedPath = path.trim().toLowerCase();
      
      // Handle drive paths - normalize to uppercase with colon
      if (normalizedPath === "c" || normalizedPath === "c:") {
        
        try {
          // Look for C: drive in the file system
          const cDrive = fileSystem.find(item => {
            try {
              const itemPath = (item.path || "").toLowerCase();
              return itemPath === "c:" || itemPath === "c";
            } catch {
              return false;
            }
          });
          
          if (cDrive && cDrive.type === 'directory') {
            setCurrentDirectory("C:");
            return true;
          } else {
            if (debugMode) {
              console.warn("C: drive not found in fileSystem");
            }
            return false;
          }
        } catch (error) {
          console.error("Error finding C: drive:", error);
          return false;
        }
      } 
      else if (normalizedPath === "d" || normalizedPath === "d:") {
        
        try {
          // Look for D: drive in the file system
          const dDrive = fileSystem.find(item => {
            try {
              const itemPath = (item.path || "").toLowerCase();
              return itemPath === "d:" || itemPath === "d";
            } catch {
              return false;
            }
          });
          
          if (dDrive && dDrive.type === 'directory') {
            // Set current directory to D: with proper capitalization
            setCurrentDirectory("D:");
            
            // Make sure we're returning the correct directory with all its children
            if (!dDrive.children || dDrive.children.length === 0) {
              // Initialize D: drive with default content if it's empty
              const updatedFileSystem = [...fileSystem];
              const dDriveIndex = updatedFileSystem.findIndex(item => 
                (item.path || "").toLowerCase() === "d:" || (item.path || "").toLowerCase() === "d"
              );
              
              if (dDriveIndex !== -1) {
                updatedFileSystem[dDriveIndex].children = [
                  {
                    id: 'd-readme',
                    name: 'README.txt',
                    type: 'file',
                    size: 128,
                    path: 'D:\\README.txt',
                    lastModified: new Date(),
                    content: 'CD-ROM Drive\n\nThis is a virtual CD-ROM drive for demonstration purposes.'
                  },
                  {
                    id: 'd-hackbyte-manual',
                    name: 'HACKBYTE.txt',
                    type: 'file',
                    size: 256,
                    path: 'D:\\HACKBYTE.txt',
                    lastModified: new Date(),
                    content: 'HACKBYTE MANUAL\n\nWelcome to HackByte 2025!\n\nThis CD contains important utilities and documentation for your hacking challenges.'
                  },
                  {
                    id: 'd-utils',
                    name: 'Utils',
                    type: 'directory',
                    path: 'D:\\Utils',
                    lastModified: new Date(),
                    children: []
                  }
                ];
                setFileSystem(updatedFileSystem);
              }
            }
            
            return true;
          } else {
            if (debugMode) {
              console.warn("D: drive not found in fileSystem");
              
              // If D: drive isn't found, create it
              const newDDrive: FileSystemItem = {
                id: 'd-drive',
                name: 'D:',
                type: 'directory',
                path: 'D:',
                lastModified: new Date(),
                children: [
                  {
                    id: 'd-readme',
                    name: 'README.txt',
                    type: 'file',
                    size: 128,
                    path: 'D:\\README.txt',
                    lastModified: new Date(),
                    content: 'CD-ROM Drive\n\nThis is a virtual CD-ROM drive for demonstration purposes.'
                  }
                ]
              };
              
              const updatedFileSystem = [...fileSystem, newDDrive];
              setFileSystem(updatedFileSystem);
              setCurrentDirectory("D:");
              return true;
            }
            return false;
          }
        } catch (error) {
          console.error("Error finding D: drive:", error);
          return false;
        }
      }
      // Normal path handling
      else {
        try {
          // Normalize path with correct capitalization
          // For drives, ensure uppercase with colon
          let formattedPath = path;
          if (path.length > 0) {
            // Ensure first character is uppercase for drives
            formattedPath = path.charAt(0).toUpperCase() + path.slice(1);
            
            // Ensure drive letters have a colon
            if (formattedPath.length === 1 && /^[a-zA-Z]$/.test(formattedPath)) {
              formattedPath = formattedPath + ":";
            }
          }
          
          
          // Find the directory using our helper function
          const directory = findDirectoryByPath(formattedPath);
          if (directory && directory.type === 'directory') {
            setCurrentDirectory(directory.path);  // Use the actual path from the directory object
            return true;
          } else {
            if (debugMode) {
              console.warn(`Navigation failed: Directory not found - ${formattedPath}`);
            }
            return false;
          }
        } catch (error) {
          console.error("Error during path navigation:", error);
          return false;
        }
      }
    } catch (fatalError) {
      console.error("Fatal error during navigation:", fatalError);
      return false;
    }
  };

  // Go up one directory level
  const navigateUp = () => {
    if (currentDirectory === 'C:') return false;
    
    const parentPath = currentDirectory.substring(0, currentDirectory.lastIndexOf('\\'));
    return navigateTo(parentPath || 'C:');
  };

  // Create new file or folder
  const createItem = (name: string, type: 'file' | 'directory', content: string = '') => {
    const newId = `${currentDirectory.replace(/[\\:]/g, '-')}-${name}`.toLowerCase();
    const newPath = `${currentDirectory}\\${name}`;
    
    const newItem: FileSystemItem = {
      id: newId,
      name: name,
      type: type,
      path: newPath,
      lastModified: new Date(),
      ...(type === 'directory' ? { children: [] } : { content, size: content.length })
    };
    
    // Find current directory and add the new item
    const updatedFileSystem = [...fileSystem];
    const directory = findDirectoryByPath(currentDirectory, updatedFileSystem);
    
    if (directory) {
      // Check if name already exists
      if (directory.children?.some(item => item.name === name)) {
        return false;
      }
      
      directory.children = [...(directory.children || []), newItem];
      setFileSystem(updatedFileSystem);
      return true;
    }
    
    return false;
  };

  // Delete selected items - moves them to Recycle Bin instead of permanent deletion
  const deleteItems = (itemsToDelete = selectedItems, permanent = false) => {
    if (itemsToDelete.length === 0) return false;
    
    const updatedFileSystem = [...fileSystem];
    const directory = findDirectoryByPath(currentDirectory, updatedFileSystem);
    
    // If we're inside the Recycle Bin or permanent is true, delete items permanently
    if (permanent || currentDirectory === 'C:\\Recycle Bin') {
      if (directory && directory.children) {
        directory.children = directory.children.filter(
          item => !itemsToDelete.some(delItem => delItem.id === item.id)
        );
        
        setFileSystem(updatedFileSystem);
        setSelectedItems([]);
        return true;
      }
      return false;
    }
    
    // Otherwise, move to Recycle Bin
    if (directory && directory.children) {
      // Find Recycle Bin directory
      const recycleBin = findDirectoryByPath('C:\\Recycle Bin', updatedFileSystem);
      
      if (recycleBin) {
        // Remove items from current directory
        const itemsToMove = directory.children.filter(
          item => itemsToDelete.some(delItem => delItem.id === item.id)
        );
        
        // Remove items from current directory
        directory.children = directory.children.filter(
          item => !itemsToDelete.some(delItem => delItem.id === item.id)
        );
        
        // Add items to Recycle Bin with metadata about original location
        const recycledItems = itemsToMove.map(item => ({
          ...item,
          id: `recycle-${item.id}`,
          path: `C:\\Recycle Bin\\${item.name}`,
          lastModified: new Date(),
          metadata: {
            ...item.metadata,
            originalPath: item.path,
            deletedFrom: currentDirectory
          }
        }));
        
        recycleBin.children = [...recycleBin.children || [], ...recycledItems];
        
        setFileSystem(updatedFileSystem);
        setSelectedItems([]);
        return true;
      }
    }
    
    return false;
  };

  // Copy or cut to clipboard
  const copyToClipboard = (operation: 'copy' | 'cut') => {
    if (selectedItems.length === 0) return false;
    
    setClipboard({
      items: [...selectedItems],
      operation: operation
    });
    
    // If cutting, remove from current location
    if (operation === 'cut') {
      deleteItems();
    }
    
    return true;
  };

  // Paste from clipboard
  const pasteFromClipboard = () => {
    if (clipboard.items.length === 0 || !clipboard.operation) return false;
    
    const updatedFileSystem = [...fileSystem];
    const targetDirectory = findDirectoryByPath(currentDirectory, updatedFileSystem);
    
    if (targetDirectory && targetDirectory.children) {
      // Deep clone clipboard items to avoid reference issues
      const itemsToPaste = clipboard.items.map(item => ({
        ...item,
        id: `${currentDirectory.replace(/[\\:]/g, '-')}-${item.name}`.toLowerCase(),
        path: `${currentDirectory}\\${item.name}`,
        lastModified: new Date()
      }));
      
      // Check for name conflicts
      const conflictItems = itemsToPaste.filter(item => 
        targetDirectory.children?.some(existing => existing.name === item.name)
      );
      
      if (conflictItems.length > 0) {
        // Handle conflicts (rename with (copy) suffix for simplicity)
        conflictItems.forEach(item => {
          item.name = `${item.name} (copy)`;
          item.path = `${currentDirectory}\\${item.name}`;
        });
      }
      
      targetDirectory.children = [...targetDirectory.children, ...itemsToPaste];
      setFileSystem(updatedFileSystem);
      
      // Clear clipboard if it was a cut operation
      if (clipboard.operation === 'cut') {
        setClipboard({ items: [], operation: null });
      }
      
      return true;
    }
    
    return false;
  };

  // Rename item
  const renameItem = (item: FileSystemItem, newName: string) => {
    const updatedFileSystem = [...fileSystem];
    const directory = findDirectoryByPath(currentDirectory, updatedFileSystem);
    
    if (directory && directory.children) {
      // Check if name already exists
      if (directory.children.some(existingItem => 
        existingItem.name === newName && existingItem.id !== item.id)
      ) {
        return false;
      }
      
      const itemToRename = directory.children.find(i => i.id === item.id);
      if (itemToRename) {
        itemToRename.name = newName;
        itemToRename.path = `${currentDirectory}\\${newName}`;
        itemToRename.lastModified = new Date();
        
        setFileSystem(updatedFileSystem);
        return true;
      }
    }
    
    return false;
  };

  // Get item by path (file or directory)
  const getItemAtPath = (path: string): FileSystemItem | null => {
    // Normalize path to handle case insensitivity
    const normalizedPath = path.toLowerCase();
    
    // If it's the root directory
    if (normalizedPath === 'c:' || normalizedPath === 'd:') {
      return fileSystem.find(item => item.path.toLowerCase() === normalizedPath) || null;
    }
    
    // For deeper paths, traverse the file system
    const pathParts = normalizedPath.split('\\');
    const driveLetter = pathParts[0];
    
    // Find the root drive
    let currentItem = fileSystem.find(item => item.path.toLowerCase() === driveLetter.toLowerCase());
    if (!currentItem) return null;
    
    // Traverse through the path
    for (let i = 1; i < pathParts.length; i++) {
      const part = pathParts[i].toLowerCase();
      if (!currentItem.children) return null;
      
      currentItem = currentItem.children.find(child => child.name.toLowerCase() === part);
      if (!currentItem) return null;
    }
    
    return currentItem;
  };
  
  // Update file content
  const updateFileContent = (filePath: string, content: string) => {
    const updatedFileSystem = [...fileSystem];
    const file = findDirectoryByPath(filePath, updatedFileSystem);
    
    if (file && file.type === 'file') {
      file.content = content;
      file.size = content.length;
      file.lastModified = new Date();
      
      setFileSystem(updatedFileSystem);
      return true;
    }
    
    return false;
  };

  return {
    fileSystem,
    currentDirectory,
    selectedItems,
    clipboard,
    getCurrentItems,
    navigateTo,
    navigateUp,
    setSelectedItems,
    createItem,
    deleteItems,
    copyToClipboard,
    pasteFromClipboard,
    renameItem,
    updateFileContent,
    getItemAtPath
  };
}
