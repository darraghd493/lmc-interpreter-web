interface CheckboxProps {
    label: string;
    checked: boolean;
    onChange: (checked: boolean) => void;
}

export const Checkbox: React.FC<CheckboxProps> = ({ label, checked, onChange }) => {
    return (
        <div className="flex items-center">
            <input
                type="checkbox"
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded-sm"
                onChange={(e) => onChange(e.target.checked)}
                checked={checked}
            />
            <label className="gap-2 ms-2 text-sm font-medium text-gray-900 dark:text-gray-300">
                {label}
            </label>
        </div>
    );
};
