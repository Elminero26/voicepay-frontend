import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../../../hooks/useLanguage';
import { cn } from '../../../utils/cn';

interface PromptAutocompleteInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  className?: string;
}

const SYSTEM_VARIABLES = [
  { name: 'customer.name', descEs: 'Nombre del cliente', descEn: 'Customer name' },
  { name: 'customer.phone', descEs: 'Teléfono del cliente', descEn: 'Customer phone number' },
  { name: 'payment.amount', descEs: 'Monto a pagar', descEn: 'Payment amount' },
  { name: 'payment.currency', descEs: 'Moneda del pago', descEn: 'Payment currency' },
  { name: 'payment.status', descEs: 'Estado del pago', descEn: 'Payment status' },
  { name: 'system.date', descEs: 'Fecha actual', descEn: 'Current date' },
  { name: 'system.time', descEs: 'Hora actual', descEn: 'Current time' },
];

export const PromptAutocompleteInput: React.FC<PromptAutocompleteInputProps> = ({
  value,
  onChange,
  placeholder,
  rows = 3,
  className,
}) => {
  const { language } = useLanguage();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [triggerIdx, setTriggerIdx] = useState(-1);
  const [activeIndex, setActiveIndex] = useState(0);

  const filtered = SYSTEM_VARIABLES.filter(v =>
    v.name.toLowerCase().includes(query.toLowerCase())
  );

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    onChange(val);
    checkAndOpenDropdown(val, e.target.selectionStart);
  };

  const handleTextareaSelect = (e: React.SyntheticEvent<HTMLTextAreaElement>) => {
    const target = e.target as HTMLTextAreaElement;
    checkAndOpenDropdown(value, target.selectionStart);
  };

  const checkAndOpenDropdown = (text: string, selectionStart: number) => {
    const textBeforeCursor = text.slice(0, selectionStart);
    const lastTriggerIndex = textBeforeCursor.lastIndexOf('{{');

    if (lastTriggerIndex === -1) {
      setIsOpen(false);
      return;
    }

    const textBetweenTriggerAndCursor = textBeforeCursor.slice(lastTriggerIndex);
    if (textBetweenTriggerAndCursor.includes('}}')) {
      setIsOpen(false);
      return;
    }

    const q = textBetweenTriggerAndCursor.slice(2);
    if (/\s/.test(q)) {
      setIsOpen(false);
      return;
    }

    setIsOpen(true);
    setQuery(q);
    setTriggerIdx(lastTriggerIndex);
    setActiveIndex(0);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (!isOpen || filtered.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((prev) => (prev + 1) % filtered.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((prev) => (prev - 1 + filtered.length) % filtered.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      insertVariable(filtered[activeIndex].name);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setIsOpen(false);
    }
  };

  const insertVariable = (varName: string) => {
    const textarea = textareaRef.current;
    if (!textarea || triggerIdx === -1) return;

    const before = value.slice(0, triggerIdx);
    const after = value.slice(textarea.selectionStart);
    const replacement = `{{${varName}}}`;
    const newValue = before + replacement + after;

    onChange(newValue);
    setIsOpen(false);

    setTimeout(() => {
      textarea.focus();
      const newCursorPos = triggerIdx + replacement.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        textareaRef.current &&
        !textareaRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="relative w-full">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleTextareaChange}
        onSelect={handleTextareaSelect}
        onKeyDown={handleKeyDown}
        rows={rows}
        placeholder={placeholder}
        className={className}
      />
      {isOpen && filtered.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute z-[99] left-0 top-full mt-1.5 w-full bg-[#141416]/95 border border-white/10 backdrop-blur-xl rounded-2xl shadow-2xl max-h-48 overflow-y-auto p-1.5 custom-scrollbar"
        >
          {filtered.map((item, index) => {
            const isSelected = index === activeIndex;
            return (
              <button
                key={item.name}
                type="button"
                onClick={() => insertVariable(item.name)}
                className={cn(
                  "w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-left text-xs font-bold transition-all border border-transparent",
                  isSelected
                    ? "bg-primary/20 border-primary/25 text-primary"
                    : "text-text-secondary hover:bg-white/5 hover:text-white"
                )}
              >
                <span className={cn(
                  "font-mono tracking-tight",
                  isSelected ? "text-primary" : "text-white"
                )}>
                  {`{{${item.name}}}`}
                </span>
                <span className="text-[10px] opacity-60 font-medium tracking-tight">
                  {language === 'es' ? item.descEs : item.descEn}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
