'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, Check } from '@/components/Icons';

interface User {
  id: string;
  name: string;
  email: string;
  username: string;
}

interface UserTypeaheadProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  icon: React.ReactNode;
  users: User[];
  placeholder?: string;
  required?: boolean;
  onSelect?: (user: User) => void;
  className?: string;
}

export default function UserTypeahead({ label, value, onChange, icon, users, placeholder, required, onSelect, className }: UserTypeaheadProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState(value);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setQuery(value);
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const MIN_CHARS = 3;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    onChange(val); // Allow free text if they want, but show suggestions

    if (val.length >= MIN_CHARS) {
      const filtered = users.filter(user => 
        user.name.toLowerCase().includes(val.toLowerCase())
      );
      setFilteredUsers(filtered);
      setIsOpen(true);
    } else {
      setFilteredUsers([]);
      setIsOpen(false);
    }
  };

  const handleSelect = (user: User) => {
    setQuery(user.name);
    onChange(user.name);
    setIsOpen(false);
    if (onSelect) onSelect(user);
  };

  return (
    <div className="form-group" ref={containerRef} style={{ position: 'relative' }}>
      <label>{icon} {label}</label>
      <div className="typeahead-input-wrapper">
        <input
          required={required}
          value={query}
          onChange={handleInputChange}
          onFocus={() => {
            if (users.length > 0 && query.length >= 3) {
               setFilteredUsers(users.filter(u => u.name.toLowerCase().includes(query.toLowerCase())));
               setIsOpen(true);
            }
          }}
          placeholder={placeholder || `Type 3+ chars...`}
        />
        <div className="typeahead-icon">
          <Search size={14} />
        </div>
      </div>

      {isOpen && filteredUsers.length > 0 && (
        <div className="typeahead-dropdown fade-in">
          {filteredUsers.map(user => (
            <div 
              key={user.id} 
              className="typeahead-item"
              onClick={() => handleSelect(user)}
            >
              <div className="item-info">
                <strong>{user.name}</strong>
                <span>{user.username} • {user.email}</span>
              </div>
              {query === user.name && <Check size={14} className="check-icon" />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
