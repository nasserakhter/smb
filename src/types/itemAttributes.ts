enum Attributes {
  /**
   * A - Archive
   * only used by backup programs (including xcopy/robocopy).
   * Such tools clear it when making a copy, and the OS
   * automatically sets it again whenever the file changes,
   * which avoids the need to compare modification times.
   */
  Archive,
  /**
   * D - Directory
   * Indicates that the entry is a directory.
   */
  Directory,
  /**
   * R - Read-only
   * Indicates that the file is read-only.
   */
  ReadOnly,
  /**
   * H - Hidden
   * Indicates that the file is hidden.
   */
  Hidden,
  /**
   * S - System
   * Indicates that the file is a system file. This allows GUI
   * interfaces to request confirmation before deleting a file.
   */
  System,
  /**
   * N - Normal
   * Indicates that the entry is a normal file.
   */
  Normal,
}

export default Attributes;
