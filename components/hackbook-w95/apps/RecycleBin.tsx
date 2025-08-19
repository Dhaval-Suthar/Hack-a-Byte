import { useState, useEffect } from "react";
import Image from "next/image";
import clsx from "clsx";
import useFileSystem, { FileSystemItem } from "@/components/hackbook-w95/hooks/useFileSystem";

interface RecycleBinProps {
  onClose: () => void;
}

interface RecycleBinProps {
  onClose: () => void;
}

const RecycleBin: React.FC<RecycleBinProps> = ({ onClose }) => {
  const fs = useFileSystem();
  const [deletedItems, setDeletedItems] = useState<FileSystemItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<FileSystemItem | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>("");
  const [viewMode, setViewMode] = useState<"icons" | "details" | "list">("details");
  const [isFileMenuOpen, setIsFileMenuOpen] = useState(false);
  const [isViewMenuOpen, setIsViewMenuOpen] = useState(false);
  const [isConfirmingEmpty, setIsConfirmingEmpty] = useState<boolean>(false);
  const [isConfirmingRestore, setIsConfirmingRestore] = useState<boolean>(false);

  // Load deleted items from file system on mount
  useEffect(() => {
    try {
      // Navigate to Recycle Bin folder
      fs.navigateTo("C:\\Recycle Bin");
      const items = fs.getCurrentItems();
      setDeletedItems(items);

      // Set status message showing item count
      if (items.length === 0) {
        setStatusMessage("The Recycle Bin is empty");
      } else {
        setStatusMessage(`${items.length} item${items.length !== 1 ? "s" : ""}`);
      }
    } catch (error) {
      console.error("Error loading Recycle Bin contents:", error);
    }
  }, [fs]);

  // Restore selected item to its original location
  const handleRestore = () => {
    if (!selectedItem) return;
    setIsConfirmingRestore(true);
  };

  // Confirm restore operation
  const confirmRestore = () => {
    if (!selectedItem) {
      setIsConfirmingRestore(false);
      return;
    }

    try {
      // Get the original path from metadata
      const originalPath = selectedItem.metadata?.originalPath as string;

      // Check if originalPath exists before trying to use it
      if (!originalPath) {
        setStatusMessage("Error: Cannot restore item - original path is missing");
        setIsConfirmingRestore(false);
        return;
      }

      const originalDir = originalPath.substring(0, originalPath.lastIndexOf("\\"));

      // Save current directory
      const currentDir = fs.currentDirectory;

      // First, check if we can navigate to the original directory
      const canNavigate = fs.navigateTo(originalDir);

      if (!canNavigate) {
        setStatusMessage("Error: Cannot restore item - original directory no longer exists");
        fs.navigateTo(currentDir); // Navigate back
        setIsConfirmingRestore(false);
        return;
      }

      try {
        // Use the copy/paste mechanism to restore the item
        // Navigate back to recycle bin to set up the clipboard
        fs.navigateTo("C:\\Recycle Bin");
        fs.setSelectedItems([selectedItem]);
        fs.copyToClipboard("copy");

        // Now navigate to target directory and paste
        fs.navigateTo(originalDir);
        const pasteSuccess = fs.pasteFromClipboard();

        if (pasteSuccess) {
          // Navigate back to recycle bin and delete the original item
          fs.navigateTo("C:\\Recycle Bin");
          fs.deleteItems([selectedItem], true); // true for permanent delete

          // Reload items from file system to ensure UI is in sync
          const updatedItems = fs.getCurrentItems();
          setDeletedItems(updatedItems);
          setSelectedItem(null);

          // Update status message
          if (updatedItems.length === 0) {
            setStatusMessage("The Recycle Bin is empty");
          } else {
            setStatusMessage(`${updatedItems.length} item${updatedItems.length !== 1 ? "s" : ""}`);
          }

          // Temporarily show success message
          setStatusMessage("Item restored successfully");
          setTimeout(() => {
            if (updatedItems.length === 0) {
              setStatusMessage("The Recycle Bin is empty");
            } else {
              setStatusMessage(`${updatedItems.length} item${updatedItems.length !== 1 ? "s" : ""}`);
            }
          }, 2000);
        } else {
          setStatusMessage("Error: Failed to restore item - item may already exist at destination");
          fs.navigateTo("C:\\Recycle Bin"); // Make sure we're back in recycle bin
        }
      } catch (error) {
        console.error("Error restoring item:", error);
        setStatusMessage("Error restoring item: " + (error instanceof Error ? error.message : String(error)));
        fs.navigateTo("C:\\Recycle Bin"); // Make sure we're back in recycle bin
        
        // Reload items and clear selection even on error
        const updatedItems = fs.getCurrentItems();
        setDeletedItems(updatedItems);
        setSelectedItem(null);
      }
    } catch (error) {
      console.error("Error restoring item:", error);
      setStatusMessage("Error restoring item: " + (error instanceof Error ? error.message : String(error)));
      
      // Reload items and clear selection even on error
      try {
        fs.navigateTo("C:\\Recycle Bin");
        const updatedItems = fs.getCurrentItems();
        setDeletedItems(updatedItems);
        setSelectedItem(null);
      } catch (reloadError) {
        console.error("Error reloading items:", reloadError);
        setSelectedItem(null);
      }
    }

    setIsConfirmingRestore(false);
  };

  // Empty the recycle bin (permanently delete all items)
  const handleEmptyRecycleBin = () => {
    setIsConfirmingEmpty(true);
  };

  // Confirm empty recycle bin
  const confirmEmptyRecycleBin = () => {
    fs.deleteItems(deletedItems, true); // true for permanent deletion
    
    // Reload items from file system to ensure UI is in sync
    try {
      fs.navigateTo("C:\\Recycle Bin");
      const updatedItems = fs.getCurrentItems();
      setDeletedItems(updatedItems);
      
      // Update status message
      if (updatedItems.length === 0) {
        setStatusMessage("The Recycle Bin is empty");
      } else {
        setStatusMessage(`${updatedItems.length} item${updatedItems.length !== 1 ? "s" : ""}`);
      }
    } catch (error) {
      console.error("Error reloading Recycle Bin contents:", error);
      // Fallback to manual state update
      setDeletedItems([]);
      setStatusMessage("The Recycle Bin is empty");
    }
    
    setSelectedItem(null);
    setIsConfirmingEmpty(false);
  };

  // Format size for display
  const formatSize = (bytes?: number): string => {
    if (!bytes) return "";
    if (bytes < 1024) return `${bytes} bytes`;
    return `${Math.ceil(bytes / 1024).toLocaleString()} KB`;
  };

  // Format date for display
  const formatDate = (date?: Date): string => {
    if (!date) return "";
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Get the deleted date from item metadata or fallback to lastModified
  const getDeletedDate = (item: FileSystemItem): Date | undefined => {
    if (item.metadata?.deletedDate instanceof Date) {
      return item.metadata.deletedDate as Date;
    }
    
    // Handle both Date objects and string dates (from JSON serialization)
    if (item.lastModified) {
      return item.lastModified instanceof Date ? item.lastModified : new Date(item.lastModified);
    }
    
    return undefined;
  };

  // Handle menu click
  const handleMenuClick = (menu: string) => {
    if (menu === "File") {
      setIsFileMenuOpen(!isFileMenuOpen);
      setIsViewMenuOpen(false);
    } else if (menu === "View") {
      setIsViewMenuOpen(!isViewMenuOpen);
      setIsFileMenuOpen(false);
    }
  };

  // Switch view mode
  const switchViewMode = (mode: "icons" | "details" | "list") => {
    setViewMode(mode);
    setIsViewMenuOpen(false);
  };

  return (
    <div className="h-full w-full flex flex-col">
      {/* Menu bar */}
      <div className="w-full flex text-sm items-center bg-[#c0c0c0] border-b border-b-[#808080] p-0.5">
        {["File", "View"].map((menu) => (
          <div
            key={menu}
            className={clsx("px-2 py-0.5 cursor-default", {
              "bg-[#000080] text-white":
                (menu === "File" && isFileMenuOpen) ||
                (menu === "View" && isViewMenuOpen),
            })}
            onClick={() => handleMenuClick(menu)}
          >
            {menu}
          </div>
        ))}

        {/* File menu dropdown */}
        {isFileMenuOpen && (
          <div className="absolute left-0 top-5 mt-1 w-48 border-2 border-t-[#808080] border-l-[#808080] border-r-[#ffffff] border-b-[#ffffff] bg-[#c0c0c0] z-50">
            <div
              className={clsx("px-2 py-1 hover:bg-[#000080] hover:text-white", {
                "opacity-50 pointer-events-none": !selectedItem,
              })}
              onClick={() => {
                if (selectedItem) {
                  handleRestore();
                  setIsFileMenuOpen(false);
                }
              }}
            >
              Restore
            </div>
            <div className="border-t border-t-[#808080] my-1"></div>
            <div
              className={clsx("px-2 py-1 hover:bg-[#000080] hover:text-white", {
                "opacity-50 pointer-events-none": deletedItems.length === 0,
              })}
              onClick={() => {
                if (deletedItems.length > 0) {
                  handleEmptyRecycleBin();
                  setIsFileMenuOpen(false);
                }
              }}
            >
              Empty Recycle Bin
            </div>
            <div className="border-t border-t-[#808080] my-1"></div>
            <div
              className="px-2 py-1 hover:bg-[#000080] hover:text-white"
              onClick={() => {
                setIsFileMenuOpen(false);
                onClose();
              }}
            >
              Close
            </div>
          </div>
        )}

        {/* View menu dropdown */}
        {isViewMenuOpen && (
          <div className="absolute left-16 top-5 mt-1 w-48 border-2 border-t-[#808080] border-l-[#808080] border-r-[#ffffff] border-b-[#ffffff] bg-[#c0c0c0] z-50">
            <div
              className="px-2 py-1 hover:bg-[#000080] hover:text-white flex items-center"
              onClick={() => switchViewMode("icons")}
            >
              <span className="mr-2 w-4">{viewMode === "icons" ? "✓" : ""}</span>
              Large Icons
            </div>
            <div
              className="px-2 py-1 hover:bg-[#000080] hover:text-white flex items-center"
              onClick={() => switchViewMode("list")}
            >
              <span className="mr-2 w-4">{viewMode === "list" ? "✓" : ""}</span>
              List
            </div>
            <div
              className="px-2 py-1 hover:bg-[#000080] hover:text-white flex items-center"
              onClick={() => switchViewMode("details")}
            >
              <span className="mr-2 w-4">{viewMode === "details" ? "✓" : ""}</span>
              Details
            </div>
          </div>
        )}
      </div>

      {/* Toolbar */}
      <div className="w-full flex items-center bg-[#c0c0c0] border-b border-b-[#808080] p-1">
        <div className="flex space-x-1">
          <button
            className={clsx(
              "flex items-center px-2 py-1 border-2 border-t-[#ffffff] border-l-[#ffffff] border-r-[#404040] border-b-[#404040]",
              {
                "opacity-50 pointer-events-none": !selectedItem,
              }
            )}
            onClick={handleRestore}
            disabled={!selectedItem}
          >
            <span className="text-xs">Restore</span>
          </button>

          <button
            className={clsx(
              "flex items-center px-2 py-1 border-2 border-t-[#ffffff] border-l-[#ffffff] border-r-[#404040] border-b-[#404040]",
              {
                "opacity-50 pointer-events-none": deletedItems.length === 0,
              }
            )}
            onClick={handleEmptyRecycleBin}
            disabled={deletedItems.length === 0}
          >
            <span className="text-xs">Empty Recycle Bin</span>
          </button>
        </div>

        <div className="flex-1"></div>

        <button
          className="flex items-center mx-1 px-2 py-1 border-2 border-t-[#ffffff] border-l-[#ffffff] border-r-[#404040] border-b-[#404040]"
          onClick={onClose}
        >
          <span className="text-xs">Close</span>
        </button>
      </div>

      {/* Content area */}
      <div className="bg-white flex-1 flex flex-col">
        {deletedItems.length > 0 ? (
          <div className="flex-1 overflow-auto p-2">
            {viewMode === "icons" ? (
              <div className="grid grid-cols-4 gap-4">
                {deletedItems.map((item) => (
                  <div
                    key={item.id}
                    className={clsx("flex flex-col items-center p-1 cursor-pointer", {
                      "bg-[#000080] text-white": selectedItem?.id === item.id,
                    })}
                    onClick={() => setSelectedItem(item)}
                    onDoubleClick={handleRestore}
                  >
                    <Image
                      src={
                        item.type === "directory"
                          ? "/hackbook-W95/file-icons/folder.png"
                          : "/hackbook-W95/file-icons/file.png"
                      }
                      alt={item.type}
                      width={32}
                      height={32}
                      priority
                    />
                    <span className="text-xs text-center mt-1 break-all">{item.name}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="overflow-auto">
                <table className="w-full table-auto">
                  <thead>
                    <tr className="bg-[#f0f0f0] text-left">
                      <th className="px-2 py-1 text-xs font-medium text-[#000000]">Name</th>
                      {viewMode === "details" && (
                        <>
                          <th className="px-2 py-1 text-xs font-medium text-[#000000]">Size</th>
                          <th className="px-2 py-1 text-xs font-medium text-[#000000]">Date Deleted</th>
                        </>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {deletedItems.map((item) => (
                      <tr
                        key={item.id}
                        className={clsx("cursor-pointer", {
                          "bg-[#000080] text-white": selectedItem?.id === item.id,
                        })}
                        onClick={() => setSelectedItem(item)}
                        onDoubleClick={handleRestore}
                      >
                        <td className="px-2 py-1 text-xs break-all">{item.name}</td>
                        {viewMode === "details" && (
                          <>
                            <td className="px-2 py-1 text-xs">{formatSize(item.size)}</td>
                            <td className="px-2 py-1 text-xs">{formatDate(getDeletedDate(item))}</td>
                          </>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ) : (
          <div className="flex-1 flex justify-center items-center">
            <span className="text-sm">The Recycle Bin is empty</span>
          </div>
        )}

        {/* Status bar */}
        <div className="h-6 bg-[#c0c0c0] border-t border-t-[#808080] flex items-center px-2">
          <span className="text-xs">{statusMessage}</span>
        </div>
      </div>

      {/* Confirmation dialog for emptying recycle bin */}
      {isConfirmingEmpty && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-30 z-50">
          <div className="bg-[#c0c0c0] border-2 border-t-[#ffffff] border-l-[#ffffff] border-r-[#404040] border-b-[#404040] p-4 w-[350px]">
            <div className="mb-4">
              <div>
                <h3 className="font-bold mb-2">Confirm Delete</h3>
                <p className="text-sm">
                  Are you sure you want to permanently delete these {deletedItems.length} item(s)?
                </p>
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              <button
                className="px-4 py-1 border-2 border-t-[#ffffff] border-l-[#ffffff] border-r-[#404040] border-b-[#404040] bg-[#c0c0c0] text-black"
                onClick={confirmEmptyRecycleBin}
              >
                Yes
              </button>
              <button
                className="px-4 py-1 border-2 border-t-[#ffffff] border-l-[#ffffff] border-r-[#404040] border-b-[#404040] bg-[#c0c0c0] text-black"
                onClick={() => setIsConfirmingEmpty(false)}
              >
                No
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation dialog for restoring item */}
      {isConfirmingRestore && selectedItem && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-30 z-50">
          <div className="bg-[#c0c0c0] border-2 border-t-[#ffffff] border-l-[#ffffff] border-r-[#404040] border-b-[#404040] p-4 w-[350px]">
            <div className="mb-4">
              <div>
                <h3 className="font-bold mb-2">Confirm Restore</h3>
                <p className="text-sm">
                  Are you sure you want to restore &quot;{selectedItem.name}&quot; to its original location?
                </p>
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              <button
                className="px-4 py-1 border-2 border-t-[#ffffff] border-l-[#ffffff] border-r-[#404040] border-b-[#404040] bg-[#c0c0c0] text-black"
                onClick={confirmRestore}
              >
                Yes
              </button>
              <button
                className="px-4 py-1 border-2 border-t-[#ffffff] border-l-[#ffffff] border-r-[#404040] border-b-[#404040] bg-[#c0c0c0] text-black"
                onClick={() => setIsConfirmingRestore(false)}
              >
                No
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default RecycleBin;
