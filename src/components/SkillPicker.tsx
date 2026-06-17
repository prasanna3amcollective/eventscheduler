'use client';

import { Check } from '@/components/Icons';
import { SKILLS, type Skill } from '@/lib/constants';

interface SkillPickerProps {
  /** Currently selected skills */
  selected: Skill[];
  /** Called with the skill that was toggled */
  onToggle: (skill: Skill) => void;
  /** Optional id prefix for accessibility */
  idPrefix?: string;
}

/**
 * Accessible, no-dropdown skill picker.
 * Renders all skills as toggle pill buttons in a wrapping grid.
 * Selected skills show as filled yellow pills with a ✓.
 * One click adds, one click removes — zero ambiguity.
 */
export default function SkillPicker({ selected, onToggle, idPrefix = 'skill' }: SkillPickerProps) {
  return (
    <div className="skill-picker" role="group" aria-label="Select your skills">
      <div className="skill-picker__meta">
        <span className="skill-picker__hint">
          {selected.length === 0 ? 'Tap to select skills' : 'Tap again to deselect'}
        </span>
        {selected.length > 0 && (
          <span className="skill-picker__count" aria-live="polite">
            {selected.length} selected
          </span>
        )}
      </div>
      <div className="skill-picker__grid">
        {SKILLS.map((skill) => {
          const isSelected = selected.includes(skill);
          return (
            <button
              key={skill}
              id={`${idPrefix}-${skill.toLowerCase().replace(/\s+/g, '-')}`}
              type="button"
              role="checkbox"
              aria-checked={isSelected}
              onClick={() => onToggle(skill)}
              className={`skill-pill${isSelected ? ' skill-pill--selected' : ''}`}
            >
              {isSelected && (
                <span className="skill-pill__check" aria-hidden="true">
                  <Check size={12} />
                </span>
              )}
              {skill}
            </button>
          );
        })}
      </div>
    </div>
  );
}
