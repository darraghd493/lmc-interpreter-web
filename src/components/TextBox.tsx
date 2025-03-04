import { useEffect, useRef } from "react";

interface TextBoxProps {
    text: string;
    maxLength: number;
    onChange: (text: string) => void;
}

export const TextBox: React.FC<TextBoxProps> = ({ text, maxLength, onChange }) => {
    const inputRef = useRef<HTMLInputElement>(null);
    
    useEffect(() => {
        const input = inputRef.current;
        if (input) {
            input.style.width = `${input.value.length}ch`;
        }
    }, [text]);

    return (
        <div className="flex items-center">
            <span>{'"'}</span>
            <input
                className="font-mono min-w-4"
                type="text"
                onChange={(e) => {
                    let text = e.target.value;
                    if (text.length > maxLength) {
                        text = text.slice(0, maxLength);
                    }
                    onChange(text);
                }}
                value={text}
                ref={inputRef}
            />
            <span>{'"'}</span>
        </div>
    );
};
