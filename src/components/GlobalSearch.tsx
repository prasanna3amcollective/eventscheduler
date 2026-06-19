'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

export interface CommandMapping {
  phrase: string;
  path: string;
  description?: string;
}

// Ensure this architecture supports future expansion. Adding new elements here makes them globally searchable.
export const SEARCH_MAPPINGS: CommandMapping[] = [
  { phrase: 'submit project', path: '/projectsubmission', description: 'Submit a new project to the collective' },
  { phrase: 'calendar view', path: '/home?tab=calendar', description: 'View collective calendar and schedule' },
  { phrase: 'developer panel', path: '/home?tab=admin', description: 'Access developer panel' },
  { phrase: 'about us', path: '/home/aboutus', description: 'Learn more about 3AM Collective' },
  { phrase: 'testimonials', path: '/home/testimonials', description: 'Read testimonials from our community' },
];

export default function GlobalSearch() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  // Filter mappings based on the query
  const filteredOptions = SEARCH_MAPPINGS.filter(m =>
    m.phrase.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input, textarea, or content editable
      if (
        document.activeElement instanceof HTMLInputElement ||
        document.activeElement instanceof HTMLTextAreaElement ||
        (document.activeElement as HTMLElement).isContentEditable
      ) {
        return;
      }

      if (e.key === '/') {
        e.preventDefault();
        setIsOpen(true);
      } else if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      // Focus input when opened
      setTimeout(() => inputRef.current?.focus(), 10);
      setQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Reset selected index when query changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  const handleSelect = (path: string) => {
    setIsOpen(false);
    router.push(path);
  };

  const handleModalKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % filteredOptions.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filteredOptions.length) % filteredOptions.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredOptions.length > 0) {
        handleSelect(filteredOptions[selectedIndex].path);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="global-search-overlay" onClick={() => setIsOpen(false)}>
      <div 
        className="global-search-modal" 
        onClick={(e) => e.stopPropagation()}
      >
        <div className="global-search-input-wrapper">
          <input
            ref={inputRef}
            type="text"
            className="global-search-input"
            placeholder="Filter navigator..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleModalKeyDown}
            autoComplete="off"
            spellCheck="false"
          />
        </div>
        <div className="global-search-results">
          {filteredOptions.length > 0 ? (
            filteredOptions.map((option, index) => (
              <div
                key={option.path}
                className={`global-search-item ${index === selectedIndex ? 'selected' : ''}`}
                onMouseEnter={() => setSelectedIndex(index)}
                onClick={() => handleSelect(option.path)}
              >
                <div className="global-search-item-phrase">{option.phrase}</div>
                {option.description && (
                  <div className="global-search-item-desc">{option.description}</div>
                )}
                {index === selectedIndex && <div className="global-search-item-hint">enter ↵</div>}
              </div>
            ))
          ) : (
            <div className="global-search-empty">No matching commands found.</div>
          )}
        </div>
        <div className="global-search-footer">
          <span>↑↓ to navigate</span>
          <span>·</span>
          <span>enter to select</span>
          <span>·</span>
          <span>esc to close</span>
        </div>
      </div>
    </div>
  );
}
