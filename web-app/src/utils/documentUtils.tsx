/**
 * documentUtils.tsx
 * 
 * Utility functions for document handling and display
 * 
 * Functions:
 *   getDocumentIcon - Returns appropriate icon for document type
 *   getFileTypeDisplay - Returns human-readable file type
 *   formatFileSize - Formats byte size for display
 * 
 * Usage: import { getDocumentIcon, formatFileSize } from './utils/documentUtils'
 */
import React from 'react';
import { FileText, File, FileCode } from 'lucide-react';

/**
 * Get appropriate icon for document type
 * 
 * @param category - Document category (pdf, text, markdown, etc.)
 * @param type - MIME type of the document
 * @returns React icon element with appropriate styling
 */
export function getDocumentIcon(category: string, type: string): React.ReactNode {
  switch (category) {
    case 'pdf':
      return <FileText className="w-5 h-5 text-red-500" />;
    case 'markdown':
      return <FileCode className="w-5 h-5 text-blue-500" />;
    case 'text':
      if (type.includes('json')) {
        return <FileCode className="w-5 h-5 text-yellow-500" />;
      }
      if (type.includes('html') || type.includes('css') || type.includes('javascript')) {
        return <FileCode className="w-5 h-5 text-green-500" />;
      }
      return <FileText className="w-5 h-5 text-gray-500" />;
    default:
      return <File className="w-5 h-5 text-gray-500" />;
  }
}

/**
 * Get display name for file type
 * 
 * @param type - MIME type string
 * @returns Human-readable file type name
 */
export function getFileTypeDisplay(type: string): string {
  const typeMap: Record<string, string> = {
    'application/pdf': 'PDF',
    'text/plain': 'Text',
    'text/markdown': 'Markdown',
    'text/x-markdown': 'Markdown',
    'application/json': 'JSON',
    'text/csv': 'CSV',
    'text/xml': 'XML',
    'application/xml': 'XML',
    'text/html': 'HTML',
    'application/javascript': 'JavaScript',
    'application/typescript': 'TypeScript',
    'text/css': 'CSS',
    'application/yaml': 'YAML',
    'text/yaml': 'YAML',
  };
  
  return typeMap[type] || type.split('/').pop()?.toUpperCase() || 'Unknown';
}

/**
 * Format file size for display
 * 
 * @param bytes - File size in bytes
 * @returns Formatted file size string (e.g., "1.5 MB")
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
} 