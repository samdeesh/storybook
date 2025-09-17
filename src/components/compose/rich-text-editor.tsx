import {
  useCallback,
  useEffect,
  useRef,
  useState
} from "react";
import { Bold, Heading2, Italic, List } from "lucide-react";
import { cn } from "../../lib/utils";
import { Button } from "../ui/button";

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  readOnly?: boolean;
}

export function RichTextEditor({ value, onChange, placeholder, readOnly }: RichTextEditorProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    if (!ref.current) return;
    if (ref.current.innerHTML !== value) {
      ref.current.innerHTML = value;
    }
  }, [value]);

  const exec = useCallback((command: string, value?: string) => {
    if (readOnly) return;
    document.execCommand(command, false, value ?? "");
    if (ref.current) {
      onChange(ref.current.innerHTML);
    }
  }, [onChange, readOnly]);

  const handleInput = useCallback(() => {
    if (!ref.current) return;
    onChange(ref.current.innerHTML);
  }, [onChange]);

  const handlePaste = useCallback((event: React.ClipboardEvent<HTMLDivElement>) => {
    event.preventDefault();
    const text = event.clipboardData.getData("text/plain");
    document.execCommand("insertText", false, text);
  }, []);

  return (
    <div className="flex flex-col rounded-md border border-input bg-background">
      <div className="flex items-center gap-1 border-b border-border px-2 py-1">
        <Button
          variant="ghost"
          size="icon"
          type="button"
          aria-label="Bold"
          onClick={() => exec("bold")}
          disabled={readOnly}
        >
          <Bold className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          type="button"
          aria-label="Italic"
          onClick={() => exec("italic")}
          disabled={readOnly}
        >
          <Italic className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          type="button"
          aria-label="Heading"
          onClick={() => exec("formatBlock", "h2")}
          disabled={readOnly}
        >
          <Heading2 className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          type="button"
          aria-label="Bulleted list"
          onClick={() => exec("insertUnorderedList")}
          disabled={readOnly}
        >
          <List className="h-4 w-4" />
        </Button>
      </div>
      <div
        ref={ref}
        className={cn(
          "min-h-[200px] w-full grow cursor-text space-y-2 px-3 py-2 text-sm outline-none", 
          isFocused ? "ring-0" : ""
        )}
        role="textbox"
        aria-multiline="true"
        contentEditable={!readOnly}
        data-placeholder={placeholder}
        suppressContentEditableWarning
        onInput={handleInput}
        onPaste={handlePaste}
        onFocus={() => setIsFocused(true)}
        onBlur={() => {
          setIsFocused(false);
          handleInput();
        }}
      />
    </div>
  );
}
