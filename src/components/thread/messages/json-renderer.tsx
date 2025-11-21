import { useState } from "react";
import { ChevronRight, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface JsonRendererProps {
    data: any;
    level?: number;
    label?: string;
    defaultExpanded?: boolean;
}

function formatLabel(key: string): string {
    return key
        .split("_")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
}

export function JsonRenderer({
    data,
    level = 0,
    label,
    defaultExpanded = true,
}: JsonRendererProps) {
    const [isExpanded, setIsExpanded] = useState(defaultExpanded);
    const isObject = typeof data === "object" && data !== null && !Array.isArray(data);
    const isArray = Array.isArray(data);
    const isComplex = isObject || isArray;

    if (!isComplex) {
        return (
            <div className="flex items-start gap-2 py-1 font-mono text-sm">
                {label && <span className="font-medium text-gray-700">{formatLabel(label)}:</span>}
                <span className="text-gray-600 break-all">{String(data)}</span>
            </div>
        );
    }

    return (
        <div className={cn("w-full", level > 0 && "ml-4")}>
            {label && (
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        setIsExpanded(!isExpanded);
                    }}
                    className="flex items-center gap-1 py-1 text-sm font-medium text-gray-800 hover:text-gray-900"
                >
                    {isExpanded ? (
                        <ChevronDown className="size-3.5 text-gray-500" />
                    ) : (
                        <ChevronRight className="size-3.5 text-gray-500" />
                    )}
                    <span>{formatLabel(label)}</span>
                    {isArray && <span className="text-xs text-gray-400 ml-1">{data.length}</span>}
                </button>
            )}

            {(!label || isExpanded) && (
                <div className={cn("flex flex-col gap-1", label && "border-l border-gray-200 pl-3 my-1")}>
                    {isObject &&
                        Object.entries(data).map(([key, value]) => (
                            <JsonRenderer
                                key={key}
                                label={key}
                                data={value}
                                level={level + 1}
                                defaultExpanded={level < 1} // Auto-collapse deeper levels by default
                            />
                        ))}
                    {isArray &&
                        data.map((item: any, index: number) => (
                            <div key={index} className="flex items-start gap-2">
                                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gray-300" />
                                <div className="flex-1 min-w-0">
                                    <JsonRenderer
                                        data={item}
                                        level={level + 1}
                                        defaultExpanded={false}
                                    />
                                </div>
                            </div>
                        ))}
                </div>
            )}
        </div>
    );
}
